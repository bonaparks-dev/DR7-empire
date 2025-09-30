import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import { RENTAL_CATEGORIES, PICKUP_LOCATIONS, INSURANCE_OPTIONS, RENTAL_EXTRAS, COUNTRIES, INSURANCE_ELIGIBILITY, VALIDATION_MESSAGES, YACHT_PICKUP_MARINAS, AIRPORTS, HELI_DEPARTURE_POINTS, HELI_ARRIVAL_POINTS, CRYPTO_ADDRESSES, AGE_BUCKETS, LICENSE_OBTENTION_YEAR_OPTIONS } from '../../constants';
import type { Booking, Inquiry, RentalItem } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { CameraIcon, CreditCardIcon, XIcon } from '../icons/Icons';
import DocumentUploader from './DocumentUploader';

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

interface CarBookingWizardProps {
  item: RentalItem;
  onBookingComplete: (booking: Booking) => void;
  onClose: () => void;
}

const CarBookingWizard: React.FC<CarBookingWizardProps> = ({ item, onBookingComplete, onClose }) => {
  const navigate = useNavigate();
  const { t, lang, getTranslated } = useTranslation();
  const { currency } = useCurrency();
  const { user, loading: authLoading, isSessionActive } = useAuth();
  const WIZARD_STORAGE_KEY = `carBookingWizard-${item.id}`;

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState(() => {
    const savedData = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    const initialData = {
      pickupLocation: PICKUP_LOCATIONS[0].id,
      returnLocation: PICKUP_LOCATIONS[0].id,
      pickupDate: today,
      pickupTime: '10:30',
      returnDate: '',
      returnTime: '09:00',
      firstName: '',
      lastName: '',
      email: user?.email || '',
      phone: '',
      birthDate: '',
      licenseNumber: '',
      licenseIssueDate: '',
      licenseImage: null as File | null,
      idImage: null as File | null,
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
          licenseImage: null as File | null,
          idImage: null as File | null,
      },
      insuranceOption: 'KASKO_BASE',
      extras: [] as string[],
      paymentMethod: 'stripe',
      agreesToTerms: false,
      agreesToPrivacy: false,
      confirmsDocuments: false,
    };

    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            return {
                ...initialData,
                ...parsed,
                licenseImage: null,
                idImage: null,
                secondDriver: {
                    ...initialData.secondDriver,
                    ...(parsed.secondDriver || {}),
                    licenseImage: null,
                    idImage: null,
                },
            };
        } catch (e) {
            console.error("Could not restore booking form data:", e);
        }
    }
    return initialData;
  });

  useEffect(() => {
    const dataToSave = {
      ...formData,
      licenseImage: null,
      idImage: null,
      secondDriver: {
        ...formData.secondDriver,
        licenseImage: null,
        idImage: null,
      },
    };
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(dataToSave));
  }, [formData, WIZARD_STORAGE_KEY]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkSession();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

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
  const [isSessionExpiredModalOpen, setIsSessionExpiredModalOpen] = useState(false);

  const handleSessionExpired = () => {
    setIsSessionExpiredModalOpen(true);
  };

  const checkSession = async (): Promise<boolean> => {
    const active = await isSessionActive();
    if (!active) {
      handleSessionExpired();
      return false;
    }
    return true;
  };

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

      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
          addTimes(10 * 60 + 30, 12 * 60 + 30, 30);
          addTimes(17 * 60 + 30, 18 * 60 + 30, 30);
      } else if (dayOfWeek === 6) { // Saturday
          addTimes(10 * 60 + 30, 13 * 60 + 30, 30);
      }
      return times;
  };

  const calculateIncludedKm = (days: number) => {
      if (days <= 0) return 0;
      if (days === 1) return 100;
      if (days === 2) return 180;
      if (days === 3) return 240;
      if (days === 4) return 300;
      return 300 + ((days - 4) * 60);
  };

  useEffect(() => {
    if ((window as any).Stripe) {
        if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('YOUR_')) {
            console.error("Stripe.js has loaded, but the publishable key is not set.");
            setStripeError("Payment service is not configured correctly.");
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

  useEffect(() => {
    if (formData.pickupTime) {
      const [hours, minutes] = formData.pickupTime.split(':').map(Number);
      const tempDate = new Date(2000, 0, 1, hours, minutes); // Use a fixed date to avoid DST issues
      tempDate.setHours(tempDate.getHours() - 1);
      tempDate.setMinutes(tempDate.getMinutes() - 30);

      const returnHours = String(tempDate.getHours()).padStart(2, '0');
      const returnMinutes = String(tempDate.getMinutes()).padStart(2, '0');

      const newReturnTime = `${returnHours}:${returnMinutes}`;
      setFormData(prev => ({ ...prev, returnTime: newReturnTime }));
    }
  }, [formData.pickupTime]);

  const parseDateString = (dateString: string): Date | null => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return null;
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date;
    }
    return null;
  };

  const {
    duration, rentalCost, insuranceCost, extrasCost, subtotal, taxes, total, includedKm,
    driverAge, licenseYears, youngDriverFee, recentLicenseFee, secondDriverFee
  } = useMemo(() => {
    const zeroState = { duration: { days: 0, hours: 0 }, rentalCost: 0, insuranceCost: 0, extrasCost: 0, subtotal: 0, taxes: 0, total: 0, includedKm: 0, driverAge: 0, licenseYears: 0, youngDriverFee: 0, recentLicenseFee: 0, secondDriverFee: 0 };
    if (!item || !item.pricePerDay) return zeroState;

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

    const birthDateObj = parseDateString(formData.birthDate);
    const licenseDateObj = parseDateString(formData.licenseIssueDate);

    const calculatedDriverAge = birthDateObj ? new Date().getFullYear() - birthDateObj.getFullYear() : 0;
    const calculatedLicenseYears = licenseDateObj ? new Date().getFullYear() - licenseDateObj.getFullYear() : 0;

    const calculatedYoungDriverFee = calculatedDriverAge > 0 && calculatedDriverAge < 25 ? 10 * billingDays : 0;
    const calculatedRecentLicenseFee = calculatedLicenseYears >= 2 && calculatedLicenseYears < 3 ? 20 * billingDays : 0;
    const calculatedSecondDriverFee = formData.addSecondDriver ? 10 * billingDays : 0;

    const calculatedSubtotal = calculatedRentalCost + calculatedInsuranceCost + calculatedExtrasCost + calculatedYoungDriverFee + calculatedRecentLicenseFee + calculatedSecondDriverFee;
    const calculatedTaxes = calculatedSubtotal * 0.10; // Assuming 10% tax, adjust if needed
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
  }, [formData, item, currency]);

  useEffect(() => {
    const validTimes = getValidPickupTimes(formData.pickupDate);
    if (validTimes.length > 0 && !validTimes.includes(formData.pickupTime)) {
      setFormData(prev => ({ ...prev, pickupTime: validTimes[0] }));
    } else if (validTimes.length === 0 && formData.pickupTime) {
      setFormData(prev => ({ ...prev, pickupTime: '' }));
    }
  }, [formData.pickupDate]);

  useEffect(() => {
    if (step === 4 && total > 0) {
        setIsClientSecretLoading(true); setClientSecret(null); setStripeError(null);
        fetch('/.netlify/functions/create-payment-intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: total, currency }) })
        .then(res => res.json()).then(data => { if (data.error) { setStripeError(data.error); } else { setClientSecret(data.clientSecret); } })
        .catch(error => { console.error('Failed to fetch client secret:', error); setStripeError('Could not connect to payment server.'); })
        .finally(() => { setIsClientSecretLoading(false); });
    }
  }, [step, total, currency]);

  useEffect(() => {
    let card: any = null;
    if (stripe && step === 4 && formData.paymentMethod === 'stripe' && cardElementRef.current && clientSecret) {
        const elements = stripe.elements();
        card = elements.create('card', { style: { base: { color: '#ffffff', fontFamily: '"Exo 2", sans-serif', fontSmoothing: 'antialiased', fontSize: '16px', '::placeholder': { color: '#a0aec0' } }, invalid: { color: '#ef4444', iconColor: '#ef4444' } }, hidePostalCode: true });
        setCardElement(card); card.mount(cardElementRef.current);
        card.on('change', (event: any) => { setStripeError(event.error ? event.error.message : null); });
    }
    return () => { if (card) { card.destroy(); setCardElement(null); } };
  }, [stripe, step, formData.paymentMethod, clientSecret]);

  useEffect(() => {
    if (!user) {
      setIsFirstCarBooking(false);
      return;
    }
    const checkFirstBooking = async () => {
      const { data, error } = await supabase.from('bookings').select('bookingId').eq('userId', user.id).eq('itemCategory', 'cars').limit(1);
      if (error) {
        console.error('Error checking for previous bookings:', error);
        setIsFirstCarBooking(true);
        return;
      }
      setIsFirstCarBooking(data.length === 0);
    };
    checkFirstBooking();
  }, [user]);

  useEffect(() => {
    if (licenseYears === undefined) {
      setFormData(prev => ({ ...prev, insuranceOption: 'KASKO_BASE' }));
      setInsuranceError('');
      return;
    }

    let bestOption: KaskoTier = 'KASKO_BASE';
    let eligibilityErrorKey: string | undefined;

    const signatureCheck = isKaskoEligibleByBuckets('KASKO_SIGNATURE', driverAge, licenseYears);
    if (signatureCheck.eligible) {
      bestOption = 'KASKO_SIGNATURE';
    } else {
      const blackCheck = isKaskoEligibleByBuckets('KASKO_BLACK', driverAge, licenseYears);
      if (blackCheck.eligible) {
        bestOption = 'KASKO_BLACK';
        eligibilityErrorKey = signatureCheck.reasonKey;
      } else {
        const baseCheck = isKaskoEligibleByBuckets('KASKO_BASE', driverAge, licenseYears);
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

  }, [driverAge, licenseYears, t]);

  const formatPrice = (price: number) => new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(price);

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

    const [mainField, secondDriverField] = name.split('.');

    if (secondDriverField) {
        setFormData(prev => ({
            ...prev,
            secondDriver: {
                ...prev.secondDriver,
                [secondDriverField]: isFile ? (e.target as HTMLInputElement).files?.[0] || null : value,
            }
        }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (isFile ? (e.target as HTMLInputElement).files?.[0] || null : value)
        }));
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
    const newErrors: Record<string, string> = {};
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    const validateDate = (date: string, fieldName: string) => {
      if (!date) {
        newErrors[fieldName] = "La data è obbligatoria.";
        return;
      }
      if (!dateRegex.test(date)) {
        newErrors[fieldName] = "Il formato deve essere DD/MM/YYYY con un anno di 4 cifre.";
        return;
      }
      const [day, month, year] = date.split('/').map(Number);
      const d = new Date(year, month - 1, day);
      if (!(d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day)) {
        newErrors[fieldName] = "La data inserita non è valida.";
      }
    };

    if (step === 1) {
      if (!formData.pickupDate || !formData.returnDate) newErrors.date = "Seleziona le date.";
      if (new Date(formData.pickupDate) >= new Date(formData.returnDate)) newErrors.date = "La data di riconsegna deve essere successiva a quella di ritiro.";
      if (new Date(formData.pickupDate).getDay() === 0) newErrors.pickupDate = "Le prenotazioni non sono disponibili la domenica.";
    }
    if (step === 2) {
      if (!formData.firstName) newErrors.firstName = "Il nome è obbligatorio.";
      if (!formData.lastName) newErrors.lastName = "Il cognome è obbligatorio.";
      if (!formData.email) newErrors.email = "L'email è obbligatoria.";
      if (!formData.phone) newErrors.phone = "Il telefono è obbligatorio.";

      validateDate(formData.birthDate, 'birthDate');
      validateDate(formData.licenseIssueDate, 'licenseIssueDate');

      if (!formData.licenseNumber) newErrors.licenseNumber = "Il numero di patente è obbligatorio.";
      if (!formData.licenseImage) newErrors.licenseImage = "La foto della patente è obbligatoria.";
      if (!formData.idImage) newErrors.idImage = "La foto del documento d'identità è obbligatoria.";
      if (!formData.confirmsInformation) newErrors.confirmsInformation = "Devi confermare che le informazioni sono corrette.";
      if(licenseYears < 2) newErrors.licenseIssueDate = "È richiesta una patente con almeno 2 anni di anzianità.";

      if (formData.addSecondDriver) {
          if (!formData.secondDriver.firstName) newErrors['secondDriver.firstName'] = "Il nome del secondo guidatore è obbligatorio.";
          if (!formData.secondDriver.lastName) newErrors['secondDriver.lastName'] = "Il cognome del secondo guidatore è obbligatorio.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!(await checkSession())) return;
    if (validateStep()) {
      setStep(s => s + 1);
    }
  };
  const handleBack = () => setStep(s => s - 1);

  const finalizeBooking = async () => {
    if (!(await checkSession())) return;
    if (!user) {
        setErrors(prev => ({...prev, form: "You must be logged in to book."}));
        return;
    }
    let licenseImageUrl = '';
    if (formData.licenseImage) {
        try {
            const file = formData.licenseImage;
            const fileExtension = file.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExtension}`;
            const filePath = `public/${fileName}`;

            const { data, error } = await supabase.storage
                .from('driver-licenses')
                .upload(filePath, file, { contentType: file.type });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage.from('driver-licenses').getPublicUrl(filePath);
            if (!publicUrlData) throw new Error("Could not get public URL for the uploaded image.");

            licenseImageUrl = publicUrlData.publicUrl;
        } catch (error) {
            console.error('Error uploading license image:', error);
            setErrors(prev => ({...prev, licenseImage: "Failed to upload license image. Please try again."}));
            setIsProcessing(false);
            return;
        }
    }

    const bookingData: Omit<Booking, 'bookingId'> = {
        userId: user.id,
        itemId: item.id,
        itemName: item.name,
        image: item.image,
        itemCategory: 'cars',
        totalPrice: total,
        currency: currency.toUpperCase() as 'USD' | 'EUR',
        customer: { fullName: `${formData.firstName} ${formData.lastName}`, email: formData.email, phone: formData.phone, age: driverAge, countryOfResidency: '' },
        paymentMethod: formData.paymentMethod,
        bookedAt: new Date().toISOString(),
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        returnDate: formData.returnDate,
        returnTime: formData.returnTime,
        duration: `${duration.days} ${duration.days === 1 ? t('day') : t('days')}, ${duration.hours} ${duration.hours === 1 ? t('hour') : t('hours')}`,
        driverLicenseImage: licenseImageUrl,
        extras: formData.extras,
        pickupLocation: formData.pickupLocation,
        insuranceOption: formData.insuranceOption,
    };

    const { data, error } = await supabase.from('bookings').insert(bookingData).select().single();
    if (error) {
        console.error('Error creating booking:', error);
        setErrors(prev => ({...prev, form: "Could not save your booking. Please try again."}));
        setIsProcessing(false);
        return;
    }
    onBookingComplete(data);
    setIsProcessing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await checkSession())) return;
    if (!validateStep() || !item) {
      return;
    }
    setIsProcessing(true);
    if (formData.paymentMethod === 'stripe' && step === 4) {
      setStripeError(null);
      if (!stripe || !cardElement || !clientSecret) {
        setStripeError("Payment system is not ready.");
        setIsProcessing(false);
        return;
      }
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
          },
        },
      });
      if (error) {
        setStripeError(error.message || "An unexpected error occurred.");
        setIsProcessing(false);
      } else {
        await finalizeBooking();
      }
    } else {
      await finalizeBooking();
    }
  };

  const steps = [
    { id: 1, name: t('STEP 1: Date e Località') },
    { id: 2, name: t('STEP 3: Informazioni Conducente') },
    { id: 3, name: t('STEP 4: Opzioni e Assicurazioni') },
    { id: 4, name: t('STEP 5: Pagamento e Conferma') }
  ];

  const renderStepContent = () => {
    const assignedInsurance = INSURANCE_OPTIONS.find(opt => opt.id === formData.insuranceOption);
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
                        <h3 className="text-lg font-semibold text-white mb-2">DATE AND TIME SELECTION</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-400">Data di ritiro *</label>
                                <input type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} min={today} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Ora di ritiro *</label>
                                <select name="pickupTime" value={formData.pickupTime} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2.5 mt-1 text-white">
                                    {getValidPickupTimes(formData.pickupDate).length > 0 ? (
                                        getValidPickupTimes(formData.pickupDate).map(time => <option key={time} value={time}>{time}</option>)
                                    ) : (
                                        <option value="" disabled>Seleziona un giorno feriale</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Data di riconsegna *</label>
                                <input type="date" name="returnDate" value={formData.returnDate} onChange={handleChange} min={formData.pickupDate || today} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Ora di riconsegna *</label>
                                <input type="time" name="returnTime" value={formData.returnTime} readOnly className="w-full bg-gray-700 border-gray-700 rounded-md p-2 mt-1 text-white cursor-not-allowed"/>
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 2:
            const renderDriverForm = (driverType: 'main' | 'second') => {
                const driverData = driverType === 'main' ? formData : formData.secondDriver;
                const namePrefix = driverType === 'main' ? '' : 'secondDriver.';
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-gray-400">Nome *</label><input type="text" name={`${namePrefix}firstName`} value={driverData.firstName} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${namePrefix}firstName`] && <p className="text-xs text-red-400 mt-1">{errors[`${namePrefix}firstName`]}</p>}</div>
                        <div><label className="text-sm text-gray-400">Cognome *</label><input type="text" name={`${namePrefix}lastName`} value={driverData.lastName} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${namePrefix}lastName`] && <p className="text-xs text-red-400 mt-1">{errors[`${namePrefix}lastName`]}</p>}</div>
                        <div><label className="text-sm text-gray-400">Email *</label><input type="email" name={`${namePrefix}email`} value={driverData.email} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${namePrefix}email`] && <p className="text-xs text-red-400 mt-1">{errors[`${namePrefix}email`]}</p>}</div>
                        <div><label className="text-sm text-gray-400">Telefono *</label><input type="tel" name={`${namePrefix}phone`} value={driverData.phone} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${namePrefix}phone`] && <p className="text-xs text-red-400 mt-1">{errors[`${namePrefix}phone`]}</p>}</div>
                        <div><label className="text-sm text-gray-400">Data di nascita *</label><input type="text" name={`${namePrefix}birthDate`} value={driverData.birthDate} onChange={handleChange} placeholder="DD/MM/YYYY" maxLength={10} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${namePrefix}birthDate`] && <p className="text-xs text-red-400 mt-1">{errors[`${namePrefix}birthDate`]}</p>}</div>
                        <div><label className="text-sm text-gray-400">Numero patente *</label><input type="text" name={`${namePrefix}licenseNumber`} value={driverData.licenseNumber} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${namePrefix}licenseNumber`] && <p className="text-xs text-red-400 mt-1">{errors[`${namePrefix}licenseNumber`]}</p>}</div>
                        <div><label className="text-sm text-gray-400">Data rilascio patente *</label><input type="text" name={`${namePrefix}licenseIssueDate`} value={driverData.licenseIssueDate} onChange={handleChange} placeholder="DD/MM/YYYY" maxLength={10} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>{errors[`${namePrefix}licenseIssueDate`] && <p className="text-xs text-red-400 mt-1">{errors[`${namePrefix}licenseIssueDate`]}</p>}</div>
                    </div>
                );
            };

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
                            <p>✓ Età conducente: {driverAge || '--'} anni</p>
                            <p>✓ Anzianità patente: {licenseYears || '--'} anni</p>
                            {driverAge > 0 && driverAge < 25 && <p className="text-yellow-400">⚠️ Supplemento giovane conducente: €10/giorno</p>}
                            {licenseYears >= 2 && licenseYears < 3 && <p className="text-yellow-400">⚠️ Supplemento patente recente: €20/giorno</p>}
                            {licenseYears < 2 && formData.licenseIssueDate && <p className="text-red-500 font-bold">❌ ATTENZIONE: È richiesta una patente con almeno 2 anni di anzianità per noleggiare.</p>}
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
                           <p className="text-sm text-gray-300">Al ritiro del veicolo è richiesto un deposito cauzionale a garanzia. L'importo varia in base alla residenza.</p>
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
                                {formData.licenseImage && <p className="text-xs text-green-400">✓ Documenti caricati</p>}
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

                    <section className="border-t border-gray-700 pt-6">
                        <h3 className="text-lg font-bold text-white mb-4">E. FINAL MANDATORY CHECKBOXES</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start"><input type="checkbox" name="agreesToTerms" checked={formData.agreesToTerms} onChange={handleChange} id="agrees-terms" className="h-4 w-4 mt-1"/>
                                <label htmlFor="agrees-terms" className="ml-2 text-white">Ho letto e accetto i <a href="/terms" target="_blank" className="underline">Termini e Condizioni</a> del noleggio.</label>
                            </div>
                            <div className="flex items-start"><input type="checkbox" name="agreesToPrivacy" checked={formData.agreesToPrivacy} onChange={handleChange} id="agrees-privacy" className="h-4 w-4 mt-1"/>
                                <label htmlFor="agrees-privacy" className="ml-2 text-white">Ho letto e accetto la <a href="/privacy" target="_blank" className="underline">Politica sulla Privacy</a>.</label>
                            </div>
                            <div className="flex items-start"><input type="checkbox" name="confirmsInformation" checked={formData.confirmsInformation} onChange={handleChange} id="confirms-info" className="h-4 w-4 mt-1"/>
                                <label htmlFor="confirms-info" className="ml-2 text-white">Confermo che tutte le informazioni fornite sono corrette.</label>
                            </div>
                            <div className="flex items-start"><input type="checkbox" name="confirmsDocuments" checked={formData.confirmsDocuments} onChange={handleChange} id="confirms-docs" className="h-4 w-4 mt-1"/>
                                <label htmlFor="confirms-docs" className="ml-2 text-white">Sono consapevole che i documenti caricati devono essere autentici.</label>
                            </div>
                        </div>
                    </section>
                </div>
            );
        default: return null;
    }
  };

  if (authLoading) {
    return (
        <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800 relative text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Loading...</h2>
        </div>
    )
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
    )
  }

  return (
    <>
      <AnimatePresence>
        {isSessionExpiredModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          >
            <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800 relative text-center max-w-sm">
              <h2 className="text-2xl font-bold text-white mb-4">Session Expired</h2>
              <p className="text-gray-300 mb-6">Your session has expired, but don't worry, your progress has been saved. Please log in again to continue with your booking.</p>
              <button
                type="button"
                onClick={() => {
                  setIsSessionExpiredModalOpen(false);
                  onClose();
                  navigate('/signin');
                }}
                className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
        <div className="flex items-center justify-between">{steps.map((s, index) => (<React.Fragment key={s.id}><div className="flex flex-col items-center text-center"><div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'bg-white border-white text-black' : 'border-gray-600 text-gray-400'}`}>{s.id}</div><p className={`mt-2 text-xs font-semibold ${step >= s.id ? 'text-white' : 'text-gray-500'}`}>{s.name}</p></div>{index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${step > s.id ? 'bg-white' : 'bg-gray-700'}`}></div>}</React.Fragment>))}</div>
      </div>
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <aside className="lg:col-span-1 lg:sticky lg:top-32 self-start mb-8 lg:mb-0">
            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-4">RIEPILOGO COSTI</h2>
                <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-md mb-4"/>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Durata noleggio:</span><span className="text-white font-medium">{duration.days} giorni</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Chilometri inclusi:</span><span className="text-white font-medium">{includedKm} km</span></div>

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

                    <p className="text-sm text-gray-300">DEPOSITO CAUZIONALE: <span className="font-bold text-white">€{formData.isSardinianResident ? '2.500' : '5.000'}</span></p>
                    <p className="text-xs text-gray-400">(da versare al ritiro)</p>
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
            <div className="flex justify-between mt-8">
                <button type="button" onClick={handleBack} disabled={step === 1} className="px-8 py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('Back')}</button>
                {step < steps.length ?
                    <button type="button" onClick={handleNext} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors" disabled={(licenseYears < 2 && step === 2) || (step === 2 && !formData.confirmsInformation)}>Continua</button> :
                    <button type="submit" disabled={isProcessing || !formData.agreesToTerms || !formData.agreesToPrivacy || !formData.confirmsInformation || !formData.confirmsDocuments || (licenseYears < 2)} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isProcessing ? 'Processing...' : '✓ CONFERMA PRENOTAZIONE'}
                    </button>}
            </div>
          </form>
        </main>
      </div>
    </>
  );
};

export default CarBookingWizard;