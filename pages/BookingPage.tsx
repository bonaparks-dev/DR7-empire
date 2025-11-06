import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { RENTAL_CATEGORIES, YACHT_PICKUP_MARINAS, AIRPORTS, HELI_DEPARTURE_POINTS, HELI_ARRIVAL_POINTS } from '../constants';
import type { Booking, Inquiry, RentalItem } from '../types';
import CarBookingWizard from '../components/ui/CarBookingWizard';
import HelicopterBookingForm from '../components/ui/HelicopterBookingForm';

import { CreditCardIcon, XIcon } from '../components/icons/Icons';


// Safely access the Stripe publishable key from Vite's environment variables.
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

const BookingPage: React.FC = () => {
  const { category: categoryId, itemId } = useParams<{ category: 'cars' | 'yachts' | 'jets' | 'helicopters'; itemId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, getTranslated } = useTranslation();
  const { currency } = useCurrency();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<Booking | Inquiry | null>(null);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
      fullName: '', email: '', phone: '',
      checkinDate: location.state?.checkinDate || today, 
      checkoutDate: location.state?.checkoutDate || '', 
      guests: location.state?.guests || 1,
      paymentMethod: 'stripe',
      tripType: location.state?.tripType || 'one-way' as 'one-way' | 'round-trip', 
      departurePoint: location.state?.departurePoint || '', 
      arrivalPoint: location.state?.arrivalPoint || '', 
      departureDate: location.state?.departureDate || today, 
      departureTime: '12:00',
      returnDateQuote: location.state?.returnDate || '', 
      returnTimeQuote: '12:00', 
      passengers: location.state?.passengers || 1,
      petsAllowed: location.state?.petsAllowed || false,
      smokingAllowed: location.state?.smokingAllowed || false,
      pickupMarina: YACHT_PICKUP_MARINAS[0].id,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cardElementRef = useRef<HTMLDivElement>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isClientSecretLoading, setIsClientSecretLoading] = useState(false);
  
  const { category, item, isCar, isJet, isHelicopter, isYacht, isQuoteRequest } = useMemo(() => {
    const cat = RENTAL_CATEGORIES.find(c => c.id === categoryId);
    const itm = cat?.data.find(i => i.id === itemId);
    const car = cat?.id === 'cars';
    const jet = cat?.id === 'jets';
    const helicopter = cat?.id === 'helicopters';
    const yacht = cat?.id === 'yachts';
    const quote = jet || helicopter;
    return { category: cat, item: itm, isCar: car, isJet: jet, isHelicopter: helicopter, isYacht: yacht, isQuoteRequest: quote };
  }, [categoryId, itemId]);

  useEffect(() => {
    if ((window as any).Stripe) {
        if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('YOUR_')) {
            console.error("Stripe.js has loaded, but the publishable key is not set. Please replace 'YOUR_STRIPE_PUBLISHABLE_KEY' with your actual key.");
            setStripeError("Payment service is not configured correctly. Please contact support.");
            return;
        }
        setStripe((window as any).Stripe(STRIPE_PUBLISHABLE_KEY));
    } else {
        console.error("Stripe.js has not loaded.");
    }
  }, []);

  const { 
    rentalCost, subtotal, taxes, total, nights
  } = useMemo(() => {
    const zeroState = { rentalCost: 0, subtotal: 0, taxes: 0, total: 0, nights: 0 };
    if (!item || !item.pricePerDay) return zeroState;
    
    const pricePerDay = item.pricePerDay[currency];
    
    if (isYacht) {
      const checkinKey = 'checkinDate';
      const checkoutKey = 'checkoutDate';

      if (!formData[checkinKey] || !formData[checkoutKey]) return zeroState;
      const start = new Date(formData[checkinKey]);
      const end = new Date(formData[checkoutKey]);
      if (start >= end) return zeroState;

      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const calculatedRentalCost = diffDays * pricePerDay;
      let calculatedSubtotal = 0;
      let calculatedTaxes = 0;

      if (isYacht) {
        calculatedSubtotal = calculatedRentalCost;
        calculatedTaxes = calculatedSubtotal * 0.10;
      }

      const calculatedTotal = calculatedSubtotal + calculatedTaxes;

      return { ...zeroState, rentalCost: calculatedRentalCost, subtotal: calculatedSubtotal, taxes: calculatedTaxes, total: calculatedTotal, nights: diffDays };
    }
    return zeroState;
  }, [formData, item, currency, isYacht]);

  useEffect(() => {
    if (step === 2 && !isCar && !isQuoteRequest && total > 0) {
        setIsClientSecretLoading(true); setClientSecret(null); setStripeError(null);
        fetch('/.netlify/functions/create-payment-intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: total, currency }) })
        .then(res => res.json()).then(data => { if (data.error) { setStripeError(data.error); } else { setClientSecret(data.clientSecret); } })
        .catch(error => { console.error('Failed to fetch client secret:', error); setStripeError('Could not connect to payment server.'); })
        .finally(() => { setIsClientSecretLoading(false); });
    }
  }, [step, isQuoteRequest, total, currency, isCar]);

  useEffect(() => {
    let card: any = null;
    if (stripe && step === 2 && !isCar && !isQuoteRequest && formData.paymentMethod === 'stripe' && cardElementRef.current && clientSecret) {
        const elements = stripe.elements();
        card = elements.create('card', { style: { base: { color: '#ffffff', fontFamily: '"Exo 2", sans-serif', fontSmoothing: 'antialiased', fontSize: '16px', '::placeholder': { color: '#a0aec0' } }, invalid: { color: '#ef4444', iconColor: '#ef4444' } }, hidePostalCode: true });
        setCardElement(card); card.mount(cardElementRef.current);
        card.on('change', (event: any) => { setStripeError(event.error ? event.error.message : null); });
    }
    return () => { if (card) { card.destroy(); setCardElement(null); } };
  }, [stripe, step, formData.paymentMethod, clientSecret, isQuoteRequest, isCar]);

  useEffect(() => { if (user) { setFormData(prev => ({ ...prev, fullName: user.fullName || '', email: user.email || '' })); } }, [user]);

  const formatPrice = (price: number) => new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(price);
  const formatDate = (date: string) => new Date(date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({...prev, [name]: ''}));
  };
  
  const validateStep = () => {
    // Validation for non-car categories can be added here if needed
    return true;
  };

  const handleNext = () => validateStep() && setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);
  
  const finalizeBooking = async () => {
    if (!item) return;

    if (isQuoteRequest) {
        if (categoryId !== 'jets' && categoryId !== 'helicopters') return;
        const newInquiry: Inquiry = {
            inquiryId: crypto.randomUUID(), userId: user ? user.id : 'guest', itemId: item.id, itemName: item.name, image: item.image, itemCategory: categoryId,
            customer: { fullName: formData.fullName, email: formData.email, phone: formData.phone },
            details: { tripType: formData.tripType, departurePoint: formData.departurePoint, arrivalPoint: formData.arrivalPoint, departureDate: formData.departureDate, departureTime: formData.departureTime, returnDate: formData.returnDateQuote, returnTime: formData.returnTimeQuote, passengers: Number(formData.passengers), petsAllowed: formData.petsAllowed, smokingAllowed: formData.smokingAllowed },
            inquiredAt: new Date().toISOString(),
        };
        const existing = JSON.parse(localStorage.getItem('inquiries') || '[]');
        localStorage.setItem('inquiries', JSON.stringify([...existing, newInquiry]));
        setCompletedBooking(newInquiry);

        // Generate WhatsApp message for helicopter and jet bookings (Italy only)
        if (isHelicopter) {
            const departurePoints = HELI_DEPARTURE_POINTS;
            const arrivalPoints = HELI_ARRIVAL_POINTS;
            const departureName = departurePoints.find(p => p.id === formData.departurePoint)?.name || formData.departurePoint;
            const arrivalName = arrivalPoints.find(p => p.id === formData.arrivalPoint)?.name || formData.arrivalPoint;

            let message = `Ciao! Vorrei prenotare un elicottero.\n\n`;
            message += `Elicottero: ${item.name}\n`;
            message += `Tipo viaggio: ${formData.tripType === 'one-way' ? 'Solo andata' : 'Andata e ritorno'}\n`;
            message += `Partenza da: ${departureName}\n`;
            message += `Arrivo a: ${arrivalName}\n`;
            message += `Data partenza: ${formatDate(formData.departureDate)}\n`;
            message += `Ora partenza: ${formData.departureTime}\n`;
            if (formData.tripType === 'round-trip' && formData.returnDateQuote) {
                message += `Data ritorno: ${formatDate(formData.returnDateQuote)}\n`;
                message += `Ora ritorno: ${formData.returnTimeQuote}\n`;
            }
            message += `Numero passeggeri: ${formData.passengers}\n\n`;
            message += `Nome: ${formData.fullName}\n`;
            message += `Email: ${formData.email}\n`;
            message += `Telefono: ${formData.phone}\n\n`;
            message += `Potreste fornirmi un preventivo? Grazie!`;

            const whatsappUrl = `https://wa.me/393457905205?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }

        // Generate WhatsApp message for jet bookings
        if (isJet) {
            const airports = AIRPORTS;
            const departureAirport = airports.find(p => p.iata === formData.departurePoint);
            const arrivalAirport = airports.find(p => p.iata === formData.arrivalPoint);
            const departureName = departureAirport ? `${departureAirport.name} (${departureAirport.iata})` : formData.departurePoint;
            const arrivalName = arrivalAirport ? `${arrivalAirport.name} (${arrivalAirport.iata})` : formData.arrivalPoint;

            let message = `Ciao! Vorrei prenotare un jet privato.\n\n`;
            message += `Jet: ${item.name}\n`;
            message += `Tipo viaggio: ${formData.tripType === 'one-way' ? 'Solo andata' : 'Andata e ritorno'}\n`;
            message += `Partenza da: ${departureName}\n`;
            message += `Arrivo a: ${arrivalName}\n`;
            message += `Data partenza: ${formatDate(formData.departureDate)}\n`;
            message += `Ora partenza: ${formData.departureTime}\n`;
            if (formData.tripType === 'round-trip' && formData.returnDateQuote) {
                message += `Data ritorno: ${formatDate(formData.returnDateQuote)}\n`;
                message += `Ora ritorno: ${formData.returnTimeQuote}\n`;
            }
            message += `Numero passeggeri: ${formData.passengers}\n`;
            if (formData.petsAllowed) {
                message += `Animali domestici: Sì\n`;
            }
            if (formData.smokingAllowed) {
                message += `Fumo: Sì\n`;
            }
            message += `\nNome: ${formData.fullName}\n`;
            message += `Email: ${formData.email}\n`;
            message += `Telefono: ${formData.phone}\n\n`;
            message += `Potreste fornirmi un preventivo? Grazie!`;

            const whatsappUrl = `https://wa.me/393457905205?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    } else {
        const commonData = {
          userId: user ? user.id : 'guest-user', itemId: item.id, itemName: item.name, image: item.image,
          itemCategory: categoryId,
          totalPrice: total, currency: currency.toUpperCase() as 'USD' | 'EUR',
          customer: { fullName: formData.fullName, email: formData.email, phone: formData.phone },
          paymentMethod: formData.paymentMethod, bookedAt: new Date().toISOString(),
        };

        let newBookingData: Omit<Booking, 'bookingId'> | undefined;
        if (isYacht) {
            newBookingData = { ...commonData, itemCategory: 'yachts', pickupDate: formData.checkinDate, pickupTime: '15:00', returnDate: formData.checkoutDate, returnTime: '11:00', duration: `${nights} ${nights === 1 ? t('Night') : t('Nights')}`, driverLicenseImage: '', extras: [], pickupLocation: formData.pickupMarina, insuranceOption: 'none' };
        }

        if (!newBookingData) {
            console.error("Unsupported category for booking.");
            setErrors(prev => ({...prev, form: "This category cannot be booked."}));
            setIsProcessing(false);
            return;
        }

        const { data, error } = await supabase
            .from('bookings')
            .insert(newBookingData)
            .select()
            .single();

        if (error) {
            console.error('Error creating booking:', error);
            setErrors(prev => ({...prev, form: "Could not save your booking. Please try again."}));
            setIsProcessing(false);
            return;
        }

        setCompletedBooking(data);

        // Generate WhatsApp message for yacht bookings
        if (isYacht) {
            const marinaName = YACHT_PICKUP_MARINAS.find(m => m.id === formData.pickupMarina);
            const marinaLabel = marinaName ? getTranslated(marinaName.label) : formData.pickupMarina;

            let message = `Ciao! Ho prenotato uno yacht.\n\n`;
            message += `Yacht: ${item.name}\n`;
            message += `Check-in: ${formatDate(formData.checkinDate)} alle 15:00\n`;
            message += `Check-out: ${formatDate(formData.checkoutDate)} alle 11:00\n`;
            message += `Durata: ${nights} ${nights === 1 ? 'notte' : 'notti'}\n`;
            message += `Marina: ${marinaLabel}\n`;
            message += `Totale: ${formatPrice(total)}\n\n`;
            message += `Nome: ${formData.fullName}\n`;
            message += `Email: ${formData.email}\n`;
            message += `Telefono: ${formData.phone}\n\n`;
            message += `Grazie!`;

            const whatsappUrl = `https://wa.me/393457905205?text=${encodeURIComponent(message)}`;
            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
            }, 1000);
        }
    }
    setStep(steps.length + 1);
    setIsProcessing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!validateStep() || !item) return; setIsProcessing(true);
    if (isQuoteRequest) { await finalizeBooking(); return; }
    if (formData.paymentMethod === 'stripe') {
      setStripeError(null); if (!stripe || !cardElement || !clientSecret) { setStripeError("Payment system is not ready."); setIsProcessing(false); return; }
      const { error } = await stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement, billing_details: { name: formData.fullName, email: formData.email, phone: formData.phone } }, });
      if (error) { setStripeError(error.message || "An unexpected error occurred."); setIsProcessing(false); } else { await finalizeBooking(); }
    } else { await finalizeBooking(); }
  };

  const steps = useMemo(() => {
    if (isQuoteRequest) return [ { id: 1, name: t('Itinerary') }, { id: 2, name: t('Personal_Information') }, { id: 3, name: t('Review_and_Submit') } ];
    if (isYacht) return [ { id: 1, name: t('Review_your_booking') }, { id: 2, name: t('Payment') }];
    return [];
  }, [isQuoteRequest, isYacht, t]);

  const handleBookingComplete = (booking: Booking) => {
    setCompletedBooking(booking);
    setStep(99); // A step number that indicates completion
  };

  if (!item) return <div className="pt-32 text-center text-white">Item not found.</div>;

  const renderContent = () => {
    if(completedBooking) {
        if(isQuoteRequest) return (
            <div className="text-center">
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type: 'spring', stiffness: 260, damping: 20}} className="w-16 h-16 bg-gray-500/20 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">{t('Inquiry_Sent')}</h2>
                <p className="text-gray-300 max-w-md mx-auto">{t('Our_team_will_contact_you_shortly_with_a_quote')}</p>
                <button type="button" onClick={() => navigate('/')} className="mt-8 bg-white text-black px-6 py-2 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors">Go to Home</button>
            </div>
        );
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h2>
            <p className="text-gray-300 max-w-md mx-auto">Your booking has been confirmed.</p>
            <button type="button" onClick={() => navigate('/account')} className="mt-8 bg-white text-black px-6 py-2 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors">View My Bookings</button>
          </div>
        );
    }

    if (isCar) {
      return <CarBookingWizard item={item} onBookingComplete={handleBookingComplete} onClose={() => location.state?.from ? navigate(location.state.from) : navigate('/')} />;
    }

    if (isHelicopter) {
      return (
        <div className="max-w-2xl mx-auto">
          <HelicopterBookingForm />
        </div>
      );
    }

    const renderStepContent = () => {
    if (step > steps.length) {
        if(isQuoteRequest) return (
            <div className="text-center">
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type: 'spring', stiffness: 260, damping: 20}} className="w-16 h-16 bg-gray-500/20 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">{t('Inquiry_Sent')}</h2>
                <p className="text-gray-300 max-w-md mx-auto">{t('Our_team_will_contact_you_shortly_with_a_quote')}</p>
                <button type="button" onClick={() => navigate('/')} className="mt-8 bg-white text-black px-6 py-2 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors">Go to Home</button>
            </div>
        );
        return (
            <div className="text-center">
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type: 'spring', stiffness: 260, damping: 20}} className="w-16 h-16 bg-gray-500/20 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">{t('Booking_Request_Sent')}</h2>
                <p className="text-gray-300 max-w-md mx-auto">{t('We_will_confirm_your_booking_shortly')}</p>
                <button type="button" onClick={() => navigate('/')} className="mt-8 bg-white text-black px-6 py-2 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors">Go to Home</button>
            </div>
        );
    }
    
    const paymentStepContent = (
      <div>
        <div className="flex border-b border-gray-700">
          <button type="button" onClick={() => setFormData(p => ({...p, paymentMethod: 'stripe'}))} className={`flex-1 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 text-white border-b-2 border-white`}><CreditCardIcon className="w-5 h-5"/>{t('Credit_Card')}</button>
        </div>
        <div className="mt-6">
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-300 block">{t('Credit_Card')}</label>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-h-[56px] flex items-center">
              {isClientSecretLoading ? <div className="flex items-center text-gray-400 text-sm"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-t-white border-gray-600 rounded-full mr-2"/><span>Initializing Payment...</span></div> : <div ref={cardElementRef} className="w-full"/>}
            </div>
            {stripeError && <p className="text-xs text-red-400 mt-1">{stripeError}</p>}
          </div>
        </div>
      </div>
    );

    if (isQuoteRequest) {
        const departurePoints = isJet ? AIRPORTS : HELI_DEPARTURE_POINTS;
        const arrivalPoints = isJet ? AIRPORTS : HELI_ARRIVAL_POINTS;
        switch(step) {
            // FIX: Correctly handle union type for airport/heliport locations by checking for 'iata' or 'id' property.
            case 1: return <div className="space-y-6"><div><label className="text-sm text-gray-400 block mb-2">{t('Trip_Type')}</label><div className="flex border border-gray-700 rounded-full p-1"><button type="button" onClick={() => setFormData(p => ({...p, tripType: 'one-way'}))} className={`flex-1 py-1 text-sm rounded-full transition-colors ${formData.tripType === 'one-way' ? 'bg-white text-black' : 'text-gray-300'}`}>{t('One_Way')}</button><button type="button" onClick={() => setFormData(p => ({...p, tripType: 'round-trip'}))} className={`flex-1 py-1 text-sm rounded-full transition-colors ${formData.tripType === 'round-trip' ? 'bg-white text-black' : 'text-gray-300'}`}>{t('Round_Trip')}</button></div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-gray-400">{isJet ? t('Departure_Airport') : t('Departure_Point')}</label><select name="departurePoint" value={formData.departurePoint} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"><option value="">Select</option>{departurePoints.map(p => { const val = 'iata' in p ? p.iata : p.id; return <option key={val} value={val}>{p.name}</option>;})}</select></div><div><label className="text-sm text-gray-400">{isJet ? t('Arrival_Airport') : t('Arrival_Point')}</label><select name="arrivalPoint" value={formData.arrivalPoint} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"><option value="">Select</option>{arrivalPoints.map(p => { const val = 'iata' in p ? p.iata : p.id; return <option key={val} value={val}>{p.name}</option>;})}</select></div><div><label className="text-sm text-gray-400">{t('Departure_Date')}</label><input type="date" name="departureDate" value={formData.departureDate} onChange={handleChange} min={today} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div><div><label className="text-sm text-gray-400">{t('Departure_Time')}</label><input type="time" name="departureTime" value={formData.departureTime} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div></div><AnimatePresence>{formData.tripType === 'round-trip' && <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="grid grid-cols-2 gap-4"><div><label className="text-sm text-gray-400">{t('Return_Date')}</label><input type="date" name="returnDateQuote" value={formData.returnDateQuote} onChange={handleChange} min={formData.departureDate || today} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div><div><label className="text-sm text-gray-400">{t('Return_Time')}</label><input type="time" name="returnTimeQuote" value={formData.returnTimeQuote} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div></motion.div>}</AnimatePresence><div><label className="text-sm text-gray-400">{t('Number_of_Passengers')}</label><input type="number" name="passengers" value={formData.passengers} onChange={handleChange} min="1" className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div></div>;
            case 2: return <div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-gray-400">{t('Full_Name')}</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div><div><label className="text-sm text-gray-400">{t('Email_Address')}</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div></div><div><label className="text-sm text-gray-400">{t('Phone_Number')}</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div></div>
            case 3: return <div className="text-center"><h3 className="text-2xl font-bold text-white mb-4">Review Your Inquiry</h3><p className="text-gray-400">Please review the details below before submitting your quote request. Our team will contact you shortly with pricing and availability.</p></div>;
        }
    }
    
    if (isYacht) {
        switch(step) {
            case 1: return (
                <div className="space-y-6">
                    {isYacht && (
                        <div className="space-y-4 pb-6 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white">{t('Configuration')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm text-gray-400">{t('Check_in_Date')}</label><input type="date" name="checkinDate" value={formData.checkinDate} onChange={handleChange} min={today} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div>
                                <div><label className="text-sm text-gray-400">{t('Check_out_Date')}</label><input type="date" name="checkoutDate" value={formData.checkoutDate} onChange={handleChange} min={formData.checkinDate || today} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">{t('Pickup_Marina')}</label>
                                <select name="pickupMarina" value={formData.pickupMarina} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white">
                                    {YACHT_PICKUP_MARINAS.map(loc => (<option key={loc.id} value={loc.id}>{getTranslated(loc.label)}</option>))}
                                </select>
                            </div>
                        </div>
                    )}
                    <h3 className="text-lg font-semibold text-white">{t('Personal_Information')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm text-gray-400">{t('Full_Name')}</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div>
                        <div><label className="text-sm text-gray-400">{t('Email_Address')}</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div>
                        <div className="md:col-span-2"><label className="text-sm text-gray-400">{t('Phone_Number')}</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div>
                    </div>
                </div>
            );
            case 2: return paymentStepContent;
        }
    }
    
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="pt-32 pb-24 bg-black min-h-screen">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">{t('Book_Your')} <span className="text-white">{item.name}</span></h1>
        {renderContent()}
      </div>
    </motion.div>
  );
};
}
export default BookingPage;
