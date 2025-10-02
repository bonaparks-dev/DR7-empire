// CarBookingWizard.tsx — corrected & hardened version (ready to paste)

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import { PICKUP_LOCATIONS, INSURANCE_OPTIONS, RENTAL_EXTRAS, INSURANCE_ELIGIBILITY } from '../../constants';
import type { Booking, RentalItem } from '../../types';
import { Link } from 'react-router-dom';
import { XIcon } from '../icons/Icons';
import DocumentUploader from './DocumentUploader';

const FUNCTIONS_BASE =
  import.meta.env.VITE_FUNCTIONS_BASE ??
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:8888'
    : window.location.origin);

// Stripe publishable key
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
  return { eligible: ageMin >= 30 && licenseYears >= 10, reasonKey: (ageMin >= 30 && licenseYears >= 10) ? undefined : 'SIGNATURE_REQ' };
}

const calculateAgeFromDDMMYYYY = (dateString: string): number => {
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) return 0;
  const [d, m, y] = dateString.split('/');
  const day = parseInt(d, 10);
  const month = parseInt(m, 10) - 1;
  const year = parseInt(y, 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;

  const birthDate = new Date(year, month, day);
  if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month || birthDate.getDate() !== day) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const diffM = today.getMonth() - birthDate.getMonth();
  if (diffM < 0 || (diffM === 0 && today.getDate() < birthDate.getDate())) age--;
  return age < 0 ? 0 : age;
};

const calculateYearsSince = (dateString: string): number => {
  if (!dateString) return 0;
  const sinceDate = new Date(dateString);
  if (isNaN(sinceDate.getTime())) return 0;

  const today = new Date();
  let years = today.getFullYear() - sinceDate.getFullYear();
  const diffM = today.getMonth() - sinceDate.getMonth();
  if (diffM < 0 || (diffM === 0 && today.getDate() < sinceDate.getDate())) years--;
  return years < 0 ? 0 : years;
};

// === Km inclusi per durata ===
// 1gg=100, 2gg=180, 3gg=240, 4gg=300, dal 5° giorno +60/giorno
const calculateIncludedKm = (days: number) => {
  if (days <= 0) return 0;
  if (days === 1) return 100;
  if (days === 2) return 180;
  if (days === 3) return 240;
  if (days === 4) return 300;
  return 300 + ((days - 4) * 60);
};

interface CarBookingWizardProps {
  item: RentalItem;
  onBookingComplete: (booking: Booking) => void;
  onClose: () => void;
}

const CarBookingWizard: React.FC<CarBookingWizardProps> = ({ item, onBookingComplete, onClose }) => {
  const { t, getTranslated } = useTranslation();
  const { currency } = useCurrency();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    // Step 1
    pickupLocation: PICKUP_LOCATIONS[0].id,
    returnLocation: PICKUP_LOCATIONS[0].id,
    pickupDate: today,
    pickupTime: '10:30',
    returnDate: today,
    returnTime: '09:00',

    // Step 2
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    licenseNumber: '',
    licenseIssueDate: '',
    licenseImage: null as File | string | null, // File or dataURL
    idImage: null as File | string | null,
    isSardinianResident: false,
    confirmsInformation: false,

    addSecondDriver: false,
    secondDriver: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      licenseNumber: '',
      licenseIssueDate: '',
      licenseImage: null as File | string | null,
      idImage: null as File | string | null,
    },

    // Step 3
    insuranceOption: 'KASKO_BASE',
    extras: [] as string[],

    // Step 4
    paymentMethod: 'stripe' as 'stripe' | 'agency',
    agreesToTerms: false,
    agreesToPrivacy: false,
    confirmsDocuments: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Stripe
  const cardElementRef = useRef<HTMLDivElement>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isClientSecretLoading, setIsClientSecretLoading] = useState(false);

  // Camera
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Health ping (helps detect wrong FUNCTIONS_BASE early)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${FUNCTIONS_BASE}/.netlify/functions/health`, { method: 'GET' });
        if (!res.ok) console.warn('Functions health not OK:', res.status, res.statusText);
        else console.log('Functions health: OK');
      } catch (e) {
        console.error('Functions not reachable at', FUNCTIONS_BASE, e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Horaires de retrait admissibles (pas de dimanche) ===
  const getValidPickupTimes = (date: string): string[] => {
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0) return [];

    const times: string[] = [];
    const addTimes = (start: number, end: number, interval: number) => {
      for (let i = start; i <= end; i += interval) {
        const hours = Math.floor(i / 60);
        const minutes = i % 60;
        times.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      }
    };

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      addTimes(10 * 60 + 30, 12 * 60 + 30, 30);
      addTimes(17 * 60 + 30, 18 * 60 + 30, 30);
    } else if (dayOfWeek === 6) {
      addTimes(10 * 60 + 30, 13 * 60 + 30, 30);
    }
    return times;
  };

  // Stripe.js ready
  useEffect(() => {
    if ((window as any).Stripe) {
      if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('YOUR_')) {
        console.error("Stripe.js loaded but publishable key is not set.");
        setStripeError("Payment service is not configured correctly.");
        return;
      }
      setStripe((window as any).Stripe(STRIPE_PUBLISHABLE_KEY));
    } else {
      console.error("Stripe.js has not loaded.");
    }
  }, []);

  // Camera stream binding
  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  // Return time auto (pickup - 1h30)
  useEffect(() => {
    if (formData.pickupTime) {
      const [hours, minutes] = formData.pickupTime.split(':').map(Number);
      const tempDate = new Date(2000, 0, 1, hours, minutes);
      tempDate.setHours(tempDate.getHours() - 1);
      tempDate.setMinutes(tempDate.getMinutes() - 30);
      const returnHours = String(tempDate.getHours()).padStart(2, '0');
      const returnMinutes = String(tempDate.getMinutes()).padStart(2, '0');
      const newReturnTime = `${returnHours}:${returnMinutes}`;
      setFormData(prev => ({ ...prev, returnTime: newReturnTime }));
    }
  }, [formData.pickupTime]);

  // === Calculs tarifaires / durée / km inclus ===
  const {
    duration, rentalCost, insuranceCost, extrasCost, subtotal, taxes, total, includedKm,
    driverAge, licenseYears, youngDriverFee, recentLicenseFee, secondDriverFee
  } = useMemo(() => {
    const zero = { duration: { days: 0, hours: 0 }, rentalCost: 0, insuranceCost: 0, extrasCost: 0, subtotal: 0, taxes: 0, total: 0, includedKm: 0, driverAge: 0, licenseYears: 0, youngDriverFee: 0, recentLicenseFee: 0, secondDriverFee: 0 };
    if (!item || !item.pricePerDay) return zero;

    const pricePerDay = item.pricePerDay[currency];

    let billingDays = 0;
    let days = 0;
    let hours = 0;
    if (formData.pickupDate && formData.returnDate) {
      const pickup = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
      const ret = new Date(`${formData.returnDate}T${formData.returnTime}`);
      if (pickup < ret) {
        const diffMs = ret.getTime() - pickup.getTime();
        const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
        days = Math.floor(totalHours / 24);
        hours = totalHours % 24;
        billingDays = days + (hours > 0 ? 1 : 0);
      }
    }

    const calculatedRentalCost = billingDays * pricePerDay;
    const selectedInsurance = INSURANCE_OPTIONS.find(opt => opt.id === formData.insuranceOption);
    const calculatedInsuranceCost = (selectedInsurance?.pricePerDay[currency] || 0) * billingDays;
    const calculatedExtrasCost = formData.extras.reduce((acc, extraId) => {
      const extra = RENTAL_EXTRAS.find(e => e.id === extraId);
      return acc + (extra?.pricePerDay[currency] || 0) * billingDays;
    }, 0);

    const calculatedDriverAge = calculateAgeFromDDMMYYYY(formData.birthDate);
    const calculatedLicenseYears = calculateYearsSince(formData.licenseIssueDate);

    const calculatedYoungDriverFee = calculatedDriverAge > 0 && calculatedDriverAge < 25 ? 10 * billingDays : 0;
    const calculatedRecentLicenseFee = calculatedLicenseYears >= 2 && calculatedLicenseYears < 3 ? 20 * billingDays : 0;
    const calculatedSecondDriverFee = formData.addSecondDriver ? 10 * billingDays : 0;

    const calculatedSubtotal = calculatedRentalCost + calculatedInsuranceCost + calculatedExtrasCost + calculatedYoungDriverFee + calculatedRecentLicenseFee + calculatedSecondDriverFee;
    const calculatedTaxes = calculatedSubtotal * 0.10;
    const calculatedTotal = calculatedSubtotal + calculatedTaxes;

    const calculatedIncludedKm = calculateIncludedKm(billingDays);

    return {
      duration: { days, hours },
      rentalCost: calculatedRentalCost,
      insuranceCost: calculatedInsuranceCost,
      extrasCost: calculatedExtrasCost,
      subtotal: calculatedSubtotal,
      taxes: calculatedTaxes,
      total: calculatedTotal,
      includedKm: calculatedIncludedKm,
      driverAge: calculatedDriverAge,
      licenseYears: calculatedLicenseYears,
      youngDriverFee: calculatedYoungDriverFee,
      recentLicenseFee: calculatedRecentLicenseFee,
      secondDriverFee: calculatedSecondDriverFee
    };
  }, [
    formData.pickupDate, formData.pickupTime, formData.returnDate, formData.returnTime,
    formData.insuranceOption, formData.extras, formData.birthDate, formData.licenseIssueDate, formData.addSecondDriver,
    item, currency
  ]);

  // Forcer horaires valides et pas de dimanche
  useEffect(() => {
    const validTimes = getValidPickupTimes(formData.pickupDate);
    if (validTimes.length > 0 && !validTimes.includes(formData.pickupTime)) {
      setFormData(prev => ({ ...prev, pickupTime: validTimes[0] }));
    } else if (validTimes.length === 0 && formData.pickupTime) {
      setFormData(prev => ({ ...prev, pickupTime: '' }));
    }
  }, [formData.pickupDate]);

  // Client secret (inclut userId/email pour réconciliation)
  useEffect(() => {
    if (step === 4 && total > 0) {
      setIsClientSecretLoading(true);
      setClientSecret(null);
      setStripeError(null);

      fetch(`${FUNCTIONS_BASE}/.netlify/functions/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency,
          userId: user?.id,
          email: formData.email
        })
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`create-payment-intent ${res.status} ${res.statusText} ${text}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.error) { setStripeError(data.error); }
          else { setClientSecret(data.clientSecret); }
        })
        .catch(err => {
          console.error('Failed to fetch client secret:', err);
          setStripeError('Could not connect to payment server.');
        })
        .finally(() => setIsClientSecretLoading(false));
    }
  }, [step, total, currency, user?.id, formData.email]);

  // Mount Stripe Card Element (no return_url; 3DS in-page)
  useEffect(() => {
    let card: any = null;
    if (stripe && step === 4 && formData.paymentMethod === 'stripe' && cardElementRef.current && clientSecret) {
      const elements = stripe.elements();
      card = elements.create('card', {
        style: {
          base: {
            color: '#ffffff',
            fontFamily: '"Exo 2", sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': { color: '#a0aec0' }
          },
          invalid: { color: '#ef4444', iconColor: '#ef4444' }
        },
        hidePostalCode: true
      });
      setCardElement(card);
      card.mount(cardElementRef.current);
      card.on('change', (event: any) => setStripeError(event.error ? event.error.message : null));
    }
    return () => { if (card) { card.destroy(); setCardElement(null); } };
  }, [stripe, step, formData.paymentMethod, clientSecret]);

  // Pré-remplir email si connecté
  useEffect(() => { if (user) setFormData(prev => ({ ...prev, email: user.email || '' })); }, [user]);

  // Éligibilité KASKO auto (downgrade si non éligible)
  useEffect(() => {
    const currentChoice: KaskoTier = formData.insuranceOption as KaskoTier;
    const { eligible: currentOk } = isKaskoEligibleByBuckets(currentChoice, driverAge, licenseYears);
    if (currentOk) return;

    let best: KaskoTier = 'KASKO_BASE';
    const sig = isKaskoEligibleByBuckets('KASKO_SIGNATURE', driverAge, licenseYears);
    const blk = isKaskoEligibleByBuckets('KASKO_BLACK', driverAge, licenseYears);
    if (sig.eligible) best = 'KASKO_SIGNATURE';
    else if (blk.eligible) best = 'KASKO_BLACK';
    else best = 'KASKO_BASE';

    setFormData(prev => ({ ...prev, insuranceOption: best }));
  }, [driverAge, licenseYears]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(price);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isFile = type === 'file';

    if (name === 'pickupDate') {
      const dayOfWeek = new Date(value).getDay();
      if (dayOfWeek === 0) {
        setErrors(prev => ({ ...prev, pickupDate: "Le prenotazioni non sono disponibili la domenica." }));
        return;
      } else {
        setErrors(prev => ({ ...prev, pickupDate: "" }));
      }
    }

    const [, secondDriverField] = name.split('.');
    if (secondDriverField) {
      setFormData(prev => ({
        ...prev,
        secondDriver: {
          ...prev.secondDriver,
          [secondDriverField]: isFile ? (e.target as HTMLInputElement).files?.[0] || null : (isCheckbox ? (e.target as HTMLInputElement).checked : value),
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (isFile ? (e.target as HTMLInputElement).files?.[0] || null : value)
      }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Camera helpers
  const handleUseCameraClick = async () => {
    if (navigator.mediaDevices?.getUserMedia) {
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
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    setCameraStream(null);
    setIsCameraOpen(false);
  };
  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setFormData(prev => ({ ...prev, licenseImage: dataUrl }));
        setErrors(prev => ({ ...prev, licenseImage: '' }));
      }
      handleCloseCamera();
    }
  };

  // ---------- Pure dataURL → Blob (no fetch on data URLs) ----------
  const dataURLToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) throw new Error('Invalid data URL.');
    const mime = parts[0].match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
    const binary = atob(parts[1]);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  };

  // Upload (File or dataURL) via Netlify function to handle CORS
  const uploadToBucket = async (bucket: string, userId: string, fileOrDataUrl: File | string | null, prefix: string): Promise<string> => {
    if (!fileOrDataUrl) {
      throw new Error("No file provided for upload.");
    }

    try {
      let fileToUpload: Blob;
      let fileName: string;

      if (typeof fileOrDataUrl === 'string') {
        fileToUpload = dataURLToBlob(fileOrDataUrl);
        fileName = `${prefix}_${Date.now()}.jpg`;
      } else {
        fileToUpload = fileOrDataUrl;
        fileName = fileOrDataUrl.name;
      }

      const body = new FormData();
      body.append('file', fileToUpload, fileName);
      body.append('bucket', bucket);
      body.append('userId', userId);
      body.append('prefix', prefix);

      const response = await fetch(`${FUNCTIONS_BASE}/.netlify/functions/upload-file`, {
        method: 'POST',
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
        console.error('Upload error response:', errorData);
        throw new Error(errorData.details || errorData.error || 'Upload failed');
      }

      const result = await response.json();
      if (!result.path) {
        throw new Error('Upload succeeded but no path was returned from function.');
      }

      return result.path;

    } catch (e: any) {
      console.error(`Upload failed for ${prefix}:`, e);
      throw new Error(e.message || 'Unknown upload error');
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.pickupDate || formData.pickupDate.trim() === '') {
        newErrors.pickupDate = "La data di ritiro è obbligatoria.";
      }
      if (!formData.returnDate || formData.returnDate.trim() === '') {
        newErrors.returnDate = "La data di riconsegna è obbligatoria.";
      }
      if (formData.pickupDate && formData.returnDate && new Date(formData.pickupDate) >= new Date(formData.returnDate)) {
        newErrors.date = "La data di riconsegna deve essere successiva a quella di ritiro.";
      }
      if (formData.pickupDate && new Date(formData.pickupDate).getDay() === 0) {
        newErrors.pickupDate = "Le prenotazioni non sono disponibili la domenica.";
      }
    }
    if (step === 2) {
      const ly = calculateYearsSince(formData.licenseIssueDate);
      if (!formData.firstName) newErrors.firstName = "Il nome è obbligatorio.";
      if (!formData.lastName) newErrors.lastName = "Il cognome è obbligatorio.";
      if (!formData.email) newErrors.email = "L'email è obbligatoria.";
      if (!formData.phone) newErrors.phone = "Il telefono è obbligatorio.";
      if (!formData.birthDate) newErrors.birthDate = "La data di nascita è obbligatoria.";
      if (!formData.licenseNumber) newErrors.licenseNumber = "Il numero di patente è obbligatorio.";
      if (!formData.licenseIssueDate) newErrors.licenseIssueDate = "La data di rilascio della patente è obbligatoria.";
      if (!formData.licenseImage) newErrors.licenseImage = "La foto della patente è obbligatoria.";
      if (!formData.idImage) newErrors.idImage = "La foto del documento d'identità è obbligatoria.";
      if (!formData.confirmsInformation) newErrors.confirmsInformation = "Devi confermare che le informazioni sono corrette.";
      if (ly < 2) newErrors.licenseIssueDate = "È richiesta una patente con almeno 2 anni di anzianità.";
      if (formData.addSecondDriver) {
        if (!formData.secondDriver.firstName) newErrors['secondDriver.firstName'] = "Il nome del secondo guidatore è obbligatorio.";
        if (!formData.secondDriver.lastName) newErrors['secondDriver.lastName'] = "Il cognome del secondo guidatore è obbligatorio.";
      }
    }
    if (step === 4) {
      if (!formData.confirmsDocuments) {
        newErrors.confirmsDocuments = "Devi confermare che i documenti sono corretti.";
      }
      if (!formData.agreesToTerms) {
        newErrors.agreesToTerms = "Devi accettare i termini e le condizioni.";
      }
      if (!formData.agreesToPrivacy) {
        newErrors.agreesToPrivacy = "Devi accettare l'informativa sulla privacy.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const finalizeBooking = async () => {
    if (!user) {
      setErrors(prev => ({ ...prev, form: "You must be logged in to book." }));
      setIsProcessing(false);
      return;
    }

    // Validate required fields before upload
    if (!formData.pickupDate || !formData.returnDate) {
      setErrors(prev => ({ ...prev, form: "Pickup and return dates are required." }));
      setIsProcessing(false);
      return;
    }

    try {
      // Upload secure documents
      const licenseImageUrl = await uploadToBucket('driver-licenses', user.id, formData.licenseImage, 'license');
      const idImageUrl = await uploadToBucket('driver-ids', user.id, formData.idImage, 'id');

      const { days, hours } = duration;

      console.log('FormData dates:', {
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        returnDate: formData.returnDate,
        returnTime: formData.returnTime
      });

      // Ensure dates are valid before creating booking
      if (!formData.pickupDate || !formData.returnDate) {
        throw new Error('Dates invalides. Veuillez sélectionner les dates de ritiro et riconsegna.');
      }

      const bookingData: Omit<Booking, 'bookingId'> = {
  userId: user.id,
  itemId: item.id,
  itemName: item.name,
  vehicle_name: item.name,
  image: item.image,
  itemCategory: 'cars',
  vehicle_type: item.type || 'car',
  totalPrice: total,
  currency: currency.toUpperCase() as 'USD' | 'EUR',
  customer: {
    fullName: `${formData.firstName} ${formData.lastName}`,
    email: formData.email,
    phone: formData.phone,
    age: driverAge,
    countryOfResidency: ''
  },
  paymentMethod: formData.paymentMethod,
  bookedAt: new Date().toISOString(),
  pickupDate: formData.pickupDate,
  pickupTime: formData.pickupTime,
  returnDate: formData.returnDate,
  returnTime: formData.returnTime,
  duration: `${days} ${days === 1 ? t('day') : t('days')}, ${hours} ${hours === 1 ? t('hour') : t('hours')}`,
  driverLicenseImage: licenseImageUrl,
  driverIdImage: idImageUrl,
  extras: formData.extras,
  pickupLocation: formData.pickupLocation,
  insuranceOption: formData.insuranceOption,
};


      const { data, error } = await supabase.from('bookings').insert(bookingData).select().single();
      if (error) {
        console.error('DB insert error details:', error);
        console.error('Booking data:', bookingData);
        throw new Error(`DB insert failed: ${error.message || 'permission denied or RLS'}. Details: ${JSON.stringify(error.details || error)}`);
      }

      if (data) {
        // Non-blocking confirmation email
        fetch(`${FUNCTIONS_BASE}/.netlify/functions/send-booking-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: data }),
        }).catch(emailError => console.error('Failed to send confirmation email:', emailError));
      }

      onBookingComplete(data);
      setIsProcessing(false);

    } catch (e: any) {
      setErrors(prev => ({ ...prev, form: `Booking failed: ${e.message}` }));
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep() || !item) return;
    setIsProcessing(true);

    if (formData.paymentMethod === 'stripe' && step === 4) {
      setStripeError(null);
      if (!stripe || !cardElement || !clientSecret) {
        setStripeError("Payment system is not ready.");
        setIsProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone
          }
        }
      });

      if (error) {
        setStripeError(error.message || "An unexpected error occurred.");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'requires_capture') {
        await finalizeBooking();
      } else {
        setStripeError("Payment not completed. Status: " + paymentIntent?.status);
        setIsProcessing(false);
      }
    } else if (formData.paymentMethod === 'agency' && step === 4) {
      await finalizeBooking();
    }
  };

  const handleNext = () => validateStep() && setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const steps = [
    { id: 1, name: t('STEP 1: Date e Località') },
    { id: 2, name: t('STEP 3: Informazioni Conducente') },
    { id: 3, name: t('STEP 4: Opzioni e Assicurazioni') },
    { id: 4, name: t('STEP 5: Pagamento e Conferma') }
  ];

  const renderStepContent = () => {
    const kaskoOptions = INSURANCE_OPTIONS.map(opt => {
      const { eligible, reasonKey } = isKaskoEligibleByBuckets(opt.id as KaskoTier, driverAge, licenseYears);
      let tooltip = '';
      if (!eligible) {
        if (reasonKey?.includes('AGE')) {
          tooltip = `Età minima richiesta: ${INSURANCE_ELIGIBILITY[opt.id as KaskoTier].minAge} anni (tu hai ${driverAge} anni)`;
        } else if (reasonKey?.includes('LIC')) {
          tooltip = `Anzianità patente richiesta: ${INSURANCE_ELIGIBILITY[opt.id as KaskoTier].minLicenseYears} anni (tu hai ${licenseYears} anni)`;
        }
      }
      return { ...opt, eligible, tooltip };
    });

    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">LOCATION SELECTION</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Luogo di ritiro *</label>
                  {PICKUP_LOCATIONS.map(loc => (
                    <div key={loc.id} className="flex items-center mt-1">
                      <input type="radio" id={`pickup-${loc.id}`} name="pickupLocation" value={loc.id} checked={formData.pickupLocation === loc.id} onChange={handleChange} className="w-4 h-4 text-white bg-gray-700 border-gray-600 focus:ring-white" />
                      <label htmlFor={`pickup-${loc.id}`} className="ml-2 text-white">{getTranslated(loc.label)}</label>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-sm text-gray-400">Luogo di riconsegna *</label>
                  {PICKUP_LOCATIONS.map(loc => (
                    <div key={loc.id} className="flex items-center mt-1">
                      <input type="radio" id={`return-${loc.id}`} name="returnLocation" value={loc.id} checked={formData.returnLocation === loc.id} onChange={handleChange} className="w-4 h-4 text-white bg-gray-700 border-gray-600 focus:ring-white" />
                      <label htmlFor={`return-${loc.id}`} className="ml-2 text-white">{getTranslated(loc.label)}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">DATE AND TIME SELECTION</h3>
              <div className="space-y-4">
                {/* Pickup Date & Time */}
                <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <span className="mr-2">📅</span> Ritiro del veicolo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Data di ritiro *
                        {formData.pickupDate && (
                          <span className="ml-2 text-xs text-green-400">✓ Selezionata</span>
                        )}
                      </label>
                      <input
                        type="date"
                        name="pickupDate"
                        value={formData.pickupDate}
                        onChange={handleChange}
                        min={today}
                        required
                        className={`w-full bg-gray-800 rounded-md p-3 text-white border-2 transition-colors ${
                          errors.pickupDate
                            ? 'border-red-500 focus:border-red-400'
                            : formData.pickupDate
                            ? 'border-green-500 focus:border-green-400'
                            : 'border-gray-700 focus:border-white'
                        }`}
                      />
                      {errors.pickupDate && (
                        <p className="text-xs text-red-400 mt-1 flex items-center">
                          <span className="mr-1">⚠️</span> {errors.pickupDate}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ora di ritiro *
                        {formData.pickupTime && (
                          <span className="ml-2 text-xs text-green-400">✓ {formData.pickupTime}</span>
                        )}
                      </label>
                      <select
                        name="pickupTime"
                        value={formData.pickupTime}
                        onChange={handleChange}
                        required
                        disabled={!formData.pickupDate || getValidPickupTimes(formData.pickupDate).length === 0}
                        className={`w-full bg-gray-800 rounded-md p-3 text-white border-2 transition-colors ${
                          !formData.pickupDate || getValidPickupTimes(formData.pickupDate).length === 0
                            ? 'border-gray-700 opacity-50 cursor-not-allowed'
                            : formData.pickupTime
                            ? 'border-green-500 focus:border-green-400'
                            : 'border-gray-700 focus:border-white'
                        }`}
                      >
                        {getValidPickupTimes(formData.pickupDate).length > 0 ? (
                          getValidPickupTimes(formData.pickupDate).map(time => <option key={time} value={time}>{time}</option>)
                        ) : (
                          <option value="">Seleziona prima una data feriale</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Return Date & Time */}
                <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <span className="mr-2">📅</span> Riconsegna del veicolo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Data di riconsegna *
                        {formData.returnDate && (
                          <span className="ml-2 text-xs text-green-400">✓ Selezionata</span>
                        )}
                      </label>
                      <input
                        type="date"
                        name="returnDate"
                        value={formData.returnDate}
                        onChange={handleChange}
                        min={formData.pickupDate || today}
                        required
                        disabled={!formData.pickupDate}
                        className={`w-full bg-gray-800 rounded-md p-3 text-white border-2 transition-colors ${
                          !formData.pickupDate
                            ? 'border-gray-700 opacity-50 cursor-not-allowed'
                            : errors.returnDate || errors.date
                            ? 'border-red-500 focus:border-red-400'
                            : formData.returnDate
                            ? 'border-green-500 focus:border-green-400'
                            : 'border-gray-700 focus:border-white'
                        }`}
                      />
                      {(errors.returnDate || errors.date) && (
                        <p className="text-xs text-red-400 mt-1 flex items-center">
                          <span className="mr-1">⚠️</span> {errors.returnDate || errors.date}
                        </p>
                      )}
                      {!formData.pickupDate && (
                        <p className="text-xs text-gray-400 mt-1">Seleziona prima la data di ritiro</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ora di riconsegna
                        <span className="ml-2 text-xs text-gray-400">(calcolata automaticamente)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          name="returnTime"
                          value={formData.returnTime}
                          readOnly
                          className="w-full bg-gray-700 border-2 border-gray-600 rounded-md p-3 text-white cursor-not-allowed opacity-75"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <span className="text-gray-400">🔒</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Ritiro - 1h30 (automatico)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Km inclusi en direct */}
              <div className="mt-4 p-3 rounded-md border border-gray-700 bg-gray-800/50">
                <p className="text-sm text-gray-300">
                  Km inclusi: <span className="font-semibold text-white">{includedKm}</span>
                  {duration.days > 0 && (
                    <span className="text-gray-400"> (per {duration.days} {duration.days === 1 ? 'giorno' : 'giorni'})</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  1gg=100 • 2gg=180 • 3gg=240 • 4gg=300 • dal 5° giorno +60km/giorno
                </p>
              </div>
            </div>
          </div>
        );
      case 2:
        const renderDriverForm = (driverType: 'main' | 'second') => {
          const driverData = driverType === 'main' ? formData : formData.secondDriver;
          const prefix = driverType === 'main' ? '' : 'secondDriver.';
          return (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-400">Nome *</label><input type="text" name={`${prefix}firstName`} value={(driverData as any).firstName} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${prefix}firstName`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}firstName`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Cognome *</label><input type="text" name={`${prefix}lastName`} value={(driverData as any).lastName} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${prefix}lastName`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}lastName`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Email *</label><input type="email" name={`${prefix}email`} value={(driverData as any).email} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${prefix}email`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}email`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Telefono *</label><input type="tel" name={`${prefix}phone`} value={(driverData as any).phone} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${prefix}phone`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}phone`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Data di nascita *</label><input type="text" name={`${prefix}birthDate`} value={(driverData as any).birthDate} onChange={handleChange} placeholder="DD/MM/YYYY" className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${prefix}birthDate`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}birthDate`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Numero patente *</label><input type="text" name={`${prefix}licenseNumber`} value={(driverData as any).licenseNumber} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${prefix}licenseNumber`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}licenseNumber`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Data rilascio patente *</label><input type="date" name={`${prefix}licenseIssueDate`} value={(driverData as any).licenseIssueDate} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${prefix}licenseIssueDate`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}licenseIssueDate`]}</p>}</div>
            </div>
          );
        };

        const driverAgeLocal = driverAge;
        const licenseYearsLocal = licenseYears;

        return (
          <div className="space-y-8">
            {/* Main Driver */}
            <section>
              <h3 className="text-lg font-bold text-white mb-4">A. MAIN DRIVER</h3>
              {renderDriverForm('main')}
            </section>

            {/* Document Upload */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">📄 DOCUMENTI RICHIESTI (OBBLIGATORI)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentUploader
                  title="1. PATENTE DI GUIDA"
                  details={["Solo fronte/retro", "Foto chiara e leggibile", "Formati: JPG, PNG, PDF (max 5MB)"]}
                  onFileChange={(file) => setFormData(prev => ({...prev, licenseImage: file}))}
                />
                {errors.licenseImage && <p className="text-xs text-red-400 mt-1">{errors.licenseImage}</p>}

                <DocumentUploader
                  title="2. CARTA D'IDENTITÀ / PASSAPORTO"
                  details={["Documento valido", "Foto chiara e leggibile", "Formati: JPG, PNG, PDF (max 5MB)"]}
                  onFileChange={(file) => setFormData(prev => ({...prev, idImage: file}))}
                />
                {errors.idImage && <p className="text-xs text-red-400 mt-1">{errors.idImage}</p>}
              </div>
            </section>

            {/* Automatic Validation */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">C. AUTOMATIC VALIDATION AND CALCULATION</h3>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
                <p>✓ Età conducente: {driverAgeLocal || '--'} anni</p>
                <p>✓ Anzianità patente: {licenseYearsLocal || '--'} anni</p>
                {driverAgeLocal > 0 && driverAgeLocal < 25 && <p className="text-yellow-400">⚠️ Supplemento giovane conducente: €10/giorno</p>}
                {licenseYearsLocal >= 2 && licenseYearsLocal < 3 && <p className="text-yellow-400">⚠️ Supplemento patente recente: €20/giorno</p>}
                {licenseYearsLocal < 2 && formData.licenseIssueDate && <p className="text-red-500 font-bold">❌ ATTENZIONE: È richiesta una patente con almeno 2 anni di anzianità per noleggiare.</p>}
              </div>
            </section>

            {/* Second Driver */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">D. SECOND DRIVER (OPTIONAL)</h3>
              <div className="flex items-center">
                <input type="checkbox" name="addSecondDriver" checked={formData.addSecondDriver} onChange={handleChange} id="add-second-driver" className="h-4 w-4 text-white bg-gray-700 border-gray-600 rounded focus:ring-white"/>
                <label htmlFor="add-second-driver" className="ml-2 text-white">Aggiungi secondo guidatore (+€10/giorno)</label>
              </div>
              <AnimatePresence>
                {formData.addSecondDriver && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pl-4 border-l-2 border-gray-700">
                    {renderDriverForm('second')}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Security Deposit */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">💰 DEPOSITO CAUZIONALE RICHIESTO</h3>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-300">Al ritiro del veicolo è richiesto un deposito cauzionale a garanzia.</p>
                <div className="mt-4">
                  <p className="text-base font-semibold text-white">Sei residente in Sardegna? *</p>
                  <div className="flex items-center mt-2">
                    <input type="radio" id="resident-yes" name="isSardinianResident" checked={formData.isSardinianResident} onChange={() => setFormData(p => ({...p, isSardinianResident: true}))} className="w-4 h-4 text-white"/>
                    <label htmlFor="resident-yes" className="ml-2 text-white">Sì - Residente in Sardegna</label>
                  </div>
                  <div className="flex items-center mt-1">
                    <input type="radio" id="resident-no" name="isSardinianResident" checked={!formData.isSardinianResident} onChange={() => setFormData(p => ({...p, isSardinianResident: false}))} className="w-4 h-4 text-white"/>
                    <label htmlFor="resident-no" className="ml-2 text-white">No - Non residente</label>
                  </div>
                </div>
              </div>
            </section>

            {/* Final Checkbox */}
            <section className="border-t border-gray-700 pt-6">
              <div className="flex items-start">
                <input type="checkbox" name="confirmsInformation" checked={formData.confirmsInformation} onChange={handleChange} id="confirms-information" className="h-4 w-4 mt-1 text-white bg-gray-700 border-gray-600 rounded focus:ring-white"/>
                <label htmlFor="confirms-information" className="ml-2 text-white">Dichiaro che i dati inseriti sono veritieri e conformi ai requisiti richiesti.</label>
              </div>
              {errors.confirmsInformation && <p className="text-xs text-red-400 mt-1">{errors.confirmsInformation}</p>}
            </section>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-white mb-4">A. KASKO INSURANCE</h3>
              <div className="space-y-4">
                {kaskoOptions.map(opt => (
                  <div key={opt.id} className={`relative group p-4 rounded-md border ${formData.insuranceOption === opt.id ? 'border-white' : 'border-gray-700'} ${!opt.eligible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => opt.eligible && setFormData(p => ({...p, insuranceOption: opt.id}))}>
                    <div className="flex items-center">
                      <input type="radio" name="insuranceOption" value={opt.id} checked={formData.insuranceOption === opt.id} disabled={!opt.eligible} className="w-4 h-4 text-white"/>
                      <label className="ml-3 text-white font-semibold">{getTranslated(opt.label)}</label>
                      {opt.pricePerDay.eur > 0 && <span className="ml-auto text-white">+€{opt.pricePerDay.eur}/giorno</span>}
                    </div>
                    <div className="ml-7 text-sm text-gray-400 mt-1">
                      <p>{getTranslated(opt.description)}</p>
                      {!opt.eligible && <p className="text-red-400 text-xs mt-1">❌ Non disponibile.</p>}
                    </div>
                    {!opt.eligible && opt.tooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        {opt.tooltip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">B. ADDITIONAL SERVICES</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-gray-800/50 rounded-md border border-gray-700">
                  <input type="checkbox" checked disabled className="h-4 w-4"/>
                  <span className="ml-3 text-white">LAVAGGIO COMPLETO [OBBLIGATORIO]</span>
                  <span className="ml-auto font-semibold text-white">€30</span>
                </div>
                {formData.addSecondDriver && (
                  <div className="flex items-center p-3 bg-gray-800/50 rounded-md border border-gray-700">
                    <input type="checkbox" checked disabled className="h-4 w-4"/>
                    <span className="ml-3 text-white">MAX 2 GUIDATORI</span>
                    <span className="ml-auto font-semibold text-white">€{secondDriverFee}</span>
                  </div>
                )}
              </div>
            </section>

            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">C. AUTOMATIC SUPPLEMENTS</h3>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
                {youngDriverFee > 0 && <div className="flex justify-between"><span className="text-yellow-400">⚠️ UNDER 25 ANNI</span> <span className="text-white">€{youngDriverFee}</span></div>}
                {recentLicenseFee > 0 && <div className="flex justify-between"><span className="text-yellow-400">⚠️ UNDER 3 ANNI PATENTE</span> <span className="text-white">€{recentLicenseFee}</span></div>}
                {youngDriverFee === 0 && recentLicenseFee === 0 && <p className="text-gray-400">Nessun supplemento applicato.</p>}
              </div>
            </section>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-white mb-4">A. PAYMENT METHOD</h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-md border ${formData.paymentMethod === 'stripe' ? 'border-white' : 'border-gray-700'} cursor-pointer`} onClick={() => setFormData(p => ({...p, paymentMethod: 'stripe'}))}>
                  <div className="flex items-center">
                    <input type="radio" name="paymentMethod" value="stripe" checked={formData.paymentMethod === 'stripe'} className="w-4 h-4 text-white"/>
                    <label className="ml-3 text-white font-semibold">PAGA SUBITO ONLINE</label>
                  </div>
                  <div className="ml-7 text-sm text-gray-400 mt-1">
                    <p>• Prenotazione garantita, Conferma immediata, Pagamento sicuro</p>
                  </div>
                </div>
                <div className={`p-4 rounded-md border ${formData.paymentMethod === 'agency' ? 'border-white' : 'border-gray-700'} cursor-pointer`} onClick={() => setFormData(p => ({...p, paymentMethod: 'agency'}))}>
                  <div className="flex items-center">
                    <input type="radio" name="paymentMethod" value="agency" checked={formData.paymentMethod === 'agency'} className="w-4 h-4 text-white"/>
                    <label className="ml-3 text-white font-semibold">PAGA ALL'AGENZIA</label>
                  </div>
                  <div className="ml-7 text-sm text-gray-400 mt-1">
                    <p>• Massima flessibilità, Modifica e Annullamento gratuiti</p>
                  </div>
                </div>
              </div>
            </section>

            <AnimatePresence>
              {formData.paymentMethod === 'stripe' ? (
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-bold text-white mb-4">DATI CARTA DI CREDITO/DEBITO</h3>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-h-[56px] flex items-center">
                    {isClientSecretLoading ? <div className="text-gray-400 text-sm">Initializing Payment...</div> : <div ref={cardElementRef} className="w-full"/>}
                  </div>
                  {stripeError && <p className="text-xs text-red-400 mt-1">{stripeError}</p>}
                </motion.section>
              ) : (
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-bold text-white mb-4">PAGAMENTO ALL'AGENZIA</h3>
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p>Pagherai l'intero importo al momento del ritiro del veicolo.</p>
                    <p className="font-bold mt-2">METODI ACCETTATI: Carta di credito, debito, contanti.</p>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4 uppercase">Conferme Finali</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-start">
                    <input id="confirms-documents" name="confirmsDocuments" type="checkbox" checked={formData.confirmsDocuments} onChange={handleChange} className="h-4 w-4 mt-1 rounded border-gray-600 bg-gray-700 text-white focus:ring-white"/>
                    <label htmlFor="confirms-documents" className="ml-3 block text-sm font-medium text-white">
                      Confermo che i documenti caricati sono corretti e appartengono al conducente principale.
                    </label>
                  </div>
                  {errors.confirmsDocuments && <p className="text-xs text-red-400 mt-1 pl-7">{errors.confirmsDocuments}</p>}
                </div>
                <div>
                  <div className="flex items-start">
                    <input id="agrees-to-terms" name="agreesToTerms" type="checkbox" checked={formData.agreesToTerms} onChange={handleChange} className="h-4 w-4 mt-1 rounded border-gray-600 bg-gray-700 text-white focus:ring-white"/>
                    <label htmlFor="agrees-to-terms" className="ml-3 block text-sm font-medium text-white">
                      Ho letto e accetto i <Link to="/rental-agreement" target="_blank" className="underline hover:text-white">termini e le condizioni di noleggio</Link>.
                    </label>
                  </div>
                  {errors.agreesToTerms && <p className="text-xs text-red-400 mt-1 pl-7">{errors.agreesToTerms}</p>}
                </div>
                <div>
                  <div className="flex items-start">
                    <input id="agrees-to-privacy" name="agreesToPrivacy" type="checkbox" checked={formData.agreesToPrivacy} onChange={handleChange} className="h-4 w-4 mt-1 rounded border-gray-600 bg-gray-700 text-white focus:ring-white"/>
                    <label htmlFor="agrees-to-privacy" className="ml-3 block text-sm font-medium text-white">
                      Ho letto e accetto l'<Link to="/privacy-policy" target="_blank" className="underline hover:text-white">informativa sulla privacy</Link>.
                    </label>
                  </div>
                  {errors.agreesToPrivacy && <p className="text-xs text-red-400 mt-1 pl-7">{errors.agreesToPrivacy}</p>}
                </div>
              </div>
            </section>

            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4 uppercase">Riepilogo Completo Prenotazione</h3>
              <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700 space-y-6 text-sm">
                <div>
                  <p className="font-bold text-base text-white mb-2">VEICOLO SELEZIONATO</p>
                  <hr className="border-gray-600 mb-2"/>
                  <p>{item.name}</p>
                </div>

                <div>
                  <p className="font-bold text-base text-white mb-2">DATE E LOCALITÀ</p>
                  <hr className="border-gray-600 mb-2"/>
                  <p>Ritiro: {formData.pickupDate} alle {formData.pickupTime} - {getTranslated(PICKUP_LOCATIONS.find(l => l.id === formData.pickupLocation)?.label)}</p>
                  <p>Riconsegna: {formData.returnDate} alle {formData.returnTime} - {getTranslated(PICKUP_LOCATIONS.find(l => l.id === formData.returnLocation)?.label)}</p>
                  <p>Durata: {duration.days} giorni</p>
                  <p>Km inclusi: {includedKm} km</p>
                </div>

                <div>
                  <p className="font-bold text-base text-white mb-2">CONDUCENTE/I</p>
                  <hr className="border-gray-600 mb-2"/>
                  <p>Principale: {formData.firstName} {formData.lastName}</p>
                  <p className="text-xs text-gray-400">{formData.email} - {formData.phone}</p>
                  <p className="text-xs text-gray-400">{driverAge} anni - Patente: {licenseYears} anni</p>
                  {(formData.licenseImage || formData.idImage) && <p className="text-xs text-green-400">✓ Documenti caricati</p>}
                  {formData.addSecondDriver && (
                    <div className="mt-2">
                      <p>Secondo: {formData.secondDriver.firstName} {formData.secondDriver.lastName}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-bold text-base text-white mb-2">ASSICURAZIONE E SERVIZI</p>
                  <hr className="border-gray-600 mb-2"/>
                  <p>Assicurazione: {getTranslated(INSURANCE_OPTIONS.find(i => i.id === formData.insuranceOption)?.label)}</p>
                  <p>✓ Lavaggio completo obbligatorio</p>
                  {formData.addSecondDriver && <p>✓ Secondo guidatore</p>}
                </div>

                <div>
                  <p className="font-bold text-base text-white mb-2">DETTAGLIO COSTI</p>
                  <hr className="border-gray-600 mb-2"/>
                  <div className="flex justify-between"><span>Noleggio ({duration.days} gg × {formatPrice(item.pricePerDay[currency])})</span> <span>{formatPrice(rentalCost)}</span></div>
                  <div className="flex justify-between"><span>Assicurazione KASKO</span> <span>{formatPrice(insuranceCost)}</span></div>
                  <div className="flex justify-between"><span>Lavaggio obbligatorio</span> <span>{formatPrice(30)}</span></div>
                  {secondDriverFee > 0 && <div className="flex justify-between"><span>Secondo guidatore ({duration.days} gg × €10)</span> <span>{formatPrice(secondDriverFee)}</span></div>}
                  {youngDriverFee > 0 && <div className="flex justify-between"><span>Supplemento under 25 ({duration.days} gg × €10)</span> <span>{formatPrice(youngDriverFee)}</span></div>}
                  {recentLicenseFee > 0 && <div className="flex justify-between"><span>Supplemento patente recente ({duration.days} gg × €20)</span> <span>{formatPrice(recentLicenseFee)}</span></div>}
                  <hr className="border-gray-500 my-2"/>
                  <div className="flex justify-between font-bold text-lg"><span>TOTALE</span> <span>{formatPrice(total)}</span></div>
                </div>

                <div>
                  <p className="font-bold text-white">DEPOSITO CAUZIONALE: {formatPrice(formData.isSardinianResident ? 2500 : 5000)}</p>
                  <p className="text-xs text-gray-400">({formData.isSardinianResident ? 'Residente' : 'Non residente'} in Sardegna)</p>
                </div>

                <div>
                  <p className="font-bold text-base text-white mb-2">MODALITÀ DI PAGAMENTO</p>
                  <hr className="border-gray-600 mb-2"/>
                  <p>{formData.paymentMethod === 'stripe' ? 'Paga ora online' : 'Paga in sede'}</p>
                </div>
              </div>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800 relative text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Loading...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800 relative text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Accesso Richiesto</h2>
        <p className="text-gray-300 mb-6">Devi effettuare l'accesso o registrarti per poter completare una prenotazione.</p>
        <div className="flex justify-center space-x-4">
          <Link to="/signin" onClick={onClose} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">Accedi</Link>
          <Link to="/signup" onClick={onClose} className="px-8 py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors">Registrati</Link>
        </div>
      </div>
    );
  }

  return (
    <>
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

      <div className="w-full max-w-lg mx-auto mb-12">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'bg-white border-white text-black' : 'border-gray-600 text-gray-400'}`}>{s.id}</div>
                <p className={`mt-2 text-xs font-semibold ${step >= s.id ? 'text-white' : 'text-gray-500'}`}>{s.name}</p>
              </div>
              {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${step > s.id ? 'bg-white' : 'bg-gray-700'}`}></div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <aside className="lg:col-span-1 lg:sticky lg:top-32 self-start mb-8 lg:mb-0">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">RIEPILOGO COSTI</h2>
            <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-md mb-4"/>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Durata noleggio:</span><span className="text-white font-medium">{duration.days} giorni</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Chilometri inclusi:</span><span className="text-white font-medium">{includedKm} km</span></div>
              <p className="text-[11px] text-gray-400">1gg=100 • 2gg=180 • 3gg=240 • 4gg=300 • dal 5° giorno +60/giorno</p>

              <div className="border-t border-gray-700 my-2"></div>

              <div className="flex justify-between"><span className="text-gray-400">Noleggio {item.name}</span><span className="text-white font-medium">{formatPrice(rentalCost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Assicurazione KASKO</span><span className="text-white font-medium">{formatPrice(insuranceCost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Lavaggio obbligatorio</span><span className="text-white font-medium">{formatPrice(30)}</span></div>
              {secondDriverFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Secondo guidatore</span><span className="text-white font-medium">{formatPrice(secondDriverFee)}</span></div>}
              {youngDriverFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Supplemento under 25</span><span className="text-white font-medium">{formatPrice(youngDriverFee)}</span></div>}
              {recentLicenseFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Supplemento patente recente</span><span className="text-white font-medium">{formatPrice(recentLicenseFee)}</span></div>}

              <div className="border-t border-white/20 my-2"></div>

              <div className="flex justify-between text-xl font-bold"><span className="text-white">TOTALE</span><span className="text-white">{formatPrice(total)}</span></div>

              <div className="border-t border-gray-700 my-2"></div>

              <p className="text-sm text-gray-300">DEPOSITO CAUZIONALE: <span className="font-bold text-white">{formatPrice(formData.isSardinianResident ? 2500 : 5000)}</span></p>
              <p className="text-xs text-gray-400">({formData.isSardinianResident ? 'Residente' : 'Non residente'} in Sardegna)</p>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900/50 p-8 rounded-lg border border-gray-800 relative"
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                  aria-label="Close"
                >
                  <XIcon className="w-6 h-6" />
                </button>
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {errors.form && (
              <div className="mt-4 text-center p-3 rounded-md border border-red-500 bg-red-500/10 text-red-400">
                <p>{errors.form}</p>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button type="button" onClick={handleBack} disabled={step === 1} className="px-8 py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('Back')}</button>
              {step < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                  disabled={(licenseYears < 2 && step === 2) || (step === 2 && !formData.confirmsInformation)}
                >
                  Continua
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isProcessing || !formData.agreesToTerms || !formData.agreesToPrivacy || !formData.confirmsDocuments}
                  className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : '✓ CONFERMA PRENOTAZIONE'}
                </button>
              )}
            </div>
          </form>
        </main>
      </div>
    </>
  );
};

export default CarBookingWizard;
