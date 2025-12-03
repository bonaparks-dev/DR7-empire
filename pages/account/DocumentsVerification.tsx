import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../supabaseClient';

const FUNCTIONS_BASE =
  import.meta.env.VITE_FUNCTIONS_BASE ??
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:8888'
    : window.location.origin);

const StatusBadge: React.FC<{ status: 'unverified' | 'pending' | 'verified' }> = ({ status }) => {
    const { t } = useTranslation();
    const statusMap = {
        unverified: { text: t('Unverified'), color: 'bg-red-500/20 text-red-400' },
        pending: { text: t('Pending'), color: 'bg-yellow-500/20 text-yellow-400' },
        verified: { text: t('Verified'), color: 'bg-green-500/20 text-green-400' },
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[status].color}`}>{statusMap[status].text}</span>;
}

const DocumentsVerification = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
    const [cartaIdentita, setCartaIdentita] = useState<File | null>(null);
    const [codiceFiscale, setCodiceFiscale] = useState<File | null>(null);
    const [uploadedDocs, setUploadedDocs] = useState<{ carta: boolean; codice: boolean }>({ carta: false, codice: false });

    useEffect(() => {
        checkUploadedDocuments();
    }, [user]);

    const checkUploadedDocuments = async () => {
        if (!user) return;

        try {
            // Check if documents exist in storage
            const { data: cartaFiles } = await supabase.storage
                .from('carta-identita')
                .list(`${user.id}/`);

            const { data: codiceFiles } = await supabase.storage
                .from('codice-fiscale')
                .list(`${user.id}/`);

            setUploadedDocs({
                carta: (cartaFiles && cartaFiles.length > 0) || false,
                codice: (codiceFiles && codiceFiles.length > 0) || false
            });
        } catch (error) {
            console.error('Error checking documents:', error);
        }
    };

    const uploadToBucket = async (bucket: string, userId: string, file: File, prefix: string): Promise<boolean> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bucket', bucket);
            formData.append('userId', userId);
            formData.append('prefix', prefix);

            const response = await fetch(`${FUNCTIONS_BASE}/.netlify/functions/upload-file`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            return true;
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Errore nel caricamento: ${error.message}`);
            return false;
        }
    };

    const handleUpload = async (docType: 'carta' | 'codice') => {
        if (!user) return;

        const file = docType === 'carta' ? cartaIdentita : codiceFiscale;
        if (!file) {
            alert('Seleziona un file da caricare');
            return;
        }

        setUploading({ ...uploading, [docType]: true });

        try {
            const bucket = docType === 'carta' ? 'carta-identita' : 'codice-fiscale';
            const prefix = docType === 'carta' ? 'carta' : 'codice';

            const success = await uploadToBucket(bucket, user.id, file, prefix);

            if (success) {
                alert('Documento caricato con successo! Il nostro team lo verificherà a breve.');
                if (docType === 'carta') setCartaIdentita(null);
                else setCodiceFiscale(null);
                await checkUploadedDocuments();
            }
        } catch (error: any) {
            console.error('Error uploading document:', error);
            alert(`Errore: ${error.message}`);
        } finally {
            setUploading({ ...uploading, [docType]: false });
        }
    };

    if (!user) return null;

    const { idStatus } = user.verification;
    const allDocsUploaded = uploadedDocs.carta && uploadedDocs.codice;

    return (
         <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Verifica Documenti</h2>
                    <p className="text-sm text-gray-400 mt-1">Carica i tuoi documenti per la verifica</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Stato:</span>
                    <StatusBadge status={allDocsUploaded ? 'pending' : 'unverified'} />
                </div>
            </div>

            {allDocsUploaded && (
                <div className="p-6 text-center bg-yellow-900/20">
                    <h3 className="font-bold text-yellow-300">Documenti Inviati</h3>
                    <p className="text-sm text-yellow-400 mt-1">I tuoi documenti sono in fase di verifica da parte del nostro team.</p>
                </div>
            )}

            {idStatus === 'verified' && (
                <div className="p-6 text-center bg-green-900/20">
                    <h3 className="font-bold text-green-300">Account Verificato</h3>
                    <p className="text-sm text-green-400 mt-1">La tua identità è stata verificata con successo.</p>
                </div>
            )}

            <div className="p-6 space-y-6">
                {/* Info Box */}
                <div className="bg-blue-900/30 border-2 border-blue-500 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-blue-400 text-2xl">ℹ️</div>
                        <div className="flex-1">
                            <h4 className="text-blue-300 font-semibold mb-2">Carica i Tuoi Documenti</h4>
                            <div className="space-y-1 text-sm text-blue-200">
                                <p>Per completare la verifica del tuo account, carica i seguenti documenti:</p>
                                <ul className="list-disc list-inside mt-2">
                                    <li>Carta d'Identità (fronte e retro)</li>
                                    <li>Codice Fiscale</li>
                                </ul>
                                <p className="text-xs mt-2 text-blue-300">Formati supportati: JPG, PNG, PDF • Massimo 5MB per file</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Carta d'Identità */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h4 className="text-lg font-semibold text-yellow-500">Carta d'Identità</h4>
                            <p className="text-sm text-gray-400 mt-1">Carica fronte e retro della tua carta d'identità</p>
                        </div>
                        {uploadedDocs.carta && (
                            <span className="px-3 py-1 bg-green-900/50 text-green-400 text-xs font-medium rounded">
                                Caricato
                            </span>
                        )}
                    </div>
                    <div className="space-y-3">
                        <input
                            type="file"
                            onChange={(e) => setCartaIdentita(e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm
                                file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                                file:text-sm file:font-semibold file:bg-yellow-500 file:text-black
                                hover:file:bg-yellow-600 file:cursor-pointer"
                            accept="image/*,.pdf"
                            disabled={uploading.carta}
                        />
                        {cartaIdentita && (
                            <p className="text-xs text-gray-400">
                                File selezionato: {cartaIdentita.name} ({(cartaIdentita.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                        <button
                            onClick={() => handleUpload('carta')}
                            disabled={!cartaIdentita || uploading.carta}
                            className="w-full px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {uploading.carta ? 'Caricamento...' : 'Carica Carta d\'Identità'}
                        </button>
                    </div>
                </div>

                {/* Codice Fiscale */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h4 className="text-lg font-semibold text-yellow-500">Codice Fiscale</h4>
                            <p className="text-sm text-gray-400 mt-1">Carica il tuo codice fiscale</p>
                        </div>
                        {uploadedDocs.codice && (
                            <span className="px-3 py-1 bg-green-900/50 text-green-400 text-xs font-medium rounded">
                                Caricato
                            </span>
                        )}
                    </div>
                    <div className="space-y-3">
                        <input
                            type="file"
                            onChange={(e) => setCodiceFiscale(e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm
                                file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                                file:text-sm file:font-semibold file:bg-yellow-500 file:text-black
                                hover:file:bg-yellow-600 file:cursor-pointer"
                            accept="image/*,.pdf"
                            disabled={uploading.codice}
                        />
                        {codiceFiscale && (
                            <p className="text-xs text-gray-400">
                                File selezionato: {codiceFiscale.name} ({(codiceFiscale.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                        <button
                            onClick={() => handleUpload('codice')}
                            disabled={!codiceFiscale || uploading.codice}
                            className="w-full px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {uploading.codice ? 'Caricamento...' : 'Carica Codice Fiscale'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentsVerification;