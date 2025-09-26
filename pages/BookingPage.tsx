import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { RENTAL_CATEGORIES, PICKUP_LOCATIONS, INSURANCE_OPTIONS, RENTAL_EXTRAS, COUNTRIES, INSURANCE_ELIGIBILITY, VALIDATION_MESSAGES, YACHT_PICKUP_MARINAS, AIRPORTS, HELI_DEPARTURE_POINTS, HELI_ARRIVAL_POINTS, VILLA_SERVICE_FEE_PERCENTAGE, CRYPTO_ADDRESSES, AGE_BUCKETS, LICENSE_YEARS_OPTIONS } from '../constants';
import type { Booking, Inquiry, RentalItem } from '../types';
import { CameraIcon, CreditCardIcon } from '../components/icons/Icons';

// Safely access the Stripe publishable key from Vite's environment variables.
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

type KaskoTier = 'KASKO_BASE' | 'KASKO_BLACK' | 'KASKO_SIGNATURE';

function isKaskoEligibleByBuckets(
  tier: KaskoTier,
  ageMin?: number,
  licenseYears?: number
): { eligible: boolean; reasonKey?: 'AGE_MISSING'|'LIC_MISSING'|'BASE_REQ'|'BLACK_REQ'|'SIGNATURE_REQ' } {
  if (!ageMin)  return { eligible: false, reasonKey: 'AGE_MISSING' };
  if (licenseYears === undefined || licenseYears === null) return { eligible: false, reasonKey: 'LIC_MISSING' };

  if (tier === 'KASKO_BASE')       return { eligible: licenseYears >= 2,  reasonKey: licenseYears >= 2 ? undefined : 'BASE_REQ' };
  if (tier === 'KASKO_BLACK')      return { eligible: ageMin >= 25 && licenseYears >= 5,  reasonKey: (ageMin >= 25 && licenseYears >= 5) ? undefined : 'BLACK_REQ' };
  /* KASKO_SIGNATURE */
  return { eligible: ageMin >= 30 && licenseYears >= 10, reasonKey: (ageMin >= 30 && licenseYears >= 10) ? undefined : 'SIGNATURE_REQ' };
}

const BookingPage: React.FC = () => {
  const { category: categoryId, itemId } = useParams<{ category: 'cars' | 'yachts' | 'jets' | 'helicopters' | 'villas'; itemId: string }>();
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
      fullName: '', email: '', phone: '', countryOfResidency: '', ageMin: '', licenseYears: '',
      pickupDate: today, pickupTime: '10:00', returnDate: '', returnTime: '10:00',
      pickupLocation: PICKUP_LOCATIONS[0].id, insuranceOption: INSURANCE_OPTIONS[0].id, extras: [] as string[],
      checkinDate: location.state?.checkinDate || today, 
      checkoutDate: location.state?.checkoutDate || '', 
      guests: location.state?.guests || 1,
      licenseImage: '', paymentMethod: 'stripe',
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
  
  const [insuranceError, setInsuranceError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cardElementRef = useRef<HTMLDivElement>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isClientSecretLoading, setIsClientSecretLoading] = useState(false);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFirstCarBooking, setIsFirstCarBooking] = useState(true);

  const { category, item, isCar, isJet, isHelicopter, isYacht, isVilla, isQuoteRequest } = useMemo(() => {
    const cat = RENTAL_CATEGORIES.find(c => c.id === categoryId);
    const itm = cat?.data.find(i => i.id === itemId);
    const car = cat?.id === 'cars';
    const jet = cat?.id === 'jets';
    const helicopter = cat?.id === 'helicopters';
    const yacht = cat?.id === 'yachts';
    const villa = cat?.id === 'villas';
    const quote = jet || helicopter;
    return { category: cat, item: itm, isCar: car, isJet: jet, isHelicopter: helicopter, isYacht: yacht, isVilla: villa, isQuoteRequest: quote };
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

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
        videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);
  
  const { 
    duration, rentalCost, insuranceCost, extrasCost, subtotal, taxes, total, nights, serviceFee, villaSubtotal
  } = useMemo(() => {
    const zeroState = { duration: { days: 0, hours: 0 }, rentalCost: 0, insuranceCost: 0, extrasCost: 0, subtotal: 0, taxes: 0, total: 0, nights: 0, serviceFee: 0, villaSubtotal: 0 };
    if (!item || !item.pricePerDay) return zeroState;
    
    const pricePerDay = item.pricePerDay[currency];
    
    if (isCar) {
      if (!formData.pickupDate || !formData.returnDate) return zeroState;
      const pickup = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
      const ret = new Date(`${formData.returnDate}T${formData.returnTime}`);
      if (pickup >= ret) return zeroState;

      const diffMs = ret.getTime() - pickup.getTime();
      const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      const billingDays = days + (hours > 0 ? 1 : 0);

      const calculatedRentalCost = (days * pricePerDay) + (hours * (pricePerDay / 12));
      const selectedInsurance = INSURANCE_OPTIONS.find(opt => opt.id === formData.insuranceOption);
      const calculatedInsuranceCost = (selectedInsurance?.pricePerDay[currency] || 0) * billingDays;
      const calculatedExtrasCost = formData.extras.reduce((acc, extraId) => {
        const extra = RENTAL_EXTRAS.find(e => e.id === extraId);
        return acc + (extra?.pricePerDay[currency] || 0) * billingDays;
      }, 0);
      
      const calculatedSubtotal = calculatedRentalCost + calculatedInsuranceCost + calculatedExtrasCost;
      const calculatedTaxes = calculatedSubtotal * 0.10;
      const calculatedTotal = calculatedSubtotal + calculatedTaxes;
      
      return { ...zeroState, duration: { days, hours }, rentalCost: calculatedRentalCost, insuranceCost: calculatedInsuranceCost, extrasCost: calculatedExtrasCost, subtotal: calculatedSubtotal, taxes: calculatedTaxes, total: calculatedTotal };
    } 
    
    if (isYacht || isVilla) {
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
      let calculatedServiceFee = 0;
      let calculatedTaxes = 0;

      if (isYacht) {
        calculatedSubtotal = calculatedRentalCost;
        calculatedTaxes = calculatedSubtotal * 0.10;
      } else if (isVilla) {
        calculatedServiceFee = calculatedRentalCost * VILLA_SERVICE_FEE_PERCENTAGE;
        calculatedSubtotal = calculatedRentalCost + calculatedServiceFee;
      }

      const calculatedTotal = calculatedSubtotal + calculatedTaxes;

      return { ...zeroState, duration: { days: diffDays, hours: 0 }, rentalCost: calculatedRentalCost, subtotal: calculatedSubtotal, taxes: calculatedTaxes, total: calculatedTotal, nights: diffDays, serviceFee: calculatedServiceFee, villaSubtotal: calculatedRentalCost };
    }
    return zeroState;
  }, [formData, item, currency, isCar, isYacht, isVilla]);

  useEffect(() => {
    if (step === (isCar ? 3 : 2) && !isQuoteRequest && total > 0) {
        setIsClientSecretLoading(true); setClientSecret(null); setStripeError(null);
        fetch('/.netlify/functions/create-payment-intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: total, currency }) })
        .then(res => res.json()).then(data => { if (data.error) { setStripeError(data.error); } else { setClientSecret(data.clientSecret); } })
        .catch(error => { console.error('Failed to fetch client secret:', error); setStripeError('Could not connect to payment server.'); })
        .finally(() => { setIsClientSecretLoading(false); });
    }
  }, [step, isQuoteRequest, total, currency, isCar]);

  useEffect(() => {
    let card: any = null;
    const paymentStep = isCar ? 3 : 2;
    if (stripe && step === paymentStep && !isQuoteRequest && formData.paymentMethod === 'stripe' && cardElementRef.current && clientSecret) {
        const elements = stripe.elements();
        card = elements.create('card', { style: { base: { color: '#ffffff', fontFamily: '"Exo 2", sans-serif', fontSmoothing: 'antialiased', fontSize: '16px', '::placeholder': { color: '#a0aec0' } }, invalid: { color: '#ef4444', iconColor: '#ef4444' } }, hidePostalCode: true });
        setCardElement(card); card.mount(cardElementRef.current);
        card.on('change', (event: any) => { setStripeError(event.error ? event.error.message : null); });
    }
    return () => { if (card) { card.destroy(); setCardElement(null); } };
  }, [stripe, step, formData.paymentMethod, clientSecret, isQuoteRequest, isCar]);

  useEffect(() => { if (user) { setFormData(prev => ({ ...prev, fullName: user.fullName || '', email: user.email || '' })); } }, [user]);

  useEffect(() => {
    // Reset on category change or user logout
    if (!isCar || !user) {
      setIsFirstCarBooking(false);
      return;
    }

    const checkFirstBooking = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('bookingId')
        .eq('userId', user.id)
        .eq('itemCategory', 'cars')
        .limit(1);

      if (error) {
        console.error('Error checking for previous bookings:', error);
        // Default to requiring license upload if check fails
        setIsFirstCarBooking(true);
        return;
      }

      setIsFirstCarBooking(data.length === 0);
    };

    checkFirstBooking();
  }, [isCar, user]);

  useEffect(() => {
    if (!isCar) return;

    const ageMin = formData.ageMin ? parseInt(formData.ageMin, 10) : undefined;
    const licenseYears = formData.licenseYears ? parseInt(formData.licenseYears, 10) : undefined;

    if (ageMin === undefined || licenseYears === undefined) {
      setFormData(prev => ({ ...prev, insuranceOption: 'KASKO_BASE' }));
      setInsuranceError('');
      return;
    }

    let bestOption: KaskoTier = 'KASKO_BASE';
    let eligibilityErrorKey: string | undefined;

    const signatureCheck = isKaskoEligibleByBuckets('KASKO_SIGNATURE', ageMin, licenseYears);
    if (signatureCheck.eligible) {
      bestOption = 'KASKO_SIGNATURE';
    } else {
      const blackCheck = isKaskoEligibleByBuckets('KASKO_BLACK', ageMin, licenseYears);
      if (blackCheck.eligible) {
        bestOption = 'KASKO_BLACK';
        eligibilityErrorKey = signatureCheck.reasonKey;
      } else {
        const baseCheck = isKaskoEligibleByBuckets('KASKO_BASE', ageMin, licenseYears);
        if (baseCheck.eligible) {
          bestOption = 'KASKO_BASE';
          eligibilityErrorKey = blackCheck.reasonKey;
        } else {
          bestOption = 'KASKO_BASE'; // Default to base, error will be shown
          eligibilityErrorKey = baseCheck.reasonKey;
        }
      }
    }

    setFormData(prev => ({ ...prev, insuranceOption: bestOption }));
    setInsuranceError(eligibilityErrorKey ? t(eligibilityErrorKey) : '');

  }, [isCar, formData.ageMin, formData.licenseYears, t]);
  
  const formatPrice = (price: number) => new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(price);
  const formatDate = (date: string) => new Date(date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, extras: checked ? [...prev.extras, name] : prev.extras.filter(id => id !== name) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({...prev, [name]: ''}));
  };
  
  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => { setFormData(prev => ({...prev, licenseImage: event.target?.result as string})); setErrors(prev => ({...prev, licenseImage: ''})); }; reader.readAsDataURL(file); }
  };
  
  const handleUseCameraClick = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraStream(stream);
            setIsCameraOpen(true);
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Camera access was denied. Please check your browser settings.");
        }
    } else {
        alert("Your browser does not support camera access.");
    }
  };

  const handleCloseCamera = () => {
      if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
      setIsCameraOpen(false);
  };

  const handleTakePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageDataUrl = canvas.toDataURL('image/jpeg');
              setFormData(prev => ({ ...prev, licenseImage: imageDataUrl }));
              setErrors(prev => ({...prev, licenseImage: ''}));
          }
          handleCloseCamera();
      }
  };

  const validateStep = () => {
    if (step === 1 && isCar) {
      const newErrors: Record<string, string> = {};

      if (!formData.ageMin) {
        newErrors.ageMin = t('AGE_MISSING');
      }
      if (!formData.licenseYears) {
        newErrors.licenseYears = t('LIC_MISSING');
      }

      if (formData.ageMin && formData.licenseYears) {
        const ageMin = parseInt(formData.ageMin, 10);
        const licenseYears = parseInt(formData.licenseYears, 10);
        const baseCheck = isKaskoEligibleByBuckets('KASKO_BASE', ageMin, licenseYears);
        if (!baseCheck.eligible && baseCheck.reasonKey) {
          newErrors.insurance = t(baseCheck.reasonKey as any);
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (step === 2 && isCar) {
      const newErrors: Record<string, string> = {};
      if (isFirstCarBooking && !formData.licenseImage) {
        newErrors.licenseImage = t('DRIVING_LICENSE_MANDATORY_FIRST_BOOKING');
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    return true;
  };

  const handleNext = () => validateStep() && setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);
  
  const finalizeBooking = async () => {
    if (!item) return;

    let licenseImageUrl = '';
    if (isCar && formData.licenseImage) {
        try {
            // Convert data URL to Blob
            const response = await fetch(formData.licenseImage);
            const blob = await response.blob();

            const fileExtension = blob.type.split('/')[1];
            const fileName = `${user?.id || 'guest'}_${Date.now()}.${fileExtension}`;
            const filePath = `public/${fileName}`;

            const { data, error } = await supabase.storage
                .from('driver-licenses')
                .upload(filePath, blob, {
                    contentType: blob.type
                });

            if (error) {
                throw error;
            }

            const { data: publicUrlData } = supabase.storage
                .from('driver-licenses')
                .getPublicUrl(filePath);

            if (!publicUrlData) {
                throw new Error("Could not get public URL for the uploaded image.");
            }
            licenseImageUrl = publicUrlData.publicUrl;

        } catch (error) {
            console.error('Error uploading license image:', error);
            // Optionally, set an error state to inform the user
            setErrors(prev => ({...prev, licenseImage: "Failed to upload license image. Please try again."}));
            setIsProcessing(false);
            return; // Stop the booking process
        }
    }


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
    } else {
        const commonData = {
          userId: user ? user.id : 'guest-user', itemId: item.id, itemName: item.name, image: item.image,
          itemCategory: categoryId,
          totalPrice: total, currency: currency.toUpperCase() as 'USD' | 'EUR',
          customer: { fullName: formData.fullName, email: formData.email, phone: formData.phone, age: Number(formData.ageMin), countryOfResidency: formData.countryOfResidency },
          paymentMethod: formData.paymentMethod, bookedAt: new Date().toISOString(),
        };

        let newBookingData: Omit<Booking, 'bookingId'>;
        if(isCar) {
            newBookingData = { ...commonData, itemCategory: 'cars', pickupDate: formData.pickupDate, pickupTime: formData.pickupTime, returnDate: formData.returnDate, returnTime: formData.returnTime, duration: `${duration.days} ${duration.days === 1 ? t('day') : t('days')}, ${duration.hours} ${duration.hours === 1 ? t('hour') : t('hours')}`, driverLicenseImage: licenseImageUrl, extras: formData.extras, pickupLocation: formData.pickupLocation, insuranceOption: formData.insuranceOption };
        } else if (isYacht) {
            newBookingData = { ...commonData, itemCategory: 'yachts', pickupDate: formData.checkinDate, pickupTime: '15:00', returnDate: formData.checkoutDate, returnTime: '11:00', duration: `${nights} ${nights === 1 ? t('Night') : t('Nights')}`, driverLicenseImage: '', extras: [], pickupLocation: formData.pickupMarina, insuranceOption: 'none' };
        } else { // isVilla
            newBookingData = { ...commonData, itemCategory: 'villas', pickupDate: formData.checkinDate, pickupTime: '15:00', returnDate: formData.checkoutDate, returnTime: '11:00', duration: `${nights} ${nights === 1 ? t('Night') : t('Nights')}`, driverLicenseImage: '', extras: [], pickupLocation: item.location || 'Villa', insuranceOption: 'none' };
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
    if (isCar) return [ { id: 1, name: t('Driver_Information') }, { id: 2, name: t('Configuration_and_Verification') }, { id: 3, name: t('Payment') } ];
    if (isQuoteRequest) return [ { id: 1, name: t('Itinerary') }, { id: 2, name: t('Personal_Information') }, { id: 3, name: t('Review_and_Submit') } ];
    if (isYacht || isVilla) return [ { id: 1, name: t('Review_your_booking') }, { id: 2, name: t('Payment') }];
    return [];
  }, [isCar, isQuoteRequest, isYacht, isVilla, t]);

  if (!item) return <div className="pt-32 text-center text-white">Item not found.</div>;
  
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

    if (isCar) {
        const assignedInsurance = INSURANCE_OPTIONS.find(opt => opt.id === formData.insuranceOption);
        switch (step) {
            case 1: return <div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-gray-400">{t('Full_Name')}</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}</div><div><label className="text-sm text-gray-400">{t('Email_Address')}</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}</div><div><label className="text-sm text-gray-400">{t('Phone_Number')}</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div><div><label className="text-sm text-gray-400">{t('Country_of_Residency')}</label><select name="countryOfResidency" value={formData.countryOfResidency} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"><option value="">Select Country</option>{COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select>{errors.countryOfResidency && <p className="text-xs text-red-400 mt-1">{errors.countryOfResidency}</p>}</div><div><label className="text-sm text-gray-400">{t('Age')}</label><select name="ageMin" value={formData.ageMin} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"><option value="" disabled>{t('Select_age')}</option>{AGE_BUCKETS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}</select>{errors.ageMin && <p className="text-xs text-red-400 mt-1">{errors.ageMin}</p>}</div><div><label className="text-sm text-gray-400">{t('License_years')}</label><select name="licenseYears" value={formData.licenseYears} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"><option value="" disabled>{t('Select_years')}</option>{LICENSE_YEARS_OPTIONS.map(y => <option key={y} value={y}>{y === 15 ? '15+' : y}</option>)}</select>{errors.licenseYears && <p className="text-xs text-red-400 mt-1">{errors.licenseYears}</p>}</div></div>{errors.insurance && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-3 mt-4">{errors.insurance}</p>}</div>;
            case 2: return <div className="space-y-6"><div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-gray-400">{t('Pickup_Date')}</label><input type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} min={today} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div><div><label className="text-sm text-gray-400">{t('Pickup_Time')}</label><input type="time" name="pickupTime" value={formData.pickupTime} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div><div><label className="text-sm text-gray-400">{t('Return_Date')}</label><input type="date" name="returnDate" value={formData.returnDate} onChange={handleChange} min={formData.pickupDate || today} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div><div><label className="text-sm text-gray-400">{t('Return_Time')}</label><input type="time" name="returnTime" value={formData.returnTime} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div></div>{errors.date && <p className="text-xs text-red-400">{errors.date}</p>}<div><label className="text-sm text-gray-400">{t('Pickup_Location')}</label><select name="pickupLocation" value={formData.pickupLocation} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"><option value="" disabled>{t('Select_an_option')}</option>{PICKUP_LOCATIONS.map(loc => (<option key={loc.id} value={loc.id}>{getTranslated(loc.label)}</option>))}</select></div> {assignedInsurance && <div><h3 className="text-lg font-semibold text-white mb-2">{t('Assigned_Insurance_Plan_Notice')}</h3><div className={`p-4 rounded-md border ${insuranceError ? 'border-red-500' : 'border-gray-700'} bg-gray-800/50`}><p className="font-semibold text-white">{getTranslated(assignedInsurance.label)}</p><p className="text-sm text-gray-400">{getTranslated(assignedInsurance.description)}</p>{insuranceError && <p className="text-xs text-red-400 mt-2">{insuranceError}</p>}</div></div>}<div><h3 className="text-lg font-semibold text-white mb-2">{t('Extras_and_Addons')}</h3><div className="space-y-2">{RENTAL_EXTRAS.map(extra => (<label key={extra.id} className="flex items-center p-3 bg-gray-800/50 rounded-md border border-gray-700 cursor-pointer has-[:checked]:border-white"><input type="checkbox" name={extra.id} checked={formData.extras.includes(extra.id)} onChange={handleChange} className="h-4 w-4 text-white bg-gray-700 border-gray-600 rounded focus:ring-white"/><span className="ml-3 text-white">{getTranslated(extra.label)}</span><span className="ml-auto font-semibold text-white">{formatPrice(extra.pricePerDay[currency])}/{t('day')}</span></label>))}</div></div><div><h3 className="text-lg font-semibold text-white mb-2">{t('License_Verification')}</h3><div className="p-4 border-2 border-dashed border-gray-700 rounded-lg text-center"><p className="text-sm text-gray-400 mb-4">{t('Please_provide_a_clear_photo_of_your_drivers_license')}</p>{formData.licenseImage ? <div className="relative inline-block"><img src={formData.licenseImage} alt="License Preview" className="h-40 w-auto mx-auto rounded-md object-contain"/><label htmlFor="license-upload" className="absolute -bottom-2 -right-2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200">{t('Change_Photo')}</label></div> : <div className="flex justify-center space-x-4"><label htmlFor="license-upload" className="px-4 py-2 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors text-sm cursor-pointer">{t('Upload_File')}</label><button type="button" onClick={handleUseCameraClick} className="px-4 py-2 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors text-sm flex items-center"><CameraIcon className="w-4 h-4 mr-2" />{t('Use_Camera')}</button></div>}<input id="license-upload" type="file" accept="image/*" onChange={handleLicenseUpload} className="sr-only"/>{errors.licenseImage && <p className="text-xs text-red-400 mt-2">{errors.licenseImage}</p>}</div></div></div>;
            case 3: return paymentStepContent;
        }
    }
    
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
    
    if (isYacht || isVilla) {
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
      <AnimatePresence>
          {isCameraOpen && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
              >
                  <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[70vh] rounded-lg mb-4" style={{ transform: 'scaleX(-1)' }}></video>
                  <div className="flex space-x-4">
                      <button type="button" onClick={handleTakePhoto} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                          {t('Take_Photo')}
                      </button>
                      <button type="button" onClick={handleCloseCamera} className="px-6 py-2 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors">
                          {t('Close')}
                      </button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
      <canvas ref={canvasRef} className="hidden"></canvas>
      <div className="container mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">{t('Book_Your')} <span className="text-white">{item.name}</span></h1>
        {step <= steps.length && <div className="w-full max-w-lg mx-auto mb-12"><div className="flex items-center justify-between">{steps.map((s, index) => (<React.Fragment key={s.id}><div className="flex flex-col items-center text-center"><div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'bg-white border-white text-black' : 'border-gray-600 text-gray-400'}`}>{s.id}</div><p className={`mt-2 text-xs font-semibold ${step >= s.id ? 'text-white' : 'text-gray-500'}`}>{s.name}</p></div>{index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${step > s.id ? 'bg-white' : 'bg-gray-700'}`}></div>}</React.Fragment>))}</div></div>}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <aside className="lg:col-span-1 lg:sticky lg:top-32 self-start mb-8 lg:mb-0">
            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-4">{isQuoteRequest ? t('Inquiry_Summary') : t('Booking_Summary')}</h2>
              <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-md mb-4"/>
                {!isQuoteRequest ? (<><div className="space-y-2 text-sm">
                  {isCar && (<><div className="flex justify-between"><span className="text-gray-400">{t('Total_Duration')}</span><span className="text-white font-medium">{duration.days} {t('days')}, {duration.hours} {t('hours')}</span></div><div className="flex justify-between"><span className="text-gray-400">{t('Rental_Cost')}</span><span className="text-white font-medium">{formatPrice(rentalCost)}</span></div><div className="flex justify-between"><span className="text-gray-400">{t('Insurance')}</span><span className="text-white font-medium">{formatPrice(insuranceCost)}</span></div>{extrasCost > 0 && <div className="flex justify-between"><span className="text-gray-400">{t('Extras')}</span><span className="text-white font-medium">{formatPrice(extrasCost)}</span></div>}</>)}
                  {isYacht && (<><div className="flex justify-between"><span className="text-gray-400">{t('Duration')}</span><span className="text-white font-medium">{nights} {nights === 1 ? t('Night') : t('Nights')}</span></div><div className="flex justify-between"><span className="text-gray-400">{t('Booking_Cost')}</span><span className="text-white font-medium">{formatPrice(rentalCost)}</span></div></>)}
                  {isVilla && (<><div className="flex justify-between"><span className="text-gray-400">{t('Duration')}</span><span className="text-white font-medium">{nights} {nights === 1 ? t('Night') : t('Nights')}</span></div><div className="flex justify-between"><span className="text-gray-400">{formatPrice(item.pricePerDay?.[currency] || 0)} x {nights} {t('nights')}</span><span className="text-white font-medium">{formatPrice(villaSubtotal)}</span></div><div className="flex justify-between"><span className="text-gray-400">{t('Service_Fee')}</span><span className="text-white font-medium">{formatPrice(serviceFee)}</span></div></>)}
                  {(isCar || isYacht) && <div className="flex justify-between"><span className="text-gray-400">{t('Taxes_and_Fees')}</span><span className="text-white font-medium">{formatPrice(taxes)}</span></div>}
                </div><div className="flex justify-between text-xl border-t border-white/20 pt-2 mt-2"><span className="text-white font-bold">{t('Total')}</span><span className="text-white font-bold">{formatPrice(total)}</span></div></>) : <div className="text-center py-4"><span className="text-xl font-bold text-white">{t('Quote_by_request')}</span><p className="text-sm text-gray-400 mt-1">Submit an inquiry to receive a personalized quote.</p></div>}
            </div>
          </aside>
          <main className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="bg-gray-900/50 p-8 rounded-lg border border-gray-800">{renderStepContent()}</motion.div></AnimatePresence>
              {step <= steps.length && <div className="flex justify-between mt-8"><button type="button" onClick={handleBack} disabled={step === 1} className="px-8 py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('Back')}</button>{step < steps.length ? <button type="button" onClick={handleNext} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">{t('Next')}</button> : <button type="submit" disabled={isProcessing} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed">{isProcessing ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-t-black border-gray-700/50 rounded-full inline-block mr-2"/>{t('Processing')}</> : (isQuoteRequest ? t('Submit_Inquiry') : t('Confirm_Booking'))}</button>}</div>}
            </form>
          </main>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingPage;