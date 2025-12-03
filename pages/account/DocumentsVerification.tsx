import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../supabaseClient';

const StatusBadge: React.FC<{ status: 'pending_verification' | 'verified' | 'rejected' }> = ({ status }) => {
    const statusMap = {
        pending_verification: { text: 'In Revisione', color: 'bg-yellow-500/20 text-yellow-400' },
        verified: { text: 'Verificato', color: 'bg-green-500/20 text-green-400' },
        rejected: { text: 'Rifiutato', color: 'bg-red-500/20 text-red-400' },
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[status].color}`}>{statusMap[status].text}</span>;
}

const DocumentsVerification = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
    const [loadingDocuments, setLoadingDocuments] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState({
        cartaIdentitaFront: null as File | null,
        cartaIdentitaBack: null as File | null,
        codiceFiscaleFront: null as File | null,
        codiceFiscaleBack: null as File | null,
        patenteFront: null as File | null,
        patenteBack: null as File | null
    });

    // Refresh user session on component mount
    useEffect(() => {
        const refreshSession = async () => {
            const { data: { session }, error } = await supabase.auth.refreshSession();
            if (error) {
                console.error('Failed to refresh session:', error);
            }
        };

        refreshSession();
    }, []);

    // Fetch uploaded documents
    useEffect(() => {
        const fetchDocuments = async () => {
            if (!user) return;

            setLoadingDocuments(true);
            try {
                const { data, error } = await supabase
                    .from('user_documents')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('upload_date', { ascending: false });

                if (error) throw error;
                setUploadedDocuments(data || []);
            } catch (error) {
                console.error('Failed to fetch documents:', error);
            } finally {
                setLoadingDocuments(false);
            }
        };

        fetchDocuments();
    }, [user]);

    const handleFileChange = (documentType: keyof typeof documents) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDocuments(prev => ({ ...prev, [documentType]: file }));
        }
    };

    const handleUploadDocuments = async () => {
        if (!user) return;

        // Check if at least CI or CF is uploaded
        const hasCI = documents.cartaIdentitaFront || documents.cartaIdentitaBack;
        const hasCF = documents.codiceFiscaleFront || documents.codiceFiscaleBack;

        if (!hasCI && !hasCF) {
            alert('Per favore carica almeno un documento (Carta d\'Identità o Codice Fiscale)');
            return;
        }

        setUploading(true);

        try {
            const uploads = [];

            for (const [key, file] of Object.entries(documents)) {
                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}/${key}_${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('user-documents')
                        .upload(fileName, file);

                    if (uploadError) {
                        console.error(`Failed to upload ${key}:`, uploadError);
                        continue;
                    }

                    uploads.push({
                        user_id: user.id,
                        document_type: key,
                        file_path: fileName,
                        upload_date: new Date().toISOString(),
                        status: 'pending_verification'
                    });
                }
            }

            if (uploads.length > 0) {
                const { error: dbError } = await supabase
                    .from('user_documents')
                    .insert(uploads);

                if (dbError) throw dbError;

                alert('Documenti caricati con successo! Saranno verificati a breve.');

                // Reset form and reload documents
                setDocuments({
                    cartaIdentitaFront: null,
                    cartaIdentitaBack: null,
                    codiceFiscaleFront: null,
                    codiceFiscaleBack: null,
                    patenteFront: null,
                    patenteBack: null
                });

                // Refetch documents
                const { data } = await supabase
                    .from('user_documents')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('upload_date', { ascending: false });

                setUploadedDocuments(data || []);
            }
        } catch (error: any) {
            console.error('Error uploading documents:', error);
            alert('Errore durante il caricamento dei documenti');
        } finally {
            setUploading(false);
        }
    };

    const getDocumentUrl = async (filePath: string) => {
        const { data } = await supabase.storage
            .from('user-documents')
            .createSignedUrl(filePath, 3600);

        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank');
        }
    };

    const getDocumentLabel = (docType: string) => {
        const labels: { [key: string]: string } = {
            cartaIdentitaFront: 'Carta d\'Identità (Fronte)',
            cartaIdentitaBack: 'Carta d\'Identità (Retro)',
            codiceFiscaleFront: 'Codice Fiscale (Fronte)',
            codiceFiscaleBack: 'Codice Fiscale (Retro)',
            patenteFront: 'Patente (Fronte)',
            patenteBack: 'Patente (Retro)'
        };
        return labels[docType] || docType;
    };

    if (!user) return null;

    const hasUploadedDocs = uploadedDocuments.length > 0;

    return (
        <div className="space-y-6">
            {/* Uploaded Documents Section */}
            {hasUploadedDocs && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-bold text-white">I Tuoi Documenti</h2>
                        <p className="text-sm text-gray-400 mt-1">Documenti caricati e il loro stato di verifica</p>
                    </div>

                    <div className="p-6">
                        {loadingDocuments ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                <p className="text-gray-400">Caricamento documenti...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {uploadedDocuments.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{getDocumentLabel(doc.document_type)}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Caricato il {new Date(doc.upload_date).toLocaleDateString('it-IT')}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <StatusBadge status={doc.status} />
                                            <button
                                                onClick={() => getDocumentUrl(doc.file_path)}
                                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                                            >
                                                Visualizza
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Upload New Documents Section */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Carica Documenti</h2>
                    <p className="text-sm text-gray-400 mt-1">Carica i tuoi documenti per la verifica dell'account</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Carta d'Identità */}
                    <div className="space-y-3">
                        <h3 className="text-white font-semibold">Carta d'Identità *</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Fronte</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange('cartaIdentitaFront')}
                                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                                />
                                {documents.cartaIdentitaFront && (
                                    <p className="text-xs text-green-400 mt-1">✓ {documents.cartaIdentitaFront.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Retro</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange('cartaIdentitaBack')}
                                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                                />
                                {documents.cartaIdentitaBack && (
                                    <p className="text-xs text-green-400 mt-1">✓ {documents.cartaIdentitaBack.name}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Codice Fiscale */}
                    <div className="space-y-3">
                        <h3 className="text-white font-semibold">Codice Fiscale *</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Fronte</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange('codiceFiscaleFront')}
                                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                                />
                                {documents.codiceFiscaleFront && (
                                    <p className="text-xs text-green-400 mt-1">✓ {documents.codiceFiscaleFront.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Retro</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange('codiceFiscaleBack')}
                                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                                />
                                {documents.codiceFiscaleBack && (
                                    <p className="text-xs text-green-400 mt-1">✓ {documents.codiceFiscaleBack.name}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Patente (Optional) */}
                    <div className="space-y-3">
                        <h3 className="text-white font-semibold">Patente (Opzionale)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Fronte</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange('patenteFront')}
                                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                                />
                                {documents.patenteFront && (
                                    <p className="text-xs text-green-400 mt-1">✓ {documents.patenteFront.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Retro</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange('patenteBack')}
                                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                                />
                                {documents.patenteBack && (
                                    <p className="text-xs text-green-400 mt-1">✓ {documents.patenteBack.name}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleUploadDocuments}
                        disabled={uploading}
                        className="w-full md:w-auto px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60"
                    >
                        {uploading ? 'Caricamento...' : 'Carica Documenti'}
                    </button>

                    <p className="text-xs text-gray-400 mt-2">
                        * È necessario caricare almeno un documento tra Carta d'Identità o Codice Fiscale
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DocumentsVerification;