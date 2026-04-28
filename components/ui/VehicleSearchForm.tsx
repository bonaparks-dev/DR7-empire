import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { motion } from 'framer-motion';

export interface SearchFormData {
    pickupLocation: string;
    returnLocation: string;
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    returnTime: string;
    ageBracket: 'under26' | '26to69';
}

interface VehicleSearchFormProps {
    onSearch: (data: SearchFormData) => void;
    isSearching: boolean;
    category: string; // 'cars' | 'urban-cars' | 'corporate-fleet'
}

// Office hours — slot ogni 15 minuti, sabato uguale a Mon-Fri.
// Coerente con CarBookingWizard.tsx (unica fonte di verità).
function buildSlots(...windows: Array<[number, number]>): string[] {
    const out: string[] = [];
    for (const [startMin, endMin] of windows) {
        for (let m = startMin; m <= endMin; m += 15) {
            out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
        }
    }
    return out;
}

// Pickup Mon-Sat: 10:30-12:30, 16:30-18:30
const PICKUP_TIMES = buildSlots([10 * 60 + 30, 12 * 60 + 30], [16 * 60 + 30, 18 * 60 + 30]);
const PICKUP_TIMES_SAT = PICKUP_TIMES;

// Return Mon-Sat: 9:00-11:00, 15:00-17:00
const RETURN_TIMES = buildSlots([9 * 60, 11 * 60], [15 * 60, 17 * 60]);
const RETURN_TIMES_SAT = RETURN_TIMES;

const LOCATIONS = [
    'Cagliari Centro',
    'Aeroporto Cagliari Elmas',
    'Villasimius',
    'Costa Rei',
    'Pula',
    'Chia',
];

const VehicleSearchForm: React.FC<VehicleSearchFormProps> = ({ onSearch, isSearching, category }) => {
    const { t } = useTranslation();

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const [formData, setFormData] = useState<SearchFormData>({
        pickupLocation: LOCATIONS[0],
        returnLocation: LOCATIONS[0],
        pickupDate: formatDate(tomorrow),
        pickupTime: '10:30',
        returnDate: formatDate(dayAfter),
        returnTime: '10:00',
        ageBracket: '26to69',
    });

    const [sameLocation, setSameLocation] = useState(true);

    const getDayOfWeek = (dateStr: string) => new Date(dateStr + 'T12:00:00').getDay();

    const pickupTimesForDay = useMemo(() => {
        const day = getDayOfWeek(formData.pickupDate);
        if (day === 0) return []; // Sunday closed
        if (day === 6) return PICKUP_TIMES_SAT;
        return PICKUP_TIMES;
    }, [formData.pickupDate]);

    const returnTimesForDay = useMemo(() => {
        const day = getDayOfWeek(formData.returnDate);
        if (day === 0) return []; // Sunday closed
        if (day === 6) return RETURN_TIMES_SAT;
        return RETURN_TIMES;
    }, [formData.returnDate]);

    const isSunday = (dateStr: string) => getDayOfWeek(dateStr) === 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch({
            ...formData,
            returnLocation: sameLocation ? formData.pickupLocation : formData.returnLocation,
        });
    };

    const update = (key: keyof SearchFormData, value: string) => {
        setFormData(prev => {
            const next = { ...prev, [key]: value };
            // Auto-adjust return date if pickup date changes to be after it
            if (key === 'pickupDate' && value >= prev.returnDate) {
                const nextDay = new Date(value + 'T12:00:00');
                nextDay.setDate(nextDay.getDate() + 1);
                next.returnDate = formatDate(nextDay);
            }
            return next;
        });
    };

    const categoryLabel = category === 'urban-cars' ? 'Urban' : category === 'corporate-fleet' ? 'Flotta Aziendale' : 'Supercar & Luxury';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-5 md:p-8"
        >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {t('Search_Available_Vehicles') || `Cerca ${categoryLabel}`}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
                {t('Select_dates_and_verify') || 'Seleziona le date e verifica la disponibilità'}
            </p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Pickup Location */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Luogo Ritiro</label>
                        <select
                            value={formData.pickupLocation}
                            onChange={e => update('pickupLocation', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-white focus:border-white transition"
                        >
                            {LOCATIONS.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>

                    {/* Pickup Date */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Data Ritiro</label>
                        <input
                            type="date"
                            value={formData.pickupDate}
                            onChange={e => update('pickupDate', e.target.value)}
                            min={formatDate(tomorrow)}
                            className={`w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-white ${isSunday(formData.pickupDate) ? 'border-red-500' : ''}`}
                        />
                        {isSunday(formData.pickupDate) && (
                            <p className="text-xs text-red-400 mt-1">Chiusi la domenica</p>
                        )}
                    </div>

                    {/* Pickup Time */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Ora Ritiro</label>
                        <select
                            value={formData.pickupTime}
                            onChange={e => update('pickupTime', e.target.value)}
                            disabled={pickupTimesForDay.length === 0}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-white focus:border-white transition disabled:opacity-50"
                        >
                            {pickupTimesForDay.length === 0 ? (
                                <option>Chiuso</option>
                            ) : (
                                pickupTimesForDay.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Age Bracket */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Età Conducente</label>
                        <select
                            value={formData.ageBracket}
                            onChange={e => update('ageBracket', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-white focus:border-white transition"
                        >
                            <option value="under26">21-25 anni</option>
                            <option value="26to69">26-69 anni</option>
                        </select>
                    </div>

                    {/* Return Location (if different) */}
                    {!sameLocation && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">Luogo Riconsegna</label>
                            <select
                                value={formData.returnLocation}
                                onChange={e => update('returnLocation', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-white focus:border-white transition"
                            >
                                {LOCATIONS.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Return Date */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Data Riconsegna</label>
                        <input
                            type="date"
                            value={formData.returnDate}
                            onChange={e => update('returnDate', e.target.value)}
                            min={formData.pickupDate}
                            className={`w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-white ${isSunday(formData.returnDate) ? 'border-red-500' : ''}`}
                        />
                        {isSunday(formData.returnDate) && (
                            <p className="text-xs text-red-400 mt-1">Chiusi la domenica</p>
                        )}
                    </div>

                    {/* Return Time */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Ora Riconsegna</label>
                        <select
                            value={formData.returnTime}
                            onChange={e => update('returnTime', e.target.value)}
                            disabled={returnTimesForDay.length === 0}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-white focus:border-white transition disabled:opacity-50"
                        >
                            {returnTimesForDay.length === 0 ? (
                                <option>Chiuso</option>
                            ) : (
                                returnTimesForDay.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                {/* Same location toggle */}
                <div className="mt-4">
                    <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300">
                        <input
                            type="checkbox"
                            checked={sameLocation}
                            onChange={e => setSameLocation(e.target.checked)}
                            className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-white focus:ring-white"
                        />
                        <span>Stessa sede per ritiro e riconsegna</span>
                    </label>
                </div>

                {/* Search button */}
                <div className="mt-6 flex justify-center">
                    <button
                        type="submit"
                        disabled={isSearching || isSunday(formData.pickupDate) || isSunday(formData.returnDate)}
                        className="px-10 py-3.5 bg-white text-black font-bold rounded-full text-sm uppercase tracking-wider hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
                    >
                        {isSearching ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Verifica in corso...
                            </>
                        ) : (
                            'VERIFICA DISPONIBILITÀ'
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default VehicleSearchForm;
