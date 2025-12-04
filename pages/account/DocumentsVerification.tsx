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
    const [currentStep, setCurrentStep] = useState(0);
    const [currentFile, setCurrentFile] = useState<File | null>(null);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCurrentFile(file);
        }
    };

    const handleUploadCurrentStep = async () => {
        if (!user || !currentFile) return;

        const step = uploadSteps[currentStep];
        setUploading(true);

        try {
            console.log(`Uploading ${step.key} to ${step.bucket} via Netlify function`);

            const formData = new FormData();
            formData.append('file', currentFile);
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

                // Clear current file and move to next step
                setCurrentFile(null);

                // Move to next step or finish
                if (currentStep < uploadSteps.length - 1) {
                    setCurrentStep(currentStep + 1);
                } else {
                    alert('Tutti i documenti sono stati caricati con successo! Saranno verificati a breve.');
                    setCurrentStep(0); // Reset to beginning
                }
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

    const handleSkipStep = () => {
        const step = uploadSteps[currentStep];
        if (!step.required) {
            setCurrentFile(null);
            if (currentStep < uploadSteps.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                alert('Processo completato!');
                setCurrentStep(0);
            }
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setCurrentFile(null);
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

            {/* Upload New Documents Section - Step by Step */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Carica Documenti</h2>
                    <p className="text-sm text-gray-400 mt-1">Carica i tuoi documenti uno alla volta</p>
                </div>

                <div className="p-6">
                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">Passo {currentStep + 1} di {uploadSteps.length}</span>
                            <span className="text-sm text-gray-400">{Math.round(((currentStep) / uploadSteps.length) * 100)}% completato</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-white h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentStep) / uploadSteps.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Current Step */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-bold text-white mb-2">
                            {uploadSteps[currentStep].label}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            {uploadSteps[currentStep].required
                                ? 'Questo documento è obbligatorio'
                                : 'Questo documento è opzionale - puoi saltare'}
                        </p>

                        <div className="space-y-4">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                            />
                            {currentFile && (
                                <div className="flex items-center gap-2 text-green-400 text-sm">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>File selezionato: {currentFile.name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 flex-wrap">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePreviousStep}
                                disabled={uploading}
                                className="px-6 py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors disabled:opacity-60"
                            >
                                ← Indietro
                            </button>
                        )}

                        <button
                            onClick={handleUploadCurrentStep}
                            disabled={uploading || !currentFile}
                            className="flex-1 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Caricamento...' : 'Carica e Continua'}
                        </button>

                        {!uploadSteps[currentStep].required && (
                            <button
                                onClick={handleSkipStep}
                                disabled={uploading}
                                className="px-6 py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors disabled:opacity-60"
                            >
                                Salta →
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-gray-400 mt-4">
                        Carica un documento alla volta. I file saranno verificati dal nostro team.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DocumentsVerification;