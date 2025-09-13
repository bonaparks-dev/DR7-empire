import React from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';

const CareersPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <LegalPageLayout title={t('Careers')}>
            <p>Join a team that is passionate about luxury and dedicated to providing unparalleled experiences. At DR7, we are always looking for exceptional talent to help us push the boundaries of excellence.</p>
            
            <h2>Current Openings</h2>
            
            <div className="mt-8 space-y-6">
                <div>
                    <h3>Luxury Experience Curator</h3>
                    <p className="text-sm text-stone-400">Location: Cagliari, Italy | Full-time</p>
                    <p className="mt-2">We are seeking a creative and detail-oriented individual to design and manage bespoke luxury experiences for our elite clientele.</p>
                </div>
                <div>
                    <h3>Client Relations Specialist</h3>
                    <p className="text-sm text-stone-400">Location: Remote | Full-time</p>
                    <p className="mt-2">As a Client Relations Specialist, you will be the primary point of contact for our members, ensuring their needs are met with the highest level of service.</p>
                </div>
            </div>

            <h2 className="mt-12">How to Apply</h2>
            <p>If you believe you have what it takes to be a part of the DR7 Empire, please send your resume and a cover letter to careers@dr7.example.com.</p>
        </LegalPageLayout>
    );
};

export default CareersPage;