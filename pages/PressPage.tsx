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
            
            <h2 className="mt-12">Press Releases</h2>
            <p>Currently, there are no new press releases. Please check back later for updates on our latest announcements and achievements.</p>
        </LegalPageLayout>
    );
};

export default PressPage;
