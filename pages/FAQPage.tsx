import React, { useEffect, useState } from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';
import { getFaqEntries, type FaqEntry } from '../utils/siteCopy';

const FAQPage: React.FC = () => {
    const { t } = useTranslation();
    const [entries, setEntries] = useState<FaqEntry[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        getFaqEntries().then((rows) => {
            if (!cancelled) setEntries(rows);
        });
        return () => { cancelled = true; };
    }, []);

    return (
        <LegalPageLayout title={t('FAQ')}>
            <div className="space-y-8">
                {entries === null ? (
                    <p className="text-gray-400 text-sm">Caricamento…</p>
                ) : (
                    entries.map((e) => (
                        <div key={e.id}>
                            <h3>{e.question}</h3>
                            <p>{e.answer}</p>
                        </div>
                    ))
                )}
            </div>
        </LegalPageLayout>
    );
};

export default FAQPage;
