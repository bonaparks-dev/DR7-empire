import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RENTAL_CATEGORIES, AIRPORTS } from '../constants';
import type { RentalItem } from '../types';
import RentalCard from '../components/ui/RentalCard';
import { useTranslation } from '../hooks/useTranslation';
import { useBooking } from '../hooks/useBooking';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperAirplaneIcon } from '../components/icons/Icons';
import { useVerification } from '../hooks/useVerification';

interface RentalPageProps {
  categoryId: 'cars' | 'yachts' | 'villas' | 'jets' | 'helicopters';
}

const JetSearchPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];

    const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
    const [departure, setDeparture] = useState<{ iata: string, name: string, city: string } | null>(null);
    const [arrival, setArrival] = useState<{ iata: string, name: string, city: string } | null>(null);
    const [departureDate, setDepartureDate] = useState(today);
    const [returnDate, setReturnDate] = useState('');
    const [passengers, setPassengers] = useState(1);
    const [petsAllowed, setPetsAllowed] = useState(false);
    const [smokingAllowed, setSmokingAllowed] = useState(false);

    const handleSearch = () => {
        if (!departure || !arrival) return;
        
        const params = new URLSearchParams();
        params.append('tripType', tripType);
        params.append('departure', departure.iata);
        params.append('arrival', arrival.iata);
        params.append('departureDate', departureDate);
        if (tripType === 'round-trip' && returnDate) {
            params.append('returnDate', returnDate);
        }
        params.append('passengers', String(passengers));
        params.append('pets', String(petsAllowed));
        params.append('smoking', String(smokingAllowed));

        navigate(`/jets/search?${params.toString()}`);
    };

    const AirportAutocomplete: React.FC<{
        value: { iata: string, name: string, city: string } | null;
        onSelect: (airport: { iata: string, name: string, city: string }) => void;
        placeholder: string;
    }> = ({ value, onSelect, placeholder }) => {
        const [query, setQuery] = useState('');
        const [suggestions, setSuggestions] = useState<typeof AIRPORTS>([]);
        const [showSuggestions, setShowSuggestions] = useState(false);
        const inputRef = useRef<HTMLInputElement>(null);
        const suggestionsRef = useRef<HTMLUListElement>(null);

        useEffect(() => {
            if (value) {
                setQuery(`${value.city} (${value.iata})`);
            } else {
                setQuery('');
            }
        }, [value]);
        
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
                    suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                    setShowSuggestions(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);


        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newQuery = e.target.value;
            setQuery(newQuery);
            if (newQuery.length > 1) {
                const filtered = AIRPORTS.filter(airport =>
                    airport.name.toLowerCase().includes(newQuery.toLowerCase()) ||
                    airport.city.toLowerCase().includes(newQuery.toLowerCase()) ||
                    airport.iata.toLowerCase().includes(newQuery.toLowerCase())
                );
                setSuggestions(filtered);
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
            }
        };

        const handleSelectSuggestion = (airport: typeof AIRPORTS[0]) => {
            onSelect(airport);
            setShowSuggestions(false);
        };

        return (
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length > 1 && setShowSuggestions(true)}
                    placeholder={placeholder}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-white transition"
                />
                <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.ul 
                        ref={suggestionsRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
                    >
                        {suggestions.map(airport => (
                            <li
                                key={airport.iata}
                                onClick={() => handleSelectSuggestion(airport)}
                                className="px-4 py-2 text-white hover:bg-gray-800 cursor-pointer"
                            >
                                {airport.name} ({airport.iata}) - {airport.city}
                            </li>
                        ))}
                    </motion.ul>
                )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="pt-32 pb-24 bg-black min-h-screen">
                 <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-white">
                            {t('Find_your_private_jet')}
                        </h1>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-10 max-w-5xl mx-auto bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6"
                    >
                        <div className="flex border-b border-gray-700 mb-6">
                            <button onClick={() => setTripType('one-way')} className={`px-4 py-2 text-sm font-semibold ${tripType === 'one-way' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>{t('One_Way')}</button>
                            <button onClick={() => setTripType('round-trip')} className={`px-4 py-2 text-sm font-semibold ${tripType === 'round-trip' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>{t('Round_Trip')}</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="lg:col-span-2">
                                <label className="text-sm text-gray-400 block mb-2">{t('Departure')}</label>
                                <AirportAutocomplete value={departure} onSelect={setDeparture} placeholder={t('Select_airport')} />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="text-sm text-gray-400 block mb-2">{t('Arrival')}</label>
                                <AirportAutocomplete value={arrival} onSelect={setArrival} placeholder={t('Select_airport')} />
                            </div>
                            <div className="lg:col-span-1">
                                <button onClick={handleSearch} className="w-full bg-white text-black font-bold py-3 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center">
                                    <PaperAirplaneIcon className="w-5 h-5 mr-2 -rotate-45" />
                                    {t('Search')}
                                </button>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-2">{t('Departure_Date')}</label>
                                <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} min={today} className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white" />
                            </div>
                            <AnimatePresence>
                                {tripType === 'round-trip' && (
                                    <motion.div initial={{opacity:0, width: 0}} animate={{opacity:1, width: 'auto'}} exit={{opacity:0, width: 0}} className="overflow-hidden">
                                        <label className="text-sm text-gray-400 block mb-2">{t('Return_Date')}</label>
                                        <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={departureDate || today} className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div>
                                <label className="text-sm text-gray-400 block mb-2">{t('Passengers')}</label>
                                <input type="number" value={passengers} onChange={e => setPassengers(Math.max(1, parseInt(e.target.value, 10)))} min="1" className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white" />
                            </div>
                            <div className="col-span-full mt-4 flex items-center space-x-6">
                                <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300">
                                    <input type="checkbox" checked={petsAllowed} onChange={e => setPetsAllowed(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-white focus:ring-white"/>
                                    <span>{t('Pets_Allowed')}</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300">
                                    <input type="checkbox" checked={smokingAllowed} onChange={e => setSmokingAllowed(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-white focus:ring-white"/>
                                    <span>{t('Smoking_Allowed')}</span>
                                </label>
                            </div>
                        </div>
                    </motion.div>

                    <div className="mt-16 text-center text-gray-400">
                        <p>Explore our fleet of world-class private jets. For bespoke travel arrangements, contact our concierge.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


const RentalPage: React.FC<RentalPageProps> = ({ categoryId }) => {
  const { t, getTranslated } = useTranslation();
  const navigate = useNavigate();
  const { openBooking, openCarWizard } = useBooking();
  const { checkVerificationAndProceed } = useVerification();
  
  const category = RENTAL_CATEGORIES.find(cat => cat.id === categoryId);

  const handleBook = (item: RentalItem) => {
    if (categoryId === 'cars') {
      openCarWizard(item);
    } else if (['jets', 'helicopters'].includes(categoryId)) {
      navigate(`/book/${categoryId}/${item.id}`);
    } else {
      openBooking(item, categoryId as 'yachts' | 'villas');
    }
  };

  if (categoryId === 'jets') {
      return <JetSearchPage />;
  }

  if (!category) {
    return <div className="pt-32 text-center text-white">Category not found.</div>;
  }
  
  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="pt-32 pb-24 bg-black">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                   
                </motion.div>

                <div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12"
                >
                    {category.data.map(item => (
                        <RentalCard key={item.id} item={item} onBook={handleBook} />
                    ))}
                </div>
            </div>
        </div>
    </motion.div>
  );
};

export default RentalPage;