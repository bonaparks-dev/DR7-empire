
import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RENTAL_CATEGORIES, AIRPORTS } from '../constants';
import type { RentalItem } from '../types';
import RentalCard from '../components/ui/RentalCard';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';
import { useVerification } from '../hooks/useVerification';

const JetSearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { checkVerificationAndProceed } = useVerification();

    const searchCriteria = useMemo(() => ({
        tripType: searchParams.get('tripType') || 'one-way',
        departure: searchParams.get('departure'),
        arrival: searchParams.get('arrival'),
        departureDate: searchParams.get('departureDate'),
        returnDate: searchParams.get('returnDate'),
        passengers: parseInt(searchParams.get('passengers') || '1', 10),
        pets: searchParams.get('pets') === 'true',
        smoking: searchParams.get('smoking') === 'true',
    }), [searchParams]);

    const searchResults = useMemo(() => {
        const jetsCategory = RENTAL_CATEGORIES.find(c => c.id === 'jets');
        if (!jetsCategory) return [];

        return jetsCategory.data.filter(jet => {
            const passengerSpec = jet.specs.find(s => s.label.en.toLowerCase() === 'passengers');
            if (!passengerSpec || parseInt(passengerSpec.value, 10) < searchCriteria.passengers) {
                return false;
            }
            if (searchCriteria.pets && !jet.petsAllowed) {
                return false;
            }
            if (searchCriteria.smoking && !jet.smokingAllowed) {
                return false;
            }
            return true;
        });
    }, [searchCriteria]);

    const handleBook = (item: RentalItem) => {
        checkVerificationAndProceed(() => {
            navigate(`/book/jets/${item.id}`, {
                state: {
                    tripType: searchCriteria.tripType,
                    departurePoint: searchCriteria.departure,
                    arrivalPoint: searchCriteria.arrival,
                    departureDate: searchCriteria.departureDate,
                    returnDate: searchCriteria.returnDate,
                    passengers: searchCriteria.passengers,
                    petsAllowed: searchCriteria.pets,
                    smokingAllowed: searchCriteria.smoking,
                }
            });
        });
    };
    
    const getAirportName = (iata: string | null) => {
        if (!iata) return 'N/A';
        const airport = AIRPORTS.find(a => a.iata === iata);
        return airport ? `${airport.city} (${airport.iata})` : iata;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-32 pb-24 bg-black min-h-screen"
        >
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
                >
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white">{t('Search_Results')}</h1>
                        <p className="text-gray-400 mt-1">
                            {getAirportName(searchCriteria.departure)} to {getAirportName(searchCriteria.arrival)} &middot; {searchCriteria.passengers} Passengers
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/jets')}
                        className="bg-gray-800 text-white px-6 py-2 rounded-full font-semibold text-sm hover:bg-gray-700 transition-colors"
                    >
                        {t('Modify_Search')}
                    </button>
                </motion.div>

                {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {searchResults.map(item => (
                            <RentalCard
                                key={item.id}
                                item={item}
                                onBook={handleBook}
                                jetSearchData={{
                                    departure: getAirportName(searchCriteria.departure),
                                    arrival: getAirportName(searchCriteria.arrival),
                                    departureDate: searchCriteria.departureDate || undefined,
                                    returnDate: searchCriteria.returnDate || undefined,
                                    passengers: searchCriteria.passengers,
                                    tripType: searchCriteria.tripType,
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-900/50 border border-gray-800 rounded-lg">
                        <h2 className="text-2xl font-bold text-white">{t('No_jets_found')}</h2>
                        <p className="text-gray-400 mt-2">Try adjusting your search criteria or contact our concierge for assistance.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default JetSearchResultsPage;
