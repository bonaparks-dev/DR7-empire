import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RENTAL_CATEGORIES, AIRPORTS } from '../constants';
import type { RentalItem } from '../types';
import RentalCard from '../components/ui/RentalCard';
import { useTranslation } from '../hooks/useTranslation';
import { useBooking } from '../hooks/useBooking';
import { motion, AnimatePresence } from 'framer-motion';
import { useVerification } from '../hooks/useVerification';
import { useVehicles } from '../hooks/useVehicles';
import SEOHead from '../components/seo/SEOHead';
import RentalSearchBar, { type SearchParams } from '../components/ui/RentalSearchBar';
import RentalFilters from '../components/ui/RentalFilters';
import { useSearchAvailability } from '../hooks/useSearchAvailability';

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


// Extracted vehicle results to avoid IIFE in JSX
const VehicleResults: React.FC<{
  categoryData: RentalItem[]
  categoryId: string
  hasSearched: boolean
  availabilityResults: Map<string, any>
  selectedCategories: string[]
  maxBudget: number | null
  sortBy: string
  preDays: number
  handleBook: (item: RentalItem) => void
  setSortBy: (s: string) => void
  setMaxBudget: (b: number | null) => void
  setSelectedCategories: (c: string[]) => void
}> = ({ categoryData, categoryId, hasSearched, availabilityResults, selectedCategories, maxBudget, sortBy, preDays, handleBook, setSortBy, setMaxBudget, setSelectedCategories }) => {
  const displayData = useMemo(() => {
    let data = [...categoryData];

    if (hasSearched && availabilityResults.size > 0) {
      data = data.filter(item => {
        const r = availabilityResults.get(item.id);
        return r ? r.available : false;
      });
    }

    if (selectedCategories.length > 0 && hasSearched) {
      data = data.filter(item => {
        const r = availabilityResults.get(item.id);
        return r ? selectedCategories.includes(r.vehicleType) : true;
      });
    }

    if (maxBudget !== null && hasSearched) {
      data = data.filter(item => {
        const r = availabilityResults.get(item.id);
        return r ? r.totalPrice <= maxBudget : true;
      });
    }

    if (sortBy !== 'default' && hasSearched) {
      data.sort((a, b) => {
        const pa = availabilityResults.get(a.id)?.totalPrice || 0;
        const pb = availabilityResults.get(b.id)?.totalPrice || 0;
        return sortBy === 'price-asc' ? pa - pb : pb - pa;
      });
    }

    return data;
  }, [categoryData, hasSearched, availabilityResults, selectedCategories, maxBudget, sortBy]);

  const availableCategories = useMemo(() => {
    if (!hasSearched) return [];
    return [...new Set(displayData.map(item => availabilityResults.get(item.id)?.vehicleType).filter(Boolean) as string[])];
  }, [displayData, hasSearched, availabilityResults]);

  return (
    <>
      {hasSearched && (
        <RentalFilters
          sortBy={sortBy}
          onSortChange={setSortBy}
          maxBudget={maxBudget}
          onBudgetChange={setMaxBudget}
          categories={availableCategories}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
          totalResults={displayData.length}
        />
      )}

      {displayData.length === 0 ? (
        <div className="text-center text-gray-400 mt-12 py-16">
          {hasSearched
            ? <p className="text-lg">Nessun veicolo disponibile per le date selezionate.</p>
            : <p>Nessun veicolo trovato in questa categoria.</p>
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
          {displayData.map(item => {
            const searchResult = hasSearched ? availabilityResults.get(item.id) : null;
            const marketingPrice = (!hasSearched && (categoryId === 'cars' || categoryId === 'urban-cars' || categoryId === 'corporate-fleet'))
              ? item.pricePerDay?.eur : undefined;
            const marketingTooltip = categoryId === 'urban-cars' ? 'Disponibile con formula long rent' : undefined;
            const dailyRate = item.pricePerDay?.eur || item.priceResidentDaily || 0;
            const itemTotalPrice = searchResult ? searchResult.totalPrice
              : (preDays > 0 && dailyRate ? Math.round(dailyRate * preDays) : undefined);
            const itemDays = searchResult ? searchResult.days : (preDays || undefined);

            return (
              <RentalCard
                key={item.id}
                item={item}
                onBook={handleBook}
                marketingPrice={itemTotalPrice ? undefined : marketingPrice}
                marketingTooltip={marketingTooltip}
                categoryId={categoryId}
                totalPrice={itemTotalPrice}
                totalDays={itemDays}
                hidePrice={!hasSearched && (categoryId === 'cars' || categoryId === 'corporate-fleet')}
                hideBookButton={!hasSearched && (categoryId === 'cars' || categoryId === 'corporate-fleet')}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

const RentalPage: React.FC<RentalPageProps> = ({ categoryId }) => {
  const { t, getTranslated } = useTranslation();
  const navigate = useNavigate();
  const { openBooking, openCarWizard } = useBooking();
  const { checkVerificationAndProceed } = useVerification();
  const [searchParams] = useSearchParams();

  // Search & filter state
  const [searchData, setSearchData] = useState<SearchParams | null>(null);
  const [sortBy, setSortBy] = useState('default');
  const [maxBudget, setMaxBudget] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Read pre-selected dates from Prenota Ora popup
  const prePickup = searchParams.get('pickup');
  const preReturn = searchParams.get('return');
  const preDays = useMemo(() => {
    if (!prePickup || !preReturn) return 0;
    return Math.max(1, Math.ceil((new Date(preReturn).getTime() - new Date(prePickup).getTime()) / (1000 * 60 * 60 * 24)));
  }, [prePickup, preReturn]);

  // Determine if this is a vehicle category and map to database category
  const vehicleCategory = categoryId === 'cars' ? 'exotic'
    : categoryId === 'urban-cars' ? 'urban'
      : categoryId === 'corporate-fleet' ? 'aziendali'
        : undefined;

  // Fetch vehicles for this category (default display)
  const { vehicles: fetchedVehicles, loading: vehiclesLoading, error: vehiclesError, usingCache } = useVehicles(vehicleCategory);

  // Fetch ALL vehicles (for cross-category search)
  const { vehicles: allVehicles, loading: allVehiclesLoading } = useVehicles(undefined);

  // Availability search hook
  const { results: availabilityResults, isSearching, hasSearched, search: runSearch } = useSearchAvailability(categoryId);

  const handleSearch = (params: SearchParams) => {
    setSearchData(params);
    const searchPool = allVehicles.length > 0 ? allVehicles : (vehicleCategory ? fetchedVehicles : (category?.data || []));
    if (searchPool.length > 0) {
      runSearch(searchPool, params);
    }
  };

  // Auto-search when coming from Prenota Ora (URL has pickup/return params)
  const prePickupTime = searchParams.get('pickupTime') || '10:30';
  const preReturnTime = searchParams.get('returnTime') || '09:00';
  const prePickupLoc = searchParams.get('pickupLoc') || 'dr7_office';
  const preReturnLoc = searchParams.get('returnLoc') || prePickupLoc;

  useEffect(() => {
    if (prePickup && preReturn && allVehicles.length > 0 && !hasSearched && !isSearching) {
      runSearch(allVehicles, {
        pickupLocation: prePickupLoc,
        returnLocation: preReturnLoc,
        pickupDate: prePickup,
        pickupTime: prePickupTime,
        returnDate: preReturn,
        returnTime: preReturnTime,
      });
    }
  }, [prePickup, preReturn, allVehicles.length, hasSearched, isSearching]);

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

          {/* Search summary when coming from Prenota Ora */}
          {prePickup && preReturn && vehicleCategory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 bg-gray-900/60 border border-gray-800 rounded-xl px-5 py-4"
            >
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500 text-xs block">Ritiro</span>
                  <span className="text-white font-medium">{new Date(prePickup).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} {prePickupTime}</span>
                </div>
                <span className="text-gray-600">→</span>
                <div>
                  <span className="text-gray-500 text-xs block">Restituzione</span>
                  <span className="text-white font-medium">{new Date(preReturn).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} {preReturnTime}</span>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300">{preDays} {preDays === 1 ? 'giorno' : 'giorni'}</span>
                </div>
              </div>
              <p className="text-xs text-red-400 mt-2">La tariffa puo subire variazioni</p>
            </motion.div>
          )}

          {/* Yacht Service - Quote Request Form */}
          {categoryId === 'yachts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center py-12"
            >
              <div className="w-full max-w-3xl mx-auto px-4">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-serif text-white tracking-wide">Richiedi il tuo preventivo nautico</h2>
                  <p className="text-base md:text-lg text-white/70 mt-3">Compila il form in modo preciso. Riceverai una proposta personalizzata in base alla disponibilità.</p>
                </div>

                <div className="bg-white rounded-2xl p-6 md:p-10 shadow-2xl">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const get = (k: string) => fd.get(k)?.toString() || '';
                      let msg = 'Richiesta preventivo nautico:\n\n';
                      msg += `Data inizio: ${get('startDate')} ore ${get('startTime')}\n`;
                      msg += `Data fine: ${get('endDate')} ore ${get('endTime')}\n`;
                      msg += `Porto partenza: ${get('departurePort')}\n`;
                      msg += `Porto rientro: ${get('returnPort')}\n`;
                      msg += `Paese: ${get('country')}\n`;
                      msg += `N. ospiti: ${get('guests')}\n`;
                      msg += `Tipo imbarcazione: ${get('boatType')}\n`;
                      msg += `Lunghezza: ${get('minLength')}m - ${get('maxLength')}m\n`;
                      msg += `Budget: €${get('minPrice')} - €${get('maxPrice')}`;
                      window.open(`https://wa.me/393457905205?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Data inizio</label>
                        <input type="date" name="startDate" required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Ora inizio</label>
                        <input type="time" name="startTime" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Data fine</label>
                        <input type="date" name="endDate" required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Ora fine</label>
                        <input type="time" name="endTime" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Zona / Porto di partenza</label>
                        <input type="text" name="departurePort" placeholder="Es. Porto Cervo, Cagliari, Olbia" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Zona / Porto di rientro</label>
                        <input type="text" name="returnPort" placeholder="Es. stesso porto o altro porto" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Paese</label>
                        <select name="country" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                          <option value="">Seleziona</option>
                          <option value="Italia">Italia</option>
                          <option value="Francia">Francia</option>
                          <option value="Spagna">Spagna</option>
                          <option value="Grecia">Grecia</option>
                          <option value="Croazia">Croazia</option>
                          <option value="Montenegro">Montenegro</option>
                          <option value="Altro">Altro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">N. ospiti</label>
                        <input type="number" name="guests" min="1" placeholder="" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Tipo imbarcazione</label>
                        <select name="boatType" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                          <option value="">Seleziona</option>
                          <option value="Barca a vela">Barca a vela</option>
                          <option value="Catamarano">Catamarano</option>
                          <option value="Motoryacht">Motoryacht</option>
                          <option value="Gommone">Gommone</option>
                          <option value="Superyacht">Superyacht</option>
                          <option value="Altro">Altro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Lunghezza minima (m)</label>
                        <input type="number" name="minLength" min="1" placeholder="Es. 8" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Prezzo minimo (€)</label>
                        <input type="number" name="minPrice" min="0" placeholder="Es. 500" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Lunghezza massima (m)</label>
                        <input type="number" name="maxLength" min="1" placeholder="Es. 30" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Prezzo minimo (€)</label>
                        <input type="number" name="minPriceDup" min="0" placeholder="Es. 500" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Prezzo massimo (€)</label>
                        <input type="number" name="maxPrice" min="0" placeholder="Es. 10,000" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1ebe57] text-white text-lg font-bold py-4 rounded-xl transition-colors duration-200 shadow-lg"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        CHIEDI PREVENTIVO
                      </button>
                    </div>
                  </form>
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

          {vehiclesLoading || isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
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
          ) : (
            <VehicleResults
              categoryData={hasSearched && allVehicles.length > 0 ? allVehicles : categoryData}
              categoryId={categoryId}
              hasSearched={hasSearched}
              availabilityResults={availabilityResults}
              selectedCategories={selectedCategories}
              maxBudget={maxBudget}
              sortBy={sortBy}
              preDays={preDays}
              handleBook={handleBook}
              setSortBy={setSortBy}
              setMaxBudget={setMaxBudget}
              setSelectedCategories={setSelectedCategories}
            />
          )}
          </div>

      </div>
    </motion.div>
  );
};

export default RentalPage;
