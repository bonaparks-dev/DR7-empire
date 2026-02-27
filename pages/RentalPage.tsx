import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RENTAL_CATEGORIES, AIRPORTS } from '../constants';
import type { RentalItem } from '../types';
import RentalCard from '../components/ui/RentalCard';
import { useTranslation } from '../hooks/useTranslation';
import { useBooking } from '../hooks/useBooking';
import { motion, AnimatePresence } from 'framer-motion';
import { useVerification } from '../hooks/useVerification';
import { useVehicles } from '../hooks/useVehicles';
import SEOHead from '../components/seo/SEOHead';

interface RentalPageProps {
  categoryId: 'cars' | 'urban-cars' | 'corporate-fleet' | 'yachts' | 'villas' | 'jets' | 'helicopters';
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
            <h1 className="text-5xl md:text-6xl font-bold text-white">
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
                  {t('Search')}
                </button>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">{t('Departure_Date')}</label>
                <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} min={today} className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white" />
              </div>
              <AnimatePresence>
                {tripType === 'round-trip' && (
                  <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                    <label className="text-sm text-gray-400 block mb-2">{t('Return_Date')}</label>
                    <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={departureDate || today} disabled={!departureDate} className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label className="text-sm text-gray-400 block mb-2">{t('Passengers')}</label>
                <input type="number" value={passengers} onChange={e => setPassengers(Math.max(1, parseInt(e.target.value, 10)))} min="1" className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white" />
              </div>
              <div className="col-span-full mt-4 flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300">
                  <input type="checkbox" checked={petsAllowed} onChange={e => setPetsAllowed(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-white focus:ring-white" />
                  <span>{t('Pets_Allowed')}</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300">
                  <input type="checkbox" checked={smokingAllowed} onChange={e => setSmokingAllowed(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-white focus:ring-white" />
                  <span>{t('Smoking_Allowed')}</span>
                </label>
              </div>
            </div>
          </motion.div>

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

  // Determine if this is a vehicle category and map to database category
  const vehicleCategory = categoryId === 'cars' ? 'exotic'
    : categoryId === 'urban-cars' ? 'urban'
      : categoryId === 'corporate-fleet' ? 'aziendali'
        : undefined;

  // Fetch vehicles from database if it's a vehicle category
  const { vehicles: fetchedVehicles, loading: vehiclesLoading, error: vehiclesError, usingCache } = useVehicles(vehicleCategory);

  // Chrome-specific debug hint (dev-only)
  const [showChromeDebugHint, setShowChromeDebugHint] = useState(false);

  useEffect(() => {
    // Only show in development mode when there's an error
    if (import.meta.env.DEV && vehiclesError) {
      const ua = navigator.userAgent;
      const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
      setShowChromeDebugHint(isChrome);
    } else {
      setShowChromeDebugHint(false);
    }
  }, [vehiclesError]);


  // Get the category from static data
  const category = RENTAL_CATEGORIES.find(cat => cat.id === categoryId);

  // Use fetched vehicles for car categories, otherwise use static data
  const categoryData = vehicleCategory ? fetchedVehicles : (category?.data || []);

  const handleBook = (item: RentalItem) => {
    console.log('RentalPage handleBook called:', { item, categoryId });
    if (categoryId === 'cars' || categoryId === 'urban-cars' || categoryId === 'corporate-fleet') {
      console.log('Opening car wizard for:', item.name);
      openCarWizard(item, categoryId);
    } else if (['jets', 'helicopters'].includes(categoryId)) {
      console.log('Navigating to booking page for jet/helicopter');
      navigate(`/book/${categoryId}/${item.id}`);
    } else {
      console.log('Opening booking modal for yacht/villa');
      openBooking(item, categoryId as 'yachts' | 'villas');
    }
  };

  if (categoryId === 'jets' || categoryId === 'helicopters') {
    return (
      <div className="pt-32 pb-24 bg-black">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              DR7 Aviation Division
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Jet Privati ed Elicotteri su Misura
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Jet Booking */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-white transition-colors"
            >
              <h2 className="text-3xl font-bold text-white mb-4 text-center">
                Jet Privati
              </h2>
              <p className="text-gray-400 mb-6 text-center">
                Voli a lungo raggio, business e viaggi intercontinentali
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-gray-300">

                  <span>Voli nazionali ed internazionali</span>
                </div>
                <div className="flex items-center text-gray-300">

                  <span>Capacità fino a 20 passeggeri</span>
                </div>
                <div className="flex items-center text-gray-300">

                  <span>Massimo comfort e privacy</span>
                </div>
              </div>
              <button
                onClick={() => window.open('https://wa.me/393457905205?text=' + encodeURIComponent('Ciao, vorrei richiedere un preventivo per un Jet Privato.'), '_blank')}
                className="w-full bg-white text-black px-6 py-4 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
              >
                Richiedi Preventivo Jet
              </button>
            </motion.div>

            {/* Helicopter Booking */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-white transition-colors"
            >
              <div className="text-6xl mb-6 text-center"></div>
              <h2 className="text-3xl font-bold text-white mb-4 text-center">
                Elicotteri
              </h2>
              <p className="text-gray-400 mb-6 text-center">
                Voli brevi, trasferimenti veloci e operazioni speciali
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-gray-300">

                  <span>Accesso a luoghi difficili da raggiungere</span>
                </div>
                <div className="flex items-center text-gray-300">

                  <span>Trasferimenti rapidi da/per aeroporti</span>
                </div>
                <div className="flex items-center text-gray-300">

                  <span>Tour panoramici ed eventi speciali</span>
                </div>
              </div>
              <button
                onClick={() => window.open('https://wa.me/393457905205?text=' + encodeURIComponent('Ciao, vorrei richiedere un preventivo per un Elicottero.'), '_blank')}
                className="w-full bg-white text-black px-6 py-4 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
              >
                Richiedi Preventivo Elicottero
              </button>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <p className="text-gray-400 text-lg mb-4">
              Non sei sicuro di quale servizio scegliere?
            </p>
            <button
              onClick={() => navigate('/aviation-quote')}
              className="bg-gray-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-700 transition-colors"
            >
              Contattaci per una Consulenza Gratuita
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!category) {
    return <div className="pt-32 text-center text-white">Category not found.</div>;
  }

  const seoConfig: Record<string, { title: string; description: string; canonical: string; jsonLd?: Record<string, any> }> = {
    cars: {
      title: 'Luxury Car Rental Sardinia | Ferrari, Lamborghini, Porsche | DR7 Empire',
      description: 'Rent Ferrari, Lamborghini, Porsche, and premium supercars in Sardinia. Short-term & long-term luxury car rental with delivery. DR7 Empire Supercar Division.',
      canonical: '/supercar-luxury',
      jsonLd: { '@type': 'AutoRental', name: 'DR7 Supercar Division', url: 'https://dr7empire.com/supercar-luxury', areaServed: { '@type': 'State', name: 'Sardegna' } },
    },
    'urban-cars': {
      title: 'Affordable Car Rental Sardinia | Urban Cars | DR7 Empire',
      description: 'Affordable urban car rental in Sardinia. City cars, compact SUVs, and practical vehicles for daily commutes and weekend trips. DR7 Urban Division.',
      canonical: '/urban',
      jsonLd: { '@type': 'AutoRental', name: 'DR7 Urban Division', url: 'https://dr7empire.com/urban', areaServed: { '@type': 'State', name: 'Sardegna' } },
    },
  };

  const seo = seoConfig[categoryId];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {seo && (
        <SEOHead
          title={seo.title}
          description={seo.description}
          canonical={seo.canonical}
          jsonLd={seo.jsonLd}
        />
      )}
      <div className="pt-32 pb-24 bg-black">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >

          </motion.div>

          {/* Yacht Service - Quiet Luxury Message */}
          {categoryId === 'yachts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[60vh] flex items-center justify-center"
            >
              <div className="text-center max-w-2xl mx-auto px-6 py-16">

                <div className="space-y-8">
                  <p className="text-lg md:text-xl text-white font-serif tracking-wide leading-relaxed">
                    Il servizio è attualmente in fase di sviluppo.
                  </p>

                  <p className="text-base md:text-lg text-white/80 font-serif tracking-wide">
                    Per ulteriori informazioni, contattaci direttamente.
                  </p>

                  <div className="pt-8">
                    <button
                      onClick={() => window.location.href = 'https://wa.me/393517375375?text=Ciao%2C%20vorrei%20informazioni%20sul%20servizio%20Yachting'}
                      className="text-white/80 hover:text-white text-sm tracking-widest uppercase font-light transition-colors duration-300 border-b border-white/20 hover:border-white/60 pb-1"
                    >
                      Richiesta Privata
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chrome-specific debug hint (dev-only) */}
          {showChromeDebugHint && (
            <div className="mb-4 bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <svg className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-blue-200 text-sm font-medium">
                      Dev Note: Chrome Connection Issue Detected
                    </p>
                    <p className="text-blue-300/70 text-xs mt-1">
                      If Chrome fails but Safari works, try: <strong>incognito mode</strong> or <strong>disable browser extensions</strong>. This is a known Chrome HTTP/2 protocol issue with Supabase.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChromeDebugHint(false)}
                  className="text-blue-300/70 hover:text-blue-200 text-sm flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Non-blocking error/cache banner - shows above vehicles, never blocks them */}
          {(vehiclesError || usingCache) && !vehiclesLoading && (
            <div className="mb-6 bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <svg className="h-5 w-5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-yellow-200 text-sm font-medium">
                      {usingCache
                        ? 'Showing cached vehicles — connection issue detected'
                        : 'Temporary connection issue — showing last known vehicles'}
                    </p>
                    <p className="text-yellow-300/70 text-xs mt-0.5">
                      Vehicles may not reflect real-time availability. Retry to refresh.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {vehiclesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {/* Loading skeleton - 3 placeholder cards */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-800"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-800 rounded"></div>
                      <div className="h-3 bg-gray-800 rounded w-5/6"></div>
                    </div>
                    <div className="h-10 bg-gray-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : categoryData.length === 0 ? (
            <div className="text-center text-gray-400 mt-12">
              <p>No vehicles found in this category.</p>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12"
            >
              {categoryData.map(item => {
                // Marketing "Da X/giorno" prices per category
                const marketingPrice = categoryId === 'cars' ? 149
                  : categoryId === 'urban-cars' ? 22
                  : categoryId === 'corporate-fleet'
                    ? (item.name?.toLowerCase().includes('vito') ? 198
                      : item.name?.toLowerCase().includes('ducato') ? 98
                      : undefined)
                  : undefined;
                // Tooltip for long rent availability
                const marketingTooltip = categoryId === 'urban-cars'
                  ? 'Disponibile con formula long rent'
                  : undefined;
                return (
                  <RentalCard key={item.id} item={item} onBook={handleBook} marketingPrice={marketingPrice} marketingTooltip={marketingTooltip} categoryId={categoryId} />
                );
              })}
            </div>

          )}     </div>

      </div>
    </motion.div>
  );
};

export default RentalPage;
