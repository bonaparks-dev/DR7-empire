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
import { PICKUP_LOCATIONS } from '../constants';
import { calculateMultiDayPrice } from '../utils/multiDayPricing';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import type { SearchParams } from '../contexts/BookingContext';

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
  const { openBooking, openCarWizard, searchParams, setSearchParams, searchPerformed } = useBooking();
  const { checkVerificationAndProceed } = useVerification();

  const isCarCategory = categoryId === 'cars' || categoryId === 'urban-cars' || categoryId === 'corporate-fleet';

  // Search form state
  const today = useMemo(() => {
    const d = new Date().toLocaleString('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' });
    return d.split(',')[0];
  }, []);

  const [searchPickupDate, setSearchPickupDate] = useState(searchParams?.pickupDate || '');
  const [searchPickupTime, setSearchPickupTime] = useState(searchParams?.pickupTime || '');
  const [searchDropoffDate, setSearchDropoffDate] = useState(searchParams?.dropoffDate || '');
  const [searchDropoffTime, setSearchDropoffTime] = useState(searchParams?.dropoffTime || '');
  const [searchPickupLocation, setSearchPickupLocation] = useState(searchParams?.pickupLocation || 'dr7_office');
  const [searchDropoffLocation, setSearchDropoffLocation] = useState(searchParams?.dropoffLocation || 'dr7_office');
  const [sameDropoffLocation, setSameDropoffLocation] = useState(searchParams?.sameDropoffLocation ?? true);
  const [isSearching, setIsSearching] = useState(false);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  // Time slot helpers (same office hours as CarBookingWizard)
  const SEARCH_HOLIDAYS = ['01-01', '06-01', '25-04', '01-05', '02-06', '15-08', '01-11', '08-12', '25-12', '26-12',
    '2024-03-31', '2024-04-01', '2025-04-20', '2025-04-21', '2026-04-05', '2026-04-06', '2026-01-02', '2026-01-03'];
  const isSearchHoliday = (ds: string) => { if (!ds) return false; const [,mo,dy] = ds.split('-'); return SEARCH_HOLIDAYS.includes(`${dy}-${mo}`) || SEARCH_HOLIDAYS.includes(ds); };
  const getSDow = (ds: string) => { const [y,m,d] = ds.split('-').map(Number); return new Date(y, m-1, d).getDay(); };
  const genT = (s: number, e: number, step: number) => { const r: string[] = []; for (let i=s;i<=e;i+=step) r.push(`${String(Math.floor(i/60)).padStart(2,'0')}:${String(i%60).padStart(2,'0')}`); return r; };
  const getPickupTimes = (date: string) => {
    if (!date) return [];
    const dow = getSDow(date);
    if (dow === 0 || isSearchHoliday(date)) return [];
    let times = dow === 6 ? genT(630,810,15) : [...genT(630,750,15), ...genT(1050,1110,15)];
    const now = new Date();
    if (new Date(date+'T00:00:00').toDateString() === now.toDateString()) {
      const minT = now.getHours()*60 + now.getMinutes() + 60;
      times = times.filter(t => { const [h,m] = t.split(':').map(Number); return h*60+m >= minT; });
    }
    return times;
  };
  const getReturnTimes = (date: string) => {
    if (!date || !searchPickupDate || !searchPickupTime) return [];
    const dow = getSDow(date);
    if (dow === 0 || isSearchHoliday(date)) return [];
    let times = dow === 6 ? genT(540,720,15) : [...genT(540,660,15), ...genT(960,1020,15)];
    const pickup = new Date(`${searchPickupDate}T${searchPickupTime}`);
    const [pH,pM] = searchPickupTime.split(':').map(Number);
    const maxRet = (pH*60+pM) - 90;
    return times.filter(t => { const [h,m] = t.split(':').map(Number); return new Date(`${date}T${t}`) > pickup && (maxRet < 0 || h*60+m <= maxRet); });
  };

  // Vehicle type for pricing
  const getVType = (item: RentalItem, catId: string): 'UTILITARIA' | 'FURGONE' | 'V_CLASS' | 'SUPERCAR' => {
    if (catId === 'urban-cars') return 'UTILITARIA';
    if (catId === 'corporate-fleet') {
      const n = (item.name || '').toLowerCase();
      if (n.includes('ducato') || n.includes('furgone')) return 'FURGONE';
      if (n.includes('vito') || n.includes('v class') || n.includes('v-class') || n.includes('classe v')) return 'V_CLASS';
      return 'UTILITARIA';
    }
    return 'SUPERCAR';
  };

  const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_BASE ??
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:8888' : window.location.origin);

  const handleVehicleSearch = async () => {
    if (!searchPickupDate || !searchPickupTime || !searchDropoffDate || !searchDropoffTime) {
      setSearchError('Compila tutti i campi di ricerca.');
      return;
    }
    if (searchDropoffDate < searchPickupDate) {
      setSearchError('La data di riconsegna non può essere prima del ritiro.');
      return;
    }
    setSearchError(null);
    setIsSearching(true);

    const params: SearchParams = {
      pickupLocation: searchPickupLocation,
      dropoffLocation: sameDropoffLocation ? searchPickupLocation : searchDropoffLocation,
      sameDropoffLocation,
      pickupDate: searchPickupDate,
      pickupTime: searchPickupTime,
      dropoffDate: searchDropoffDate,
      dropoffTime: searchDropoffTime,
    };
    setSearchParams(params);

    const pD = new Date(searchPickupDate); pD.setHours(0,0,0,0);
    const dD = new Date(searchDropoffDate); dD.setHours(0,0,0,0);
    const billingDays = Math.max(1, Math.round((dD.getTime() - pD.getTime()) / (1000*60*60*24)));
    const pickupDT = `${searchPickupDate}T${searchPickupTime}:00`;
    const dropoffDT = `${searchDropoffDate}T${searchDropoffTime}:00`;

    const newAvail: Record<string, boolean> = {};
    const newPrices: Record<string, number> = {};

    try {
      const checks = categoryData.map(async (item) => {
        try {
          const vehicleIds = (item as any).vehicleIds || [];
          const res = await fetchWithTimeout(`${FUNCTIONS_BASE}/.netlify/functions/checkVehicleAvailability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vehicleName: item.name, vehicleIds, pickupDate: pickupDT, dropoffDate: dropoffDT }),
          }, 10000);
          if (res.ok) {
            const data = await res.json();
            newAvail[item.id] = (data.conflicts || []).length === 0;
          } else {
            newAvail[item.id] = true;
          }
        } catch { newAvail[item.id] = true; }
        const vType = getVType(item, categoryId);
        const basePrice = item.priceNonresidentDaily || item.priceResidentDaily || item.pricePerDay?.eur || 0;
        newPrices[item.id] = calculateMultiDayPrice(vType, billingDays, basePrice, false);
      });
      await Promise.allSettled(checks);
    } catch (err) { console.error('Search error:', err); }

    setAvailabilityMap(newAvail);
    setPriceMap(newPrices);
    setIsSearching(false);
  };

  const displayVehicles = useMemo(() => {
    if (!searchPerformed || !isCarCategory) return categoryData;
    let filtered = categoryData.filter(item => availabilityMap[item.id] !== false);
    if (sortBy === 'price_asc') filtered = [...filtered].sort((a, b) => (priceMap[a.id] || 0) - (priceMap[b.id] || 0));
    else if (sortBy === 'price_desc') filtered = [...filtered].sort((a, b) => (priceMap[b.id] || 0) - (priceMap[a.id] || 0));
    return filtered;
  }, [categoryData, searchPerformed, isCarCategory, availabilityMap, priceMap, sortBy]);

  const searchBillingDays = useMemo(() => {
    if (!searchPickupDate || !searchDropoffDate) return 0;
    const p = new Date(searchPickupDate); p.setHours(0,0,0,0);
    const d = new Date(searchDropoffDate); d.setHours(0,0,0,0);
    return Math.max(1, Math.round((d.getTime() - p.getTime()) / (1000*60*60*24)));
  }, [searchPickupDate, searchDropoffDate]);

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

          {/* Car Search Form */}
          {isCarCategory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Cerca il tuo veicolo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Luogo di ritiro</label>
                  <select value={searchPickupLocation} onChange={e => setSearchPickupLocation(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2.5 text-white text-sm">
                    {PICKUP_LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>{typeof loc.label === 'string' ? loc.label : loc.label.it}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Luogo di riconsegna</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer whitespace-nowrap">
                      <input type="checkbox" checked={sameDropoffLocation}
                        onChange={e => { setSameDropoffLocation(e.target.checked); if (e.target.checked) setSearchDropoffLocation(searchPickupLocation); }}
                        className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-white focus:ring-white" />
                      Stesso luogo
                    </label>
                    {!sameDropoffLocation && (
                      <select value={searchDropoffLocation} onChange={e => setSearchDropoffLocation(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-md p-2.5 text-white text-sm">
                        {PICKUP_LOCATIONS.map(loc => (
                          <option key={loc.id} value={loc.id}>{typeof loc.label === 'string' ? loc.label : loc.label.it}</option>
                        ))}
                      </select>
                    )}
                    {sameDropoffLocation && (
                      <span className="text-sm text-gray-500 truncate">{PICKUP_LOCATIONS.find(l => l.id === searchPickupLocation)?.label?.it || searchPickupLocation}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Data ritiro</label>
                  <input type="date" value={searchPickupDate}
                    onChange={e => { setSearchPickupDate(e.target.value); setSearchPickupTime(''); if (searchDropoffDate && e.target.value > searchDropoffDate) { setSearchDropoffDate(''); setSearchDropoffTime(''); } }}
                    min={today}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2.5 text-white text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Ora ritiro</label>
                  <select value={searchPickupTime} onChange={e => { setSearchPickupTime(e.target.value); setSearchDropoffTime(''); }}
                    disabled={!searchPickupDate || getPickupTimes(searchPickupDate).length === 0}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2.5 text-white text-sm disabled:opacity-50">
                    <option value="">Seleziona</option>
                    {getPickupTimes(searchPickupDate).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Data riconsegna</label>
                  <input type="date" value={searchDropoffDate}
                    onChange={e => { setSearchDropoffDate(e.target.value); setSearchDropoffTime(''); }}
                    min={searchPickupDate || today}
                    disabled={!searchPickupDate || !searchPickupTime}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2.5 text-white text-sm disabled:opacity-50" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Ora riconsegna</label>
                  <select value={searchDropoffTime} onChange={e => setSearchDropoffTime(e.target.value)}
                    disabled={!searchDropoffDate || getReturnTimes(searchDropoffDate).length === 0}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2.5 text-white text-sm disabled:opacity-50">
                    <option value="">Seleziona</option>
                    {getReturnTimes(searchDropoffDate).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <button onClick={handleVehicleSearch} disabled={isSearching}
                  className="bg-white text-black font-bold py-2.5 px-8 rounded-full hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 uppercase tracking-wider text-sm">
                  {isSearching ? 'Ricerca in corso...' : 'Cerca Veicoli'}
                </button>
                {searchPerformed && !isSearching && (
                  <span className="text-sm text-gray-400">
                    {displayVehicles.length} veicol{displayVehicles.length === 1 ? 'o' : 'i'} disponibil{displayVehicles.length === 1 ? 'e' : 'i'}
                  </span>
                )}
              </div>
              {searchError && <p className="text-red-400 text-sm mt-2">{searchError}</p>}
              {searchPerformed && displayVehicles.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-gray-400">Ordina per:</span>
                  {(['default', 'price_asc', 'price_desc'] as const).map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${sortBy === s ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                      {s === 'default' ? 'Rilevanza' : s === 'price_asc' ? 'Prezzo crescente' : 'Prezzo decrescente'}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

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

          {vehiclesLoading || isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
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
          ) : displayVehicles.length === 0 ? (
            <div className="text-center text-gray-400 mt-12">
              {searchPerformed ? (
                <>
                  <p className="text-lg">Nessun veicolo disponibile per le date selezionate.</p>
                  <p className="text-sm mt-2">Prova a modificare le date o gli orari di ricerca.</p>
                </>
              ) : (
                <p>No vehicles found in this category.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {displayVehicles.map(item => {
                const showTotal = searchPerformed && isCarCategory;
                const marketingPrice = !showTotal ? (categoryId === 'cars' ? 149
                  : categoryId === 'urban-cars' ? 22
                  : categoryId === 'corporate-fleet'
                    ? (item.name?.toLowerCase().includes('vito') ? 198 : item.name?.toLowerCase().includes('ducato') ? 98 : undefined)
                  : undefined) : undefined;
                const marketingTooltip = (!showTotal && categoryId === 'urban-cars') ? 'Disponibile con formula long rent' : undefined;
                return (
                  <RentalCard key={item.id} item={item} onBook={handleBook}
                    marketingPrice={marketingPrice} marketingTooltip={marketingTooltip}
                    categoryId={categoryId}
                    calculatedTotalPrice={showTotal ? priceMap[item.id] : undefined}
                    rentalDays={showTotal ? searchBillingDays : undefined} />
                );
              })}
            </div>
          )}     </div>

      </div>
    </motion.div>
  );
};

export default RentalPage;
