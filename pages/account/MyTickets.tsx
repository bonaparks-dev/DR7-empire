import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const MyTickets = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">{t('My_Tickets')}</h2>
                    <p className="text-sm text-gray-400 mt-1">Lottery tickets are no longer available.</p>
                </div>
            </div>
            <div className="p-6">
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-white">The lottery program has ended</h3>
                    <p className="text-gray-400 mt-2">Thank you for your interest.</p>
                </div>
            </div>
        </div>
    );
};

export default MyTickets;

