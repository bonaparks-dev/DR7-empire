import React from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';

const RentalAgreementPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <LegalPageLayout title={t('Rental_Agreement')}>
            <p><strong>Important Notice:</strong> This document provides a general overview of the typical terms and conditions governing the rental of luxury assets through the DR7 Empire platform. DR7 acts as a broker and is not a party to the final rental contract. The legally binding agreement ("Rental Agreement") will be between you ("the Renter") and the third-party asset owner ("the Owner"), and its specific terms may vary.</p>
            
            <h2>1. The Brokerage Role of DR7</h2>
            <p>DR7 facilitates the connection between the Renter and the Owner. We are not the owner or operator of the assets listed. This document is intended to provide a summary of common terms to expect in the Owner's final Rental Agreement.</p>

            <h2>2. Key Parties</h2>
            <ul>
                <li><strong>The Renter ("you"):</strong> The client booking the asset.</li>
                <li><strong>The Owner:</strong> The third-party company or individual who owns and provides the asset for rent.</li>
                <li><strong>DR7 Empire ("the Broker"):</strong> The intermediary facilitating the transaction.</li>
            </ul>
            
            <h2>3. General Renter Obligations</h2>
            <p>The final Rental Agreement with the Owner will typically require the Renter to:</p>
            <ul>
                <li>Meet minimum age and licensing requirements (e.g., 25+ with a valid driver's license for cars).</li>
                <li>Provide a security deposit against potential damages, fines, or other incidental charges.</li>
                <li>Operate the asset safely and in accordance with all applicable laws and the Owner's specific rules.</li>
                <li>Return the asset at the agreed time and location, in the same condition it was received, allowing for normal wear and tear.</li>
            </ul>
            
            <h2>4. Insurance and Liability</h2>
            <p>Insurance for the asset is provided by the Owner, not by DR7. The specifics of the coverage, including the deductible (excess) amount for which you are responsible in case of damage, will be detailed in the Owner's Rental Agreement. The Renter is typically liable for all damages, losses, and legal violations that are not covered by the Owner's insurance policy. DR7 is not liable for any incidents related to the asset.</p>
            
            <h2>5. Prohibited Uses</h2>
            <p>Every Rental Agreement will contain a list of prohibited uses. These almost universally include, but are not limited to:</p>
            <ul>
                <li>Use for any illegal purpose.</li>
                <li>Participation in races, competitions, or performance tests.</li>
                <li>Operation by any person not explicitly authorized in the Rental Agreement.</li>
                <li>Use while under the influence of alcohol, narcotics, or other impairing substances.</li>
                <li>Use outside of the contractually permitted geographical area.</li>
            </ul>

            <h2>6. Final Agreement</h2>
            <p>Upon confirmation of your booking request, you will be presented with the Owner's final Rental Agreement. You must read, understand, and agree to its terms before the rental can commence. By proceeding with the booking, you acknowledge that DR7 is solely a broker and that your legal relationship for the rental is with the Owner of the asset.</p>
        </LegalPageLayout>
    );
};

export default RentalAgreementPage;