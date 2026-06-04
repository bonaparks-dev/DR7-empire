import React, { useEffect, useState } from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import LegalDocumentRenderer from '../components/layout/LegalDocumentRenderer';
import { useTranslation } from '../hooks/useTranslation';
import { getLegalPage, type LegalPageCopy } from '../utils/siteCopy';

const RentalAgreementPage: React.FC = () => {
    const { t } = useTranslation();
    const [copy, setCopy] = useState<LegalPageCopy | null | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        getLegalPage('rental_agreement').then((c) => { if (!cancelled) setCopy(c); });
        return () => { cancelled = true; };
    }, []);

    if (copy === undefined) {
        return <LegalPageLayout title={t('Rental_Agreement')}><p>Loading…</p></LegalPageLayout>;
    }
    if (copy) return <LegalDocumentRenderer copy={copy} />;

    return (
        <LegalPageLayout title={t('Rental_Agreement')}>
            <p><strong>Important Notice:</strong> This document provides a general overview of the typical terms and conditions governing the rental of luxury assets through the DR7 platform. DR7 acts as a broker and is not a party to the final rental contract.</p>
            <h2>1. The Brokerage Role of DR7</h2>
            <p>DR7 facilitates the connection between the Renter and the Owner. We are not the owner or operator of the assets listed.</p>
        </LegalPageLayout>
    );
};

export default RentalAgreementPage;
