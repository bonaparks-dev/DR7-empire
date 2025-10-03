import React from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';

const PressPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <LegalPageLayout title={t('Press')}>
            <h2>Media Inquiries</h2>
            <p>For all media inquiries, interviews, or other press-related matters, please contact our media relations team. We are happy to provide information about our company, services, and vision for the future of luxury.</p>
            <p>
                <strong>Email:</strong> <a href="mailto:amministrazione@dr7luxuryempire.com">amministrazione@dr7luxuryempire.com</a>
            </p>
            
            <h2 className="mt-12">In the News</h2>

            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">
                            Dubai Rent 7.0: la startup sarda che insegue Elon Musk (e punta a superarlo)
                        </h3>
                        <p className="text-sm text-gray-400 mb-3">
                            Casteddu Online • 16 Giugno 2025
                        </p>
                        <p className="text-gray-300 mb-4">
                            Nata da zero nel 2024, già S.p.A. in 12 mesi. Ora prepara l'espansione globale e una holding da €500 miliardi entro il 2030.
                        </p>
                        <a
                            href="https://www.castedduonline.it/dubai-rent-7-0-la-startup-sarda-che-insegue-elon-musk-e-punta-a-superarlo/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-white hover:text-gray-300 transition-colors"
                        >
                            {t('Read_full_article')} →
                        </a>
                    </div>
                </div>
            </div>

            <h2 className="mt-12">Press Releases</h2>
            <p>For more information about our latest announcements and achievements, please contact our media relations team.</p>
        </LegalPageLayout>
    );
};

export default PressPage;
