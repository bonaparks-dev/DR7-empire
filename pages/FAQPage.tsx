import React from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';

const FAQPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <LegalPageLayout title={t('FAQ')}>
            <div className="space-y-8">
                <div>
                    <h3>What are the requirements to rent a car?</h3>
                    <p>Renters must be at least 25 years of age, possess a valid driver's license, and provide proof of full coverage insurance. A security deposit is also required for all car rentals.</p>
                </div>
                <div>
                    <h3>How does the DR7 Club membership work?</h3>
                    <p>Our exclusive membership provides access to preferential rates, priority booking, 24/7 concierge services, and invitations to private events. You can choose from monthly or annual billing cycles across three different tiers.</p>
                </div>
                <div>
                    <h3>What is your cancellation policy?</h3>
                    <p>Cancellation policies vary depending on the service booked. For specific details, please refer to the Rental Agreement provided at the time of your booking confirmation or contact our support team.</p>
                </div>
                 <div>
                    <h3>What payment methods do you accept?</h3>
                    <p>We accept major credit cards (Visa, MasterCard, American Express) as well as select cryptocurrencies. Payment options will be presented during the checkout process.</p>
                </div>
            </div>
        </LegalPageLayout>
    );
};

export default FAQPage;