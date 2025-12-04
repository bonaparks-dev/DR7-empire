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
    const [uploadedSteps, setUploadedSteps] = useState<Set<number>>(new Set());
    const [files, setFiles] = useState<{ [key: number]: File | null }>({});

    // Define upload steps
    const uploadSteps = [
        { key: 'cartaIdentitaFront', label: 'Carta d\'Identità (Fronte)', bucket: 'carta-identita', required: true },
        { key: 'cartaIdentitaBack', label: 'Carta d\'Identità (Retro)', bucket: 'carta-identita', required: true },
        { key: 'codiceFiscaleFront', label: 'Codice Fiscale (Fronte)', bucket: 'codice-fiscale', required: true },
        { key: 'codiceFiscaleBack', label: 'Codice Fiscale (Retro)', bucket: 'codice-fiscale', required: true },
        { key: 'patenteFront', label: 'Patente (Fronte) - Opzionale', bucket: 'driver-licenses', required: false },
        { key: 'patenteBack', label: 'Patente (Retro) - Opzionale', bucket: 'driver-licenses', required: false }
    ];

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

    // Fetch uploaded documents from storage buckets
    // DISABLED temporarily to prevent connection flooding
    // Documents can be viewed in admin panel
    useEffect(() => {
        // Skip fetching to avoid connection issues
        setLoadingDocuments(false);
        setUploadedDocuments([]);
    }, [user?.id]);

    const handleFileChange = (stepIndex: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFiles(prev => ({ ...prev, [stepIndex]: file }));
        }
    };

    const handleUploadStep = async (stepIndex: number) => {
        if (!user || !files[stepIndex]) return;

        const step = uploadSteps[stepIndex];
        setUploading(true);

        try {
            console.log(`Uploading ${step.key} to ${step.bucket} via Netlify function`);

            const formData = new FormData();
            formData.append('file', files[stepIndex]!);
            formData.append('bucket', step.bucket);
            formData.append('userId', user.id);
            formData.append('prefix', step.key);
            formData.append('userEmail', user.email || '');
            formData.append('userFullName', user.fullName || '');

            const response = await fetch('/.netlify/functions/upload-file', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.ok) {
                console.log(`Successfully uploaded ${step.key} to ${result.path}`);

                // Mark step as uploaded
                setUploadedSteps(prev => new Set(prev).add(stepIndex));

                // Clear file
                setFiles(prev => ({ ...prev, [stepIndex]: null }));

                alert(`${step.label} caricato con successo!`);
            } else {
                throw new Error('Upload response not OK');
            }
        } catch (error: any) {
            console.error(`Exception uploading ${step.key}:`, error);
            alert(`Errore nel caricamento: ${error.message || 'Upload failed'}`);
        } finally {
            setUploading(false);
        }
    };

    const getDocumentUrl = async (doc: any) => {
        const { data } = await supabase.storage
            .from(doc.bucket)
            .createSignedUrl(doc.file_path, 3600);

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
                                                onClick={() => getDocumentUrl(doc)}
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

            {/* Upload New Documents Section - All at Once */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Carica Documenti</h2>
                    <p className="text-sm text-gray-400 mt-1">Seleziona e carica i tuoi documenti per la verifica</p>
                </div>

                <div className="p-6 space-y-4">
                    {uploadSteps.map((step, index) => {
                        const isUploaded = uploadedSteps.has(index);
                        const hasFile = files[index] !== null && files[index] !== undefined;

                        return (
                            <div
                                key={index}
                                className={`bg-gray-800/50 border ${isUploaded ? 'border-green-500/50' : 'border-gray-700'} rounded-lg p-4`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-base font-semibold text-white">
                                                {step.label}
                                            </h3>
                                            {!step.required && (
                                                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                                                    Opzionale
                                                </span>
                                            )}
                                            {isUploaded && (
                                                <span className="text-xs text-green-400 flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Caricato
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={handleFileChange(index)}
                                                disabled={isUploaded}
                                                className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            {hasFile && !isUploaded && (
                                                <p className="text-xs text-gray-400">
                                                    Selezionato: {files[index]?.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleUploadStep(index)}
                                        disabled={uploading || !hasFile || isUploaded}
                                        className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        {isUploaded ? 'Caricato ✓' : uploading ? 'Caricamento...' : 'Carica'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    <div className="pt-4 border-t border-gray-700">
                        <p className="text-xs text-gray-400">
                            * Carica almeno Carta d'Identità e Codice Fiscale (fronte e retro). La Patente è opzionale.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            I documenti saranno verificati dal nostro team entro 24-48 ore.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentsVerification;