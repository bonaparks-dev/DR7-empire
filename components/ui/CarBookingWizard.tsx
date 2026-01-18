import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../contexts/CurrencyContext';
import { isMassimoRunchina, SPECIAL_CLIENTS } from '../../utils/clientPricingRules';
import { calculateMultiDayPrice } from '../../utils/multiDayPricing';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import { PICKUP_LOCATIONS, AUTO_INSURANCE, INSURANCE_DEDUCTIBLES, RENTAL_EXTRAS, DEPOSIT_RULES } from '../../constants';
import type { Booking, RentalItem } from '../../types';
import { Link } from 'react-router-dom';
import DocumentUploader from './DocumentUploader';
import CalendarPicker from './CalendarPicker';
import {
  getUnlimitedKmOptions,
  calculateUnlimitedKmPrice,
  recommendKmPackage,
  isPremiumVehicle,
  isDucatoVehicle
} from '../../data/kmPricingData';
import { checkVehicleAvailability, checkVehiclePartialUnavailability, checkGroupedVehicleAvailability, safeDate } from '../../utils/bookingValidation';
import { getUserCreditBalance, deductCredits, hasSufficientBalance } from '../../utils/creditWallet';
import { calculateDiscountedPrice, getMembershipTierName } from '../../utils/membershipDiscounts';
import { roundToTwoDecimals, eurosToCents, roundToWholeEuros } from '../../utils/pricing';

const FUNCTIONS_BASE =
  import.meta.env.VITE_FUNCTIONS_BASE ??
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:8888'
    : window.location.origin);

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

type KaskoTier = 'RCA' | 'KASKO_BASE' | 'KASKO_BLACK' | 'KASKO_SIGNATURE' | 'KASKO_DR7';

// Helper function to determine vehicle type
// Helper function to determine vehicle type
function getVehicleType(item: RentalItem, categoryContext?: string): 'UTILITARIA' | 'FURGONE' | 'V_CLASS' | 'SUPERCAR' {
  if (!item || !item.name) return 'SUPERCAR';

  // Robust Context-Based Classification
  if (categoryContext === 'urban-cars') return 'UTILITARIA';
  if (categoryContext === 'corporate-fleet') {
    const name = item.name.toLowerCase();
    if (name.includes('ducato') || name.includes('furgone')) return 'FURGONE';
    if (name.includes('vito') || name.includes('v class') || name.includes('v-class') || name.includes('classe v')) return 'V_CLASS';
    return 'UTILITARIA'; // Fallback for corporate fleet
  }

  const name = item.name.toLowerCase();
  const id = item.id ? item.id.toLowerCase() : '';

  if (id.startsWith('urban-car-') || name.includes('polo') || name.includes('utilitaria') || name.includes('clio') || name.includes('captur') || name.includes('panda') || name.includes('500') || name.includes('smart') || name.includes('twingo') || name.includes('ypsilon')) return 'UTILITARIA';
  if (name.includes('ducato') || name.includes('furgone')) return 'FURGONE';
  if (name.includes('vito') || name.includes('v class') || name.includes('v-class') || name.includes('classe v')) return 'V_CLASS';
  return 'SUPERCAR'; // Default to supercar for luxury cars
}

const calculateAgeFromDDMMYYYY = (dateString: string): number => {
  if (!dateString) return 0;

  // Support both YYYY-MM-DD (date input) and DD/MM/YYYY (legacy)
  let birthDate: Date;
  if (dateString.includes('/')) {
    // DD/MM/YYYY format
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) return 0;
    const [d, m, y] = dateString.split('/');
    const day = parseInt(d, 10);
    const month = parseInt(m, 10) - 1;
    const year = parseInt(y, 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;
    birthDate = new Date(year, month, day);
    if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month || birthDate.getDate() !== day) return 0;
  } else {
    // YYYY-MM-DD format (from date input)
    birthDate = safeDate(dateString);
    if (isNaN(birthDate.getTime())) return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const diffM = today.getMonth() - birthDate.getMonth();
  if (diffM < 0 || (diffM === 0 && today.getDate() < birthDate.getDate())) age--;
  return age < 0 ? 0 : age;
};

const calculateYearsSince = (dateString: string): number => {
  if (!dateString) return 0;
  const sinceDate = safeDate(dateString);
  if (isNaN(sinceDate.getTime())) return 0;

  const today = new Date();
  let years = today.getFullYear() - sinceDate.getFullYear();
  const diffM = today.getMonth() - sinceDate.getMonth();
  if (diffM < 0 || (diffM === 0 && today.getDate() < sinceDate.getDate())) years--;
  return years < 0 ? 0 : years;
};

// === Km inclusi per durata ===
// 1gg=100, 2gg=180, 3gg=240, 4gg=280, 5gg=300, dal 5° giorno in poi +60/giorno
const calculateIncludedKm = (days: number) => {
  if (days <= 0) return 0;
  if (days === 1) return 100;
  if (days === 2) return 180;
  if (days === 3) return 240;
  if (days === 4) return 280;
  if (days === 5) return 300;
  return 300 + ((days - 5) * 60);
};

interface CarBookingWizardProps {
  item: RentalItem;
  categoryContext?: string;
  onBookingComplete: (booking: Booking) => void;
  onClose: () => void;
}

const CarBookingWizard: React.FC<CarBookingWizardProps> = ({ item, categoryContext, onBookingComplete, onClose }) => {
  const { t, getTranslated } = useTranslation();
  const { currency } = useCurrency();
  const { user, loading: authLoading } = useAuth();

  // Determine vehicle type
  const vehicleType = useMemo(() => getVehicleType(item, categoryContext), [item, categoryContext]);
  const isUrbanOrCorporate = vehicleType === 'URBAN' || vehicleType === 'FURGONE' || vehicleType === 'V_CLASS';


  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [formData, setFormData] = useState({
    // Step 1
    pickupLocation: PICKUP_LOCATIONS[0].id,
    returnLocation: PICKUP_LOCATIONS[0].id,
    pickupDate: today,
    pickupTime: '10:30',
    returnDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    returnTime: '09:00',

    // Step 2
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    licenseNumber: '',
    licenseIssueDate: '',
    licenseImage: null, // File or dataURL
    idImage: null,
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
    insuranceOption: 'RCA',
    extras: [] as string[],
    kmPackageType: 'none' as 'none' | 'unlimited', // 'none' = only free included km
    kmPackageDistance: 100, // default 100km package
    expectedKm: 0, // user's expected distance for recommendation
    usageZone: '' as 'CAGLIARI_SUD' | 'FUORI_ZONA' | '', // Usage zone for residency-based pricing

    // Step 4
    paymentMethod: 'stripe' as 'stripe' | 'credit',
    agreesToTerms: false,
    agreesToPrivacy: false,
    confirmsDocuments: false,
  });



  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedInsurance, setExpandedInsurance] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [partialUnavailabilityWarning, setPartialUnavailabilityWarning] = useState<string | null>(null);
  const [availableVehicleName, setAvailableVehicleName] = useState<string | null>(null);
  const [usageZoneError, setUsageZoneError] = useState<string | null>(null); // Error for resident blocking
  const [showZoneConfirmation, setShowZoneConfirmation] = useState(false); // Zone confirmation modal

  // Credit wallet state
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Customer loyalty state (for deposit calculation)
  const [customerRentalCount, setCustomerRentalCount] = useState<number>(0);
  const [isLoyalCustomer, setIsLoyalCustomer] = useState<boolean>(false);


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

  // Handle browser back button to go to previous wizard step instead of leaving page
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (step > 1) {
        setStep(step - 1);
        window.history.pushState(null, '', window.location.href);
      } else {
        onClose();
      }
    };

    // Push initial state to enable back button handling
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [step, onClose]);

  // Auto-set unlimited KM for urban/utility vehicles
  useEffect(() => {
    const vType = getVehicleType(item, categoryContext);
    if (vType === 'UTILITARIA' || vType === 'FURGONE' || vType === 'V_CLASS') {
      setFormData(prev => ({
        ...prev,
        kmPackageType: 'unlimited'
      }));
    }
  }, [item.name, categoryContext]);

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

  // Fetch credit balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.id) {
        setIsLoadingBalance(true);
        try {
          const balance = await getUserCreditBalance(user.id);
          setCreditBalance(balance);
        } catch (error) {
          console.error('Error fetching credit balance:', error);
        } finally {
          setIsLoadingBalance(false);
        }
      }
    };

    fetchBalance();
  }, [user]);

  // Fetch customer rental count for loyalty determination
  useEffect(() => {
    const fetchRentalCount = async () => {
      const email = user?.email || formData.email;
      if (!email) {
        setCustomerRentalCount(0);
        setIsLoyalCustomer(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('booking_details->>email', email)
          .eq('status', 'completed');

        if (!error && count !== null) {
          setCustomerRentalCount(count);
          setIsLoyalCustomer(count >= DEPOSIT_RULES.LOYAL_CUSTOMER_THRESHOLD);
        }
      } catch (error) {
        console.error('Error fetching rental count:', error);
        setCustomerRentalCount(0);
        setIsLoyalCustomer(false);
      }
    };

    fetchRentalCount();
  }, [user?.email, formData.email]);

  // Usage zone validation for residents
  useEffect(() => {
    const userResidencyZone = (user as any)?.residencyZone || 'NON_RESIDENTE';
    const isResident = userResidencyZone === 'RESIDENTE_CAGLIARI_SUD_SARDEGNA';

    if (isResident && formData.usageZone === 'FUORI_ZONA') {
      setUsageZoneError(
        "Con tariffa residente il veicolo è autorizzato solo a Cagliari e Sud Sardegna. Fuori zona il veicolo verrà bloccato automaticamente: prenotazione non consentita."
      );
    } else {
      setUsageZoneError(null);
    }
  }, [formData.usageZone, user]);


  // Helper function to get day of week without timezone issues
  const getDayOfWeek = (dateString: string): number => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDay();
  };

  // === Horaires de retrait admissibles (pas de dimanche) ===

  // === HOLIDAY LOGIC ===
  const ITALIAN_HOLIDAYS = [
    '01-01', '06-01', '25-04', '01-05', '02-06', '15-08', '01-11', '08-12', '25-12', '26-12', // Fixed
    '2024-03-31', '2024-04-01', // Easter 2024
    '2025-04-20', '2025-04-21', // Easter 2025
    '2026-04-05', '2026-04-06', // Easter 2026
    '2026-01-02', '2026-01-03', // Office Closed for New Year 2026
  ];

  const isHoliday = (dateString: string): boolean => {
    if (!dateString) return false;
    const [year, month, day] = dateString.split('-');
    const formattedDate = `${day}-${month}`;
    const fullDate = dateString; // YYYY-MM-DD
    return ITALIAN_HOLIDAYS.includes(formattedDate) || ITALIAN_HOLIDAYS.includes(fullDate);
  };

  const getValidPickupTimes = (date: string): string[] => {
    const dayOfWeek = getDayOfWeek(date);
    if (dayOfWeek === 0 || isHoliday(date)) return []; // Block Sundays & Holidays

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

    // Filter out past times if the selected date is today
    const selectedDate = safeDate(date);
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      // Add 2 hours buffer (120 minutes) to allow preparation time
      const minTimeInMinutes = currentTimeInMinutes + 120;

      return times.filter(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        return timeInMinutes >= minTimeInMinutes;
      });
    }

    return times;
  };

  const [hasStoredDocs, setHasStoredDocs] = useState<{ licensePath: string | null; idPath: string | null }>({ licensePath: null, idPath: null });
  const [checkingDocs, setCheckingDocs] = useState(false);

  // Check for existing documents in storage
  useEffect(() => {
    const checkDocs = async () => {
      if (!user?.id) return;
      setCheckingDocs(true);
      try {
        // Check License bucket: driver-licenses
        // List files in the user folder
        const { data: licenseFiles } = await supabase.storage.from('driver-licenses').list(user.id);
        const validLicense = licenseFiles && licenseFiles.length > 0 ? licenseFiles.find(f => f.name !== '.emptyFolderPlaceholder') : null;
        const licensePath = validLicense ? `${user.id}/${validLicense.name}` : null;

        // Check ID bucket: carta-identita
        const { data: idFiles } = await supabase.storage.from('carta-identita').list(user.id);
        const validId = idFiles && idFiles.length > 0 ? idFiles.find(f => f.name !== '.emptyFolderPlaceholder') : null;
        const idPath = validId ? `${user.id}/${validId.name}` : null;

        setHasStoredDocs({ licensePath, idPath });
        console.log('Document check:', { licensePath, idPath });
      } catch (err) {
        console.error('Error checking documents:', err);
      } finally {
        setCheckingDocs(false);
      }
    };

    checkDocs();
  }, [user?.id]);

  // AUTOFILL USER DATA FROM PROFILE
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const { data: customerData, error } = await supabase
          .from('customers_extended')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error || !customerData) {
          // If no extended profile, at least try to fill basic info from Auth Context if available
          setFormData(prev => ({
            ...prev,
            firstName: prev.firstName || (user.fullName ? user.fullName.split(' ')[0] : ''),
            lastName: prev.lastName || (user.fullName ? user.fullName.split(' ').slice(1).join(' ') : ''),
            email: prev.email || user.email || '',
            phone: prev.phone || user.phone || ''
          }));
          return;
        }

        // Autofill form with extended data
        setFormData(prev => ({
          ...prev,
          firstName: customerData.nome || prev.firstName || (user.fullName ? user.fullName.split(' ')[0] : ''),
          lastName: customerData.cognome || prev.lastName || (user.fullName ? user.fullName.split(' ').slice(1).join(' ') : ''),
          email: customerData.email || prev.email || user.email || '',
          phone: customerData.telefono || prev.phone || user.phone || '',
          birthDate: customerData.data_nascita || prev.birthDate,
          // License fields from metadata
          licenseNumber: customerData.metadata?.numero_patente || prev.licenseNumber,
          licenseIssueDate: customerData.metadata?.patente_data_rilascio || prev.licenseIssueDate,
        }));

        console.log('Autofilled form with user profile data');

      } catch (err) {
        console.error('Error autofilling user data:', err);
      }
    };

    fetchUserData();
  }, [user?.id, user?.email, user?.fullName, user?.phone]);


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

  // Check vehicle availability when dates change
  useEffect(() => {
    const checkAvailability = async () => {
      if (!item || !formData.pickupDate || !formData.returnDate || !formData.pickupTime || !formData.returnTime) {
        setAvailabilityError(null);
        setPartialUnavailabilityWarning(null);
        return;
      }

      setIsCheckingAvailability(true);
      setAvailabilityError(null);
      setPartialUnavailabilityWarning(null);

      try {
        const pickupDateTime = `${formData.pickupDate}T${formData.pickupTime}:00`;
        const dropoffDateTime = `${formData.returnDate}T${formData.returnTime}:00`;

        // Check if this is a grouped vehicle (multiple vehicles displayed as one)
        const isGroupedVehicle = item.displayNames && item.displayNames.length > 1;
        let conflicts: any[] = [];
        let availableVehicle: string | undefined;

        if (isGroupedVehicle) {
          // Construct array of vehicle objects {name, id} from the item's stored IDs and displayNames
          // We assume item.vehicleIds and item.displayNames are aligned by index
          const vehicleObjects = (item.vehicleIds || []).map((id: string, index: number) => ({
            id,
            name: item.displayNames?.[index] || item.name // fallback to main name if specific name missing
          }));

          // Check availability for all vehicles in the group
          const groupResult = await checkGroupedVehicleAvailability(
            vehicleObjects,
            pickupDateTime,
            dropoffDateTime
          );

          if (groupResult.isAvailable) {
            // Store the available vehicle name AND ID for booking creation
            availableVehicle = groupResult.availableVehicleName;
            setAvailableVehicleName(availableVehicle || null);
            // We also need to store the available vehicle ID to use in the booking!
            // We'll store it in a state or ref.
            // Since availableVehicleName is used in the hook, let's update how we store "availableVehicle"
            // For now, we'll just ensure we can access it later during handleBooking
            // We can store it in a hidden form field or state
            if (groupResult.availableVehicleId) {
              setFormData(prev => ({ ...prev, selectedVehicleId: groupResult.availableVehicleId }));
            }
            conflicts = [];
          } else {
            conflicts = groupResult.conflicts || [];
          }
        } else {
          // Regular single vehicle check
          // Extract ID from item.id (format "car-UUID")
          const specificId = item.id.replace('car-', '');
          conflicts = await checkVehicleAvailability(item.name, pickupDateTime, dropoffDateTime, specificId);
          setAvailableVehicleName(null);
          setFormData(prev => ({ ...prev, selectedVehicleId: specificId }));
        }

        if (conflicts.length > 0) {
          const conflict = conflicts[0];
          const conflictStartDate = safeDate(conflict.pickup_date);
          const conflictEndDate = safeDate(conflict.dropoff_date);

          // Calculate when vehicle becomes available (end time + 1h30 buffer)
          const availableTime = new Date(conflictEndDate.getTime() + (90 * 60 * 1000));

          // Check if the conflict is on the same day as requested pickup
          const requestedPickupDate = safeDate(formData.pickupDate);
          requestedPickupDate.setHours(0, 0, 0, 0);
          const conflictEndDateOnly = safeDate(conflictEndDate);
          conflictEndDateOnly.setHours(0, 0, 0, 0);

          if (requestedPickupDate.getTime() === conflictEndDateOnly.getTime()) {
            // Same day - show available time only
            const availableTimeStr = availableTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

            // Only show error if the available time is AFTER the requested pickup time
            // Otherwise, it's just a buffer warning that might be resolved by the user's selection
            // But wait, if 'conflicts' has items, it implies an overlap.
            // If we are strictly checking, we should trust the conflict.
            // However, the user said "It shows available after 17:00" and they selected 18:00.
            // IF 18:00 > 17:30, it should be VALID.
            // Why did it return a conflict? Maybe the backend check is overly aggressive on buffer?
            // Let's add a frontend check:
            const requestedTime = safeDate(`${formData.pickupDate}T${formData.pickupTime}`);
            if (requestedTime < availableTime) {
              setAvailabilityError(`Disponibile dopo le ${availableTimeStr}.`);
            } else {
              // Technically no conflict if we respect buffer locally?
              // But usually we shouldn't get here if backend is correct.
              // We'll trust the backend mostly, but this check prevents "Disponibile dopo 17:30" when you selected 18:00.
              // If we are here, backend said NO. So we explain WHY.
              // But if 18:00 > 17:30, why did backend say NO?
              // Maybe backend buffer is larger? Or backend timezone diff?
              setAvailabilityError(`Veicolo non disponibile. Riprova dopo le ${availableTimeStr}.`);
            }
          } else {
            // Different days - show date and time only
            const availableDateStr = availableTime.toLocaleDateString('it-IT');
            const availableTimeStr = availableTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            setAvailabilityError(
              `Disponibile dal ${availableDateStr} alle ${availableTimeStr}.`
            );
          }
        } else {
          // Check for partial-day unavailability (e.g., at mechanic for a few hours)
          const vehicleNameToCheck = availableVehicle || item.name;
          const partialInfo = await checkVehiclePartialUnavailability(
            vehicleNameToCheck,
            formData.pickupDate,
            formData.pickupTime
          );

          if (partialInfo.isPartiallyUnavailable && partialInfo.availableAfter) {
            setPartialUnavailabilityWarning(
              `Attenzione: questo veicolo sara disponibile dopo le ${partialInfo.availableAfter}.`
            );
          }
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        // Don't block the user if there's an error checking availability
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    // Debounce the availability check
    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [item, formData.pickupDate, formData.returnDate, formData.pickupTime, formData.returnTime]);

  // === Calculs tarifaires / durée / km inclus ===
  const {
    duration, rentalCost, insuranceCost, extrasCost, kmPackageCost, pickupFee, dropoffFee, subtotal, taxes, total, includedKm,
    driverAge, licenseYears, youngDriverFee, recentLicenseFee, secondDriverFee, recommendedKm,
    membershipDiscount, membershipTier, originalTotal, finalTotal,
    isMassimo, specialDiscountAmount, carWashFee
  } = useMemo(() => {
    const zero = {
      duration: { days: 0, hours: 0 }, rentalCost: 0, insuranceCost: 0, extrasCost: 0, kmPackageCost: 0, pickupFee: 0, dropoffFee: 0, subtotal: 0, taxes: 0, total: 0, includedKm: 0, driverAge: 0, licenseYears: 0, youngDriverFee: 0, recentLicenseFee: 0, secondDriverFee: 0, recommendedKm: null, membershipDiscount: 0, membershipTier: null, originalTotal: 0, finalTotal: 0,
      isMassimo: false, specialDiscountAmount: 0, carWashFee: 0
    };
    if (!item || !item.pricePerDay) return zero;

    // === DUAL PRICING LOGIC ===
    // Determine which price to use based on residency and usage zone
    let pricePerDay = item.pricePerDay[currency]; // fallback to legacy pricing

    if (item.priceResidentDaily && item.priceNonresidentDaily) {
      // Dual pricing available for this vehicle
      const userResidencyZone = (user as any)?.residencyZone || 'NON_RESIDENTE';
      const isResident = userResidencyZone === 'RESIDENTE_CAGLIARI_SUD_SARDEGNA';

      // Apply resident pricing ONLY if:
      // 1. User is a resident (RESIDENTE_CAGLIARI_SUD_SARDEGNA)
      // 2. AND selected usage zone is CAGLIARI_SUD
      if (isResident && formData.usageZone === 'CAGLIARI_SUD') {
        pricePerDay = item.priceResidentDaily;
      } else {
        // All other cases use non-resident pricing:
        // - Non-resident users (regardless of zone)
        // - Resident users selecting FUORI_ZONA (blocked by validation)
        // - No zone selected yet (defaults to non-resident)
        pricePerDay = item.priceNonresidentDaily;
      }
    }

    let billingDays = 0;
    let days = 0;
    let hours = 0;
    if (formData.pickupDate && formData.returnDate) {
      const pickup = safeDate(`${formData.pickupDate}T${formData.pickupTime}`);
      const ret = safeDate(`${formData.returnDate}T${formData.returnTime}`);
      if (pickup < ret) {
        // Updated Logic: User requested "Dal 6 al 8 sono 2 giorni... even if it is 22:30"
        // This implies strict calendar day difference: (Return Date - Pickup Date) in days.
        // We calculate this by normalizing both to midnight or simply taking the difference in days.

        const diffTime = Math.abs(ret.getTime() - pickup.getTime());
        const standardHours = diffTime / (1000 * 60 * 60);

        // Calendar Day Logic (Midnight to Midnight)
        const pDate = new Date(pickup); pDate.setHours(0, 0, 0, 0);
        const rDate = new Date(ret); rDate.setHours(0, 0, 0, 0);
        const diffDaysCalendar = Math.round((rDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));

        // Unified Duration & Billing Logic
        // Ensures that if price is for 4 days, display says "4 days"
        billingDays = Math.max(1, diffDaysCalendar);
        days = billingDays;

        hours = Math.floor(standardHours % 24);

        if (billingDays < 1) billingDays = 1;
      }
    }


    const isMassimo = user ? isMassimoRunchina(user) : isMassimoRunchina({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName
    });
    const billingDaysCalc = billingDays < 1 ? 1 : billingDays;

    // --- RENTAL COST ---
    let calculatedRentalCost = billingDays * pricePerDay;
    let massimoTotalDiscount = 0;

    if (isMassimo) {
      // Massimo pricing: UNCHANGED - keep existing tiered discount logic
      // 1-3 days: -10%, 4 days: -15%, 5 days: -25%, 7+ days: -30%
      const baseRate = SPECIAL_CLIENTS.MASSIMO_RUNCHINA.config.baseRate;
      const discountTiers = SPECIAL_CLIENTS.MASSIMO_RUNCHINA.config.discountTiers;

      // Find applicable discount tier
      const tier = discountTiers.find(t => billingDaysCalc >= t.minDays);
      const discountPercent = tier ? tier.discount : 0.10;

      const baseRentalCost = billingDaysCalc * baseRate;
      massimoTotalDiscount = roundToTwoDecimals(baseRentalCost * discountPercent);
      calculatedRentalCost = roundToTwoDecimals(baseRentalCost - massimoTotalDiscount);
    } else {
      // NEW: Apply multi-day pricing for all other customers
      const vType = getVehicleType(item, categoryContext);
      const userResidencyZone = (user as any)?.residencyZone || 'NON_RESIDENTE';
      const isResident = userResidencyZone === 'RESIDENTE_CAGLIARI_SUD_SARDEGNA' && formData.usageZone === 'CAGLIARI_SUD';

      calculatedRentalCost = calculateMultiDayPrice(vType, billingDaysCalc, pricePerDay, isResident);
    }


    // --- INSURANCE COST ---
    // Dynamic Pricing Logic based on Vehicle Type
    // RCA: €0/day (all categories)
    // SUPERCARS:
    //   - KASKO BASE: €100/day
    //   - KASKO BLACK: €150/day
    //   - KASKO SIGNATURE: €200/day
    //   - DR7: €300/day
    // URBAN (Panda, Captur):
    //   - KASKO BASE: €15/day
    //   - KASKO DR7: €45/day
    // UTILITAIRE (Ducato, Vito):
    //   - KASKO BASE: €45/day
    //   - KASKO DR7: €90/day

    let insuranceDailyPrice = 0;
    const tier = formData.insuranceOption;

    // Type checking for VehicleType specific logic
    const vType = getVehicleType(item, categoryContext);

    // Insurance pricing - KASKO BASE is now the only option and is included
    // RCA is always €0 (basic coverage, not used)
    if (tier === 'RCA') {
      insuranceDailyPrice = 0;
    } else if (tier === 'KASKO_BASE') {
      // KASKO BASE pricing by vehicle type
      if (vType === 'UTILITARIA') insuranceDailyPrice = 15;
      else if (vType === 'FURGONE' || vType === 'V_CLASS') insuranceDailyPrice = 45;
      else insuranceDailyPrice = 100; // Supercar
    }
    // Note: KASKO_BLACK, KASKO_SIGNATURE, and KASKO_DR7 have been removed


    let calculatedInsuranceCost = insuranceDailyPrice * billingDays;

    if (isMassimo) {
      // Massimo gets KASKO BASE included (free)
      if (formData.insuranceOption === 'KASKO_BASE') {
        calculatedInsuranceCost = 0;
      }
    }

    // Calculate extras cost
    const calculatedExtrasCost = formData.extras.reduce((acc, extraId) => {
      const extra = RENTAL_EXTRAS.find(e => e.id === extraId);
      if (!extra) return acc;
      if (extra.oneTime) {
        return acc + (extra.pricePerDay[currency] || 0);
      }
      return acc + (extra.pricePerDay[currency] || 0) * billingDays;
    }, 0);

    const calculatedDriverAge = calculateAgeFromDDMMYYYY(formData.birthDate);
    const calculatedLicenseYears = calculateYearsSince(formData.licenseIssueDate);

    // Get young driver fee from RENTAL_EXTRAS
    // 2 GUIDATORI / UNDER 25 / UNDER 5 ANNI PATENTE Logic
    // Utilitarie e Furgone: €5 (Add.Driver / Under 25), €10 (Recent Lic)
    // Supercar e V Class: €10 (Add.Driver / Under 25), €20 (Recent Lic)

    // Grouping for Extras:
    // ALL ADDITIONAL FEES REMOVED - No extra charges for young drivers or recent licenses
    const isCheapExtras = vType === 'UTILITARIA' || vType === 'FURGONE';
    const feeAddDriver = 0; // Second driver is FREE - no additional charge
    const calculatedSecondDriverFee = 0; // Second driver is always free
    const feeYoungDriver = 0; // Young driver fee REMOVED - now FREE
    const feeRecentLic = 0; // Recent license fee REMOVED - now FREE

    const calculatedYoungDriverFee = 0; // No young driver fee
    const calculatedRecentLicenseFee = 0; // No recent license fee



    // Calculate FREE included KM based on rental duration
    const freeIncludedKm = calculateIncludedKm(billingDays);

    // Calculate KM package cost (OPTIONAL - user can add extra km)
    let calculatedKmPackageCost = 0;
    let calculatedIncludedKm = freeIncludedKm; // Start with free KM

    if (formData.kmPackageType === 'unlimited') {
      calculatedKmPackageCost = calculateUnlimitedKmPrice(item.name, billingDays, true);
      calculatedIncludedKm = 9999; // Unlimited
    }

    // Massimo Override for KM OR Urban/Corporate (utilitarie) always unlimited
    // NEW RULE: Utilitaria/Furgone/V_Class always get Free Unlimited KM
    if (isMassimo || vType === 'UTILITARIA' || vType === 'FURGONE' || vType === 'V_CLASS') {
      calculatedKmPackageCost = 0; // Free unlimited KM
      calculatedIncludedKm = 9999;
    }
    // else kmPackageType === 'none' -> only free KM included

    // Get recommendation
    const calculatedRecommendedKm = recommendKmPackage(formData.expectedKm, item.name, billingDays);

    // Pickup and Drop-off fees (€50 each)
    // Airport fees removed
    const calculatedPickupFee = 0;
    const calculatedDropoffFee = 0;

    // Car Wash Fee (Mandatory for most clients, excluded for special clients)
    // Utilitarie / Furgone / V-Class: €30 (Updated per user request to flat 30)
    // Supercar: €30
    // Car wash is now included in the rental price - no additional fee
    let carWashFee = 0;


    let calculatedSubtotal = calculatedRentalCost + calculatedInsuranceCost + calculatedExtrasCost + calculatedKmPackageCost + calculatedYoungDriverFee + calculatedRecentLicenseFee + calculatedSecondDriverFee + calculatedPickupFee + calculatedDropoffFee + carWashFee;

    // Massimo: Round to whole euros (no cents)
    let specialDiscountAmount = massimoTotalDiscount;
    if (isMassimo && SPECIAL_CLIENTS.MASSIMO_RUNCHINA.config.noCents) {
      calculatedSubtotal = roundToWholeEuros(calculatedSubtotal);
    }

    // Tax calculation
    // ALL PRICES ARE TAX-INCLUSIVE (IVA/TVA already included)
    // No additional tax should be added
    const calculatedTaxes = 0;
    const calculatedTotal = calculatedSubtotal;

    // Apply membership discount
    const discountInfo = calculateDiscountedPrice(calculatedTotal, user, 'car_rental');
    const membershipTierName = getMembershipTierName(user);

    return {
      duration: { days, hours },
      rentalCost: calculatedRentalCost,
      insuranceCost: calculatedInsuranceCost,
      extrasCost: calculatedExtrasCost,
      kmPackageCost: calculatedKmPackageCost,
      pickupFee: calculatedPickupFee,
      dropoffFee: calculatedDropoffFee,
      subtotal: calculatedSubtotal,
      taxes: calculatedTaxes,
      total: calculatedTotal,
      includedKm: calculatedIncludedKm,
      driverAge: calculatedDriverAge,
      licenseYears: calculatedLicenseYears,
      youngDriverFee: calculatedYoungDriverFee,
      recentLicenseFee: calculatedRecentLicenseFee,
      secondDriverFee: calculatedSecondDriverFee,
      recommendedKm: calculatedRecommendedKm,
      membershipDiscount: discountInfo.discountAmount,
      membershipTier: membershipTierName,
      originalTotal: discountInfo.originalPrice,
      finalTotal: discountInfo.finalPrice,
      isMassimo,
      specialDiscountAmount,
      carWashFee
    };
  }, [
    formData.pickupDate, formData.pickupTime, formData.returnDate, formData.returnTime,
    formData.insuranceOption, formData.extras, formData.birthDate, formData.licenseIssueDate, formData.addSecondDriver,
    formData.kmPackageType, formData.kmPackageDistance, formData.expectedKm,
    formData.email,
    item, currency, user, isUrbanOrCorporate, categoryContext
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
    if (step === 4 && finalTotal > 0) {
      setIsClientSecretLoading(true);
      setClientSecret(null);
      setStripeError(null);

      fetch(`${FUNCTIONS_BASE}/.netlify/functions/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal,
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
  }, [step, finalTotal, currency, user?.id, formData.email]);

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



  // Insurance is now automatic KASKO_BASE - no eligibility checks needed


  // Force Massimo Runchina settings & Pre-fill Personal Data
  useEffect(() => {
    let updates: any = {};

    // 1. Pre-fill Personal Data (Fast Track) for ANY logged-in user
    if (user && !formData.firstName && !formData.lastName) {
      const nameParts = user.fullName ? user.fullName.split(' ') : [];
      const first = nameParts.length > 0 ? nameParts[0] : '';
      const last = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      updates.firstName = first;
      updates.lastName = last;
      updates.phone = user.phone || '';
      updates.email = user.email || '';
    }

    // 2. Special Rules for Massimo Runchina
    if (isMassimoRunchina(formData.email || user?.email || '')) {
      // Force Pricing/Insurance Settings
      if (formData.insuranceOption !== 'KASKO_BASE') updates.insuranceOption = 'KASKO_BASE';
      if (formData.kmPackageType !== 'unlimited') updates.kmPackageType = 'unlimited';

      // Ensure name is correct if empty (Massimo specific fallback)
      if (!formData.firstName && !updates.firstName) updates.firstName = 'Massimo';
      if (!formData.lastName && !updates.lastName) updates.lastName = 'Runchina';
      if (!formData.phone && !updates.phone) updates.phone = '+39 347 000 0000'; // Placeholder

      // Fast Track Defaults for Massimo
      if (!formData.birthDate && !updates.birthDate) updates.birthDate = '1969-01-01';
      if (!formData.licenseNumber && !updates.licenseNumber) updates.licenseNumber = 'VIP-AUTOFILLED';
      if (!formData.licenseDate && !updates.licenseDate) updates.licenseDate = '2000-01-01';
      if (!formData.birthPlace && !updates.birthPlace) updates.birthPlace = 'Cagliari';
      if (!formData.address && !updates.address) updates.address = 'VIP Fast Track';
      if (!formData.city && !updates.city) updates.city = 'Cagliari';
      if (!formData.zipCode && !updates.zipCode) updates.zipCode = '09100';
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [user, formData.firstName, formData.lastName, formData.email, formData.insuranceOption, formData.kmPackageType]);




  const formatPrice = (price: number) =>
    new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(price);

  const formatDeposit = (price: number) =>
    new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace(/\./g, ' ');

  // Calculate deposit based on customer loyalty, license years, and vehicle type
  const getDeposit = () => {
    // Priority 1: Loyal customers (3+ rentals) get no deposit
    if (isLoyalCustomer) return 0;

    // Priority 2: KASKO_DR7 insurance always has no deposit
    if (formData.insuranceOption === 'KASKO_DR7') return 0;

    // Priority 3: Calculate based on vehicle type and license years
    const vType = getVehicleType(item, categoryContext);
    const isUtilitaria = vType === 'UTILITARIA' || vType === 'FURGONE' || vType === 'V_CLASS';
    const depositRules = isUtilitaria ? DEPOSIT_RULES.UTILITARIA : DEPOSIT_RULES.SUPERCAR;

    // Use license years from pricing calculation
    if (licenseYears <= 5) {
      return depositRules.LICENSE_UP_TO_5;
    } else {
      return depositRules.LICENSE_OVER_5;
    }
  };

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isFile = type === 'file';

    if (name === 'pickupDate') {
      const currentDate = new Date().toISOString().split('T')[0];
      if (value < currentDate) {
        setErrors(prev => ({ ...prev, pickupDate: "Non puoi selezionare una data passata." }));
        return; // Don't update the form data
      }
      const dayOfWeek = getDayOfWeek(value);
      if (dayOfWeek === 0) {
        setErrors(prev => ({ ...prev, pickupDate: "Le prenotazioni non sono disponibili la domenica." }));
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

    // Clear generic date error (duration, min rental) if any date/time field changes
    if (['pickupDate', 'pickupTime', 'returnDate', 'returnTime'].includes(name) && errors.date) {
      setErrors(prev => ({ ...prev, date: '' }));
    }
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
      if (formData.pickupDate && formData.returnDate) {
        const pickup = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
        const returnD = new Date(`${formData.returnDate}T${formData.returnTime}`);
        const diffMs = returnD.getTime() - pickup.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        // Use 22.5 hour day system (22h30 = 1 rental day)
        // Allow a small tolerance (0.99) to prevent floating point issues
        const dayLength = 22.5;
        const rentalDays = diffHours / dayLength;

        if (rentalDays < 0.99) {
          newErrors.date = "Il noleggio minimo è di 1 giorno.";
        }

        // Check minimum rental duration of 2 hours for airport drop-offs
        const isAirportDropoff = formData.returnLocation === 'cagliari_airport';
        if (isAirportDropoff && diffHours < 2) {
          newErrors.returnTime = "Per la riconsegna in aeroporto, la durata minima del noleggio è di 2 ore.";
        }

        // Check Sunday drop-off (CLOSED)
        const returnDayOfWeek = getDayOfWeek(formData.returnDate);
        if (returnDayOfWeek === 0) { // Sunday = 0
          newErrors.returnDate = "Non è possibile riconsegnare il veicolo di domenica. Siamo chiusi. Seleziona un altro giorno.";
        }

        // Check Saturday drop-off time limits
        if (returnDayOfWeek === 6) { // Saturday = 6
          const returnHour = parseInt(formData.returnTime.split(':')[0]);
          const returnMinutes = parseInt(formData.returnTime.split(':')[1]);
          const returnTimeInMinutes = returnHour * 60 + returnMinutes;

          if (isAirportDropoff) {
            // Airport: maximum 11:00
            if (returnTimeInMinutes > 11 * 60) {
              newErrors.returnTime = "Il sabato, la riconsegna in aeroporto deve essere entro le 11:00.";
            }
          } else {
            // Office: maximum 12:00
            if (returnTimeInMinutes > 12 * 60) {
              newErrors.returnTime = "Il sabato, la riconsegna in ufficio deve essere entro le 12:00.";
            }
          }
        }
      }
      if (formData.pickupDate && getDayOfWeek(formData.pickupDate) === 0) {
        newErrors.pickupDate = "Le prenotazioni non sono disponibili la domenica.";
      }

      // Check if there's an availability error
      if (availabilityError) {
        newErrors.availability = availabilityError;
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

      // Validate images ONLY if not already stored
      if (!formData.licenseImage && !hasStoredDocs.licensePath) {
        newErrors.licenseImage = "La foto della patente è obbligatoria.";
      }
      if (!formData.idImage && !hasStoredDocs.idPath) {
        newErrors.idImage = "La foto del documento d'identità è obbligatoria.";
      }

      if (!formData.confirmsInformation) newErrors.confirmsInformation = "Devi confermare che le informazioni sono corrette.";
      if (ly < 2) newErrors.licenseIssueDate = "È richiesta una patente con almeno 2 anni di anzianità.";
      if (formData.addSecondDriver) {
        if (!formData.secondDriver.firstName) newErrors['secondDriver.firstName'] = "Il nome del secondo guidatore è obbligatorio.";
        if (!formData.secondDriver.lastName) newErrors['secondDriver.lastName'] = "Il cognome del secondo guidatore è obbligatorio.";
      }
    }
    if (step === 3) {
      // Validate usage zone selection
      if (!formData.usageZone) {
        newErrors.usageZone = "Devi selezionare una zona di utilizzo.";
      }

      // Block residents from selecting Fuori zona
      const userResidencyZone = (user as any)?.residencyZone || 'NON_RESIDENTE';
      const isResident = userResidencyZone === 'RESIDENTE_CAGLIARI_SUD_SARDEGNA';

      if (isResident && formData.usageZone === 'FUORI_ZONA') {
        newErrors.usageZone = "Con tariffa residente il veicolo è autorizzato solo a Cagliari e Sud Sardegna.";
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

  const finalizeBooking = async (paymentIntentId?: string) => {
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
      // Upload secure documents or use existing
      let licenseImageUrl = null;
      let idImageUrl = null;

      // License Logic
      if (formData.licenseImage) {
        licenseImageUrl = await uploadToBucket('driver-licenses', user.id, formData.licenseImage, 'license');
      } else if (hasStoredDocs.licensePath) {
        licenseImageUrl = hasStoredDocs.licensePath;
      }

      // ID Logic
      if (formData.idImage) {
        idImageUrl = await uploadToBucket('carta-identita', user.id, formData.idImage, 'id'); // Note: changed bucket from 'driver-ids' to 'carta-identita' to match AdminPage?
        // Wait, check original code usage. Original used 'driver-ids' at line 1044?
        // AdminPage lists 'carta-identita'. I should match AdminPage!
        // But if I change bucket name for new uploads, I might break existing standard?
        // Let's check what 'driver-ids' maps to.
        // If AdminPage says 'carta-identita', I should probably use that bucket.
        // Safest is to use the same bucket I checked: 'carta-identita'.
        // But if original code used 'driver-ids', maybe 'carta-identita' is a legacy name or vice versa?
        // Let's stick to what AdminPage reads: 'carta-identita'.
      } else if (hasStoredDocs.idPath) {
        idImageUrl = hasStoredDocs.idPath;
      }

      // Fallback? If null, backend might reject or just store null.
      // Validation ensures we have one or the other.

      const { days, hours } = duration;

      console.log('FormData dates:', {
        pickup_date: formData.pickupDate,
        pickup_time: formData.pickupTime,
        dropoff_date: formData.returnDate,
        dropoff_time: formData.returnTime,
      });

      // Ensure dates are valid before creating booking
      if (!formData.pickupDate || !formData.returnDate) {
        throw new Error('Dates invalides. Veuillez sélectionner les dates de ritiro et riconsegna.');
      }

      console.log('DEBUG - Form data before booking:', {
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        returnDate: formData.returnDate,
        returnTime: formData.returnTime
      });

      // Create pickup and dropoff dates in Europe/Rome timezone
      // This ensures times are always interpreted as Italy time, regardless of user's browser timezone
      const createItalyDateTime = (dateStr: string, timeStr: string) => {
        const dateTimeString = `${dateStr}T${timeStr}:00`;
        const localDate = new Date(dateTimeString);
        const italyTimeString = new Date(dateTimeString).toLocaleString('en-US', { timeZone: 'Europe/Rome' });
        const italyDate = new Date(italyTimeString);
        const offset = localDate.getTime() - italyDate.getTime();
        return new Date(localDate.getTime() - offset);
      };

      const pickupDateTime = createItalyDateTime(formData.pickupDate, formData.pickupTime);
      const dropoffDateTime = createItalyDateTime(formData.returnDate, formData.returnTime);

      const bookingData = {
        user_id: user.id,
        vehicle_type: item.type || 'car',
        vehicle_name: availableVehicleName || item.name, // Use specific vehicle from group if available
        vehicle_image_url: item.image,
        pickup_date: pickupDateTime.toISOString(),
        dropoff_date: dropoffDateTime.toISOString(),
        pickup_location: formData.pickupLocation,
        dropoff_location: formData.returnLocation,
        price_total: eurosToCents(total),
        currency: currency.toUpperCase(),
        status: 'pending',
        payment_status: paymentIntentId || formData.paymentMethod === 'credit' ? 'succeeded' : 'pending',
        payment_method: formData.paymentMethod,
        stripe_payment_intent_id: paymentIntentId || null,
        booked_at: new Date().toISOString(),
        booking_usage_zone: formData.usageZone || null, // Store usage zone for residency pricing
        booking_details: {
          customer: {
            fullName: `${formData.firstName} ${formData.lastName}`,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            birthDate: formData.birthDate,
            age: driverAge,
            licenseNumber: formData.licenseNumber,
            licenseIssueDate: formData.licenseIssueDate,
            licenseYears: licenseYears,
            isSardinianResident: formData.isSardinianResident,
          },
          secondDriver: formData.addSecondDriver ? {
            fullName: `${formData.secondDriver.firstName} ${formData.secondDriver.lastName}`,
            firstName: formData.secondDriver.firstName,
            lastName: formData.secondDriver.lastName,
            email: formData.secondDriver.email,
            phone: formData.secondDriver.phone,
            birthDate: formData.secondDriver.birthDate,
            licenseNumber: formData.secondDriver.licenseNumber,
            licenseIssueDate: formData.secondDriver.licenseIssueDate,
          } : null,
          duration: `${days} days`,
          insuranceOption: formData.insuranceOption,
          extras: formData.extras,
          kmPackage: {
            type: includedKm >= 9999 ? 'unlimited' : formData.kmPackageType,
            distance: includedKm >= 9999 ? 'unlimited' : (formData.kmPackageType === 'unlimited' ? 'unlimited' : formData.kmPackageDistance),
            cost: kmPackageCost,
            includedKm: includedKm,
            isPremium: isPremiumVehicle(item.name)
          },
          vehicle_id: formData.selectedVehicleId, // Store specific vehicle ID to avoid grouping collisions
          driverLicenseImage: licenseImageUrl,
          driverIdImage: idImageUrl,
        }
      };

      const { data, error } = await supabase.from('bookings').insert(bookingData).select().single();

      if (error) {
        console.error('DB insert error details:', error);
        throw new Error(`DB insert failed: ${error.message}`);
      }

      if (data) {
        // Send email confirmation
        fetch(`${FUNCTIONS_BASE}/.netlify/functions/send-booking-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: data }),
        }).catch(emailError => console.error('Failed to send confirmation email:', emailError));

        // Send WhatsApp notification to admin
        fetch(`${FUNCTIONS_BASE}/.netlify/functions/send-whatsapp-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: data }),
        }).catch(whatsappError => console.error('Failed to send WhatsApp notification:', whatsappError));

        // Note: Google Calendar event is created automatically by send-booking-confirmation function

        // Generate WhatsApp prefilled message for customer
        const bookingId = data.id.substring(0, 8).toUpperCase();
        const vehicleName = data.vehicle_name;
        const pickupDate = new Date(data.pickup_date);
        const dropoffDate = new Date(data.dropoff_date);
        const customerName = `${formData.firstName} ${formData.lastName}`;
        const customerPhone = formData.phone;
        const totalPrice = (data.price_total / 100).toFixed(2);
        const insuranceOption = data.insurance_option || data.booking_details?.insuranceOption || 'Nessuna';

        const whatsappMessage = `Ciao! Ho appena completato una prenotazione sul vostro sito.\n\n` +
          `📋 *Dettagli Prenotazione*\n` +
          `*ID:* DR7-${bookingId}\n` +
          `*Nome:* ${customerName}\n` +
          `*Telefono:* ${customerPhone}\n` +
          `*Veicolo:* ${vehicleName}\n` +
          `*Data Ritiro:* ${pickupDate.toLocaleDateString('it-IT')} alle ${pickupDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n` +
          `*Data Riconsegna:* ${dropoffDate.toLocaleDateString('it-IT')} alle ${dropoffDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n` +
          `*Luogo Ritiro:* ${data.pickup_location}\n` +
          `*Assicurazione:* ${insuranceOption}\n` +
          `*Totale:* €${totalPrice}\n\n` +
          `Grazie!`;

        const officeWhatsAppNumber = '393457905205';
        const whatsappUrl = `https://wa.me/${officeWhatsAppNumber}?text=${encodeURIComponent(whatsappMessage)}`;

        // Open WhatsApp in a new tab after a short delay
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1000);
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
    console.log("handleSubmit called", { paymentMethod: formData.paymentMethod, step, userId: user?.id });
    if (!validateStep() || !item) return;
    setIsProcessing(true);

    // Credit wallet payment (ATOMIC TRANSACTION)
    if (!user?.id) {
      setStripeError('User not logged in');
      setIsProcessing(false);
      return;
    }

    // Check sufficient balance (Front-check for UX)
    const hasBalance = await hasSufficientBalance(user.id, finalTotal);
    if (!hasBalance) {
      setStripeError(`Credito insufficiente. Saldo attuale: €${creditBalance.toFixed(2)}, Richiesto: €${finalTotal.toFixed(2)}`);
      setIsProcessing(false);
      return;
    }

    if (formData.paymentMethod === 'credit' && step === 4) {
      try {
        // 1. Prepare Documents (Upload if needed)
        let licenseImageUrl = null;
        let idImageUrl = null;

        if (formData.licenseImage) {
          licenseImageUrl = await uploadToBucket('driver-licenses', user.id, formData.licenseImage, 'license');
        } else if (hasStoredDocs.licensePath) {
          licenseImageUrl = hasStoredDocs.licensePath;
        }

        if (formData.idImage) {
          idImageUrl = await uploadToBucket('carta-identita', user.id, formData.idImage, 'id');
        } else if (hasStoredDocs.idPath) {
          idImageUrl = hasStoredDocs.idPath;
        }

        // 2. Prepare Payload (Replicating finalizeBooking logic)
        const createItalyDateTime = (dateStr: string, timeStr: string) => {
          const dateTimeString = `${dateStr}T${timeStr}:00`;
          const localDate = new Date(dateTimeString);
          const italyTimeString = new Date(dateTimeString).toLocaleString('en-US', { timeZone: 'Europe/Rome' });
          const italyDate = new Date(italyTimeString);
          const offset = localDate.getTime() - italyDate.getTime();
          return new Date(localDate.getTime() - offset);
        };

        const pickupDateTime = createItalyDateTime(formData.pickupDate, formData.pickupTime);
        const dropoffDateTime = createItalyDateTime(formData.returnDate, formData.returnTime);
        const { days } = duration;

        const bookingPayload = {
          user_id: user.id,
          vehicle_type: item.type || 'car',
          vehicle_name: availableVehicleName || item.name,
          vehicle_image_url: item.image,
          pickup_date: pickupDateTime.toISOString(),
          dropoff_date: dropoffDateTime.toISOString(),
          pickup_location: formData.pickupLocation,
          dropoff_location: formData.returnLocation,
          price_total: Math.round(finalTotal * 100),
          currency: currency.toUpperCase(),
          booking_source: 'website',
          booking_details: {
            customer: {
              fullName: `${formData.firstName} ${formData.lastName}`,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              birthDate: formData.birthDate,
              age: driverAge,
              licenseNumber: formData.licenseNumber,
              licenseIssueDate: formData.licenseIssueDate,
              licenseYears: licenseYears,
              isSardinianResident: formData.isSardinianResident,
            },
            secondDriver: formData.addSecondDriver ? {
              fullName: `${formData.secondDriver.firstName} ${formData.secondDriver.lastName}`,
              firstName: formData.secondDriver.firstName,
              lastName: formData.secondDriver.lastName,
              email: formData.secondDriver.email,
              phone: formData.secondDriver.phone,
              birthDate: formData.secondDriver.birthDate,
              licenseNumber: formData.secondDriver.licenseNumber,
              licenseIssueDate: formData.secondDriver.licenseIssueDate,
            } : null,
            duration: `${days} days`,
            insuranceOption: formData.insuranceOption,
            extras: formData.extras,
            kmPackage: {
              type: includedKm >= 9999 ? 'unlimited' : formData.kmPackageType,
              distance: includedKm >= 9999 ? 'unlimited' : (formData.kmPackageType === 'unlimited' ? 'unlimited' : formData.kmPackageDistance),
              cost: kmPackageCost,
              includedKm: includedKm,
              isPremium: isPremiumVehicle(item.name)
            },
            vehicle_id: formData.selectedVehicleId,
            driverLicenseImage: licenseImageUrl,
            driverIdImage: idImageUrl,
          }
        };

        // 3. Call Atomic RPC
        console.log("Starting credit booking RPC call...", { user: user.id, amount: Math.round(finalTotal * 100), vehicle: item.name });
        const { data, error } = await supabase.rpc('book_with_credits', {
          p_user_id: user.id,
          p_amount_cents: Math.round(finalTotal * 100),
          p_vehicle_name: item.name,
          p_booking_payload: bookingPayload
        });
        console.log("RPC returned:", { data, error });

        if (error) {
          console.error("RPC Error:", error);
          setStripeError(error.message);
          setIsProcessing(false);
          // Attempt Refund logic if needed? 
          // RPC handles rollback internally, so no manual refund needed!
          return;
        }

        if (data && data.success) {
          console.log("Booking successful! Payload:", data);
          // 4. Success Notifications
          // We need a 'full' booking object for the notification functions, similar to what 'insert' returns.
          // The RPC returns { success: true, booking_id: '...', new_balance: ... }
          // We can reconstruct the necessary fields or better yet, fetch the booking?
          // Fetching adds latency but ensures accuracy.
          // OR we just use the payload + id.

          const bookingData = {
            id: data.booking_id,
            created_at: new Date().toISOString(),
            ...bookingPayload,
            booking_details: bookingPayload.booking_details, // ensure accessible
            // Flat fields for notification scripts might be expected
            pickup_location: bookingPayload.pickup_location,
            vehicle_name: bookingPayload.vehicle_name,
            price_total: bookingPayload.price_total,
            pickup_date: bookingPayload.pickup_date,
            dropoff_date: bookingPayload.dropoff_date
          };

          // Construct the full booking object with the ID from RPC
          const finalBookingData = {
            ...bookingPayload,
            id: data.booking_id, // Important: Use ID from RPC response
            created_at: new Date().toISOString(),
            status: 'confirmed',
            payment_status: 'succeeded'
          };

          console.log("Calling onBookingComplete...", finalBookingData);

          // Send Email Confirmation
          fetch(`${FUNCTIONS_BASE}/.netlify/functions/send-booking-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: finalBookingData }),
          }).catch(e => console.error('Email error', e));

          // Send WhatsApp Admin
          fetch(`${FUNCTIONS_BASE}/.netlify/functions/send-whatsapp-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: finalBookingData }),
          }).catch(e => console.error('WhatsApp error', e));

          // Completed - Pass the full object with ID so UI can redirect
          onBookingComplete(finalBookingData);

          // WhatsApp Customer Message
          const bookingId = data.booking_id.substring(0, 8).toUpperCase();
          const customerName = `${formData.firstName} ${formData.lastName}`;
          const customerPhone = formData.phone;
          const totalPrice = finalTotal.toFixed(2);

          const whatsappMessage = `Ciao! Ho appena completato una prenotazione con Credito DR7.\n\n` +
            `📋 *Dettagli Prenotazione*\n` +
            `*ID:* DR7-${bookingId}\n` +
            `*Nome:* ${customerName}\n` +
            `*Telefono:* ${customerPhone}\n` +
            `*Veicolo:* ${item.name}\n` +
            `*Ritiro:* ${formData.pickupDate} ${formData.pickupTime}\n` +
            `*Totale:* €${totalPrice}\n\n` +
            `Grazie!`;

          const whatsappUrl = `https://wa.me/393457905205?text=${encodeURIComponent(whatsappMessage)}`;
          setTimeout(() => window.open(whatsappUrl, '_blank'), 1000);

          // CRITICAL: Reset processing state after successful booking
          console.log("Resetting processing state to false");
          setIsProcessing(false);
        } else {
          // RPC returned but success was not true
          console.warn("RPC returned success: false", data);
          setStripeError(data?.message || "Booking failed. Please try again or contact support.");
          setIsProcessing(false);
        }

      } catch (err: any) {
        console.error("Catch Error during booking:", err);
        setStripeError(err.message || "Unknown error during booking");
        setIsProcessing(false);
      }
    } else if (formData.paymentMethod === 'stripe' && step === 4) {
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
        await finalizeBooking(paymentIntent.id);
      } else {
        setStripeError("Payment not completed. Status: " + paymentIntent?.status);
        setIsProcessing(false);
      }
    }
  };

  const handleNext = () => validateStep() && setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const steps = [
    { id: 1, name: t('STEP 1: Date e Località') },
    { id: 2, name: t('STEP 2: Informazioni Conducente') },
    { id: 3, name: t('STEP 3: Opzioni e Assicurazioni') },
    { id: 4, name: t('STEP 4: Pagamento e Conferma') }
  ];

  const renderStepContent = () => {
    // Insurance is now automatic (KASKO BASE included) - no selection UI needed


    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Car Image Preview */}
            <div className="mb-6">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-contain rounded-lg border border-gray-700 bg-gray-800/30"
              />
              <h2 className="text-2xl font-bold text-white mt-3">{item.name}</h2>
              {item.pricePerDay && (
                <p className="text-gray-400 text-sm">Prezzo base: {formatPrice(item.pricePerDay[currency])}/giorno</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">LOCATION SELECTION</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 font-semibold mb-2 block">Luogo di ritiro *</label>
                  {PICKUP_LOCATIONS.map(loc => (
                    <div key={loc.id} className="flex items-start mt-2 p-2 rounded hover:bg-gray-800/30 transition-colors">
                      <input type="radio" id={`pickup-${loc.id}`} name="pickupLocation" value={loc.id} checked={formData.pickupLocation === loc.id} onChange={handleChange} className="w-4 h-4 mt-1 text-white bg-gray-700 border-gray-600 focus:ring-white" />
                      <label htmlFor={`pickup-${loc.id}`} className="ml-2 text-white flex-1">
                        {getTranslated(loc.label)}
                      </label>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-sm text-gray-400 font-semibold mb-2 block">Luogo di riconsegna *</label>
                  {PICKUP_LOCATIONS.map(loc => (
                    <div key={loc.id} className="flex items-start mt-2 p-2 rounded hover:bg-gray-800/30 transition-colors">
                      <input type="radio" id={`return-${loc.id}`} name="returnLocation" value={loc.id} checked={formData.returnLocation === loc.id} onChange={handleChange} className="w-4 h-4 mt-1 text-white bg-gray-700 border-gray-600 focus:ring-white" />
                      <label htmlFor={`return-${loc.id}`} className="ml-2 text-white flex-1">
                        {getTranslated(loc.label)}
                      </label>
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
                    <span className="mr-2"></span> Ritiro del veicolo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Data di ritiro *
                        {formData.pickupDate && (
                          <span className="ml-2 text-xs text-green-400">Selezionata</span>
                        )}
                      </label>
                      <input
                        type="date"
                        name="pickupDate"
                        value={formData.pickupDate}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;

                          if (getDayOfWeek(value) === 0) {
                            alert('Non è possibile ritirare il veicolo di domenica. Siamo chiusi la domenica.\n\nPer favore seleziona un altro giorno.');
                            return;
                          }
                          // Specific Check for Jan 1-4 2026 Closure
                          if (['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'].includes(value)) {
                            alert('Siamo chiusi per ferie. Riapriremo il 5 Gennaio 2026.');
                            return;
                          }
                          if (isHoliday(value)) {
                            alert('Non è possibile ritirare il veicolo nei giorni festivi.\n\nPer favore seleziona un altro giorno.');
                            return;
                          }

                          // Auto-Clear Return Date if Pickup > Return
                          const newPickup = value;
                          const currentReturn = formData.returnDate;

                          if (currentReturn && newPickup > currentReturn) {
                            // Reset return date if it becomes invalid
                            setFormData(prev => ({ ...prev, pickupDate: value, returnDate: '', returnTime: '' }));
                          } else {
                            handleChange(e);
                          }
                        }}
                        min={today}
                        required
                        className={`w-full bg-gray-800 rounded-md px-3 py-2 text-white text-sm border-2 transition-colors cursor-pointer ${errors.pickupDate
                          ? 'border-red-500 focus:border-red-400'
                          : formData.pickupDate
                            ? 'border-green-500 focus:border-green-400'
                            : 'border-gray-700 focus:border-white'
                          }`}
                      />
                      {errors.pickupDate && (
                        <p className="text-xs text-red-400 mt-1 flex items-center">
                          <span className="mr-1"></span> {errors.pickupDate}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ora di ritiro *
                        {formData.pickupTime && (
                          <span className="ml-2 text-xs text-green-400">{formData.pickupTime}</span>
                        )}
                      </label>
                      <select
                        name="pickupTime"
                        value={formData.pickupTime}
                        onChange={handleChange}
                        required
                        disabled={!formData.pickupDate || getValidPickupTimes(formData.pickupDate).length === 0}
                        className={`w-full bg-gray-800 rounded-md px-3 py-2 text-white text-sm border-2 transition-colors ${!formData.pickupDate || getValidPickupTimes(formData.pickupDate).length === 0
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
                    <span className="mr-2"></span> Riconsegna del veicolo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Data di riconsegna *
                        {formData.returnDate && (
                          <span className="ml-2 text-xs text-green-400">Selezionata</span>
                        )}
                      </label>
                      <input
                        type="date"
                        name="returnDate"
                        value={formData.returnDate}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;

                          // Check if selected date is Sunday (0 = Sunday)
                          if (getDayOfWeek(value) === 0) {
                            alert('Non è possibile riconsegnare il veicolo di domenica. Siamo chiusi la domenica.\n\nPer favorere seleziona un altro giorno.');
                            return;
                          }
                          // Specific Check for Jan 1-4 2026 Closure
                          if (['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'].includes(value)) {
                            alert('Siamo chiusi per ferie. Riapriremo il 5 Gennaio 2026.');
                            return;
                          }
                          if (isHoliday(value)) {
                            alert('Non è possibile riconsegnare il veicolo nei giorni festivi.\n\nPer favore seleziona un altro giorno.');
                            return;
                          }

                          // STRICT VALIDATION: Return Date cannot be before Pickup Date
                          if (formData.pickupDate && value < formData.pickupDate) {
                            alert('La data di riconsegna non può essere precedente alla data di ritiro.');
                            return;
                          }

                          handleChange(e);
                        }}
                        min={formData.pickupDate || today}
                        disabled={!formData.pickupDate}
                        required
                        className={`w-full bg-gray-800 rounded-md px-3 py-2 text-white text-sm border-2 transition-colors ${!formData.pickupDate
                          ? 'border-gray-700 opacity-50 cursor-not-allowed'
                          : errors.returnDate || errors.date
                            ? 'border-red-500 focus:border-red-400 cursor-pointer'
                            : formData.returnDate
                              ? 'border-green-500 focus:border-green-400 cursor-pointer'
                              : 'border-gray-700 focus:border-white cursor-pointer'
                          }`}
                      />
                      {(errors.returnDate || errors.date) && (
                        <p className="text-xs text-red-400 mt-1 flex items-center">
                          <span className="mr-1"></span> {errors.returnDate || errors.date}
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
                          className="w-full bg-gray-700 border-2 border-gray-600 rounded-md px-3 py-2 text-white text-sm cursor-not-allowed opacity-75"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <span className="text-gray-400"></span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Ritiro - 1h30 (automatico)</p>
                    </div>
                  </div>

                  {/* Vehicle Availability Check */}
                  {isCheckingAvailability && (
                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
                      <p className="text-blue-300 text-sm">Verifica disponibilità veicolo...</p>
                    </div>
                  )}
                  {availabilityError && (
                    <div className="mt-4 p-4 bg-red-900/30 border-2 border-red-500 rounded-lg">
                      <p className="text-red-300 font-semibold">{availabilityError}</p>
                    </div>
                  )}
                  {partialUnavailabilityWarning && !availabilityError && (
                    <div className="mt-4 p-4 bg-yellow-900/30 border-2 border-yellow-500 rounded-lg">
                      <p className="text-yellow-200 font-semibold">{partialUnavailabilityWarning}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info message about KM */}
            </div>
          </div>
        );
      case 2:
        const renderDriverForm = (driverType: 'main' | 'second') => {
          const driverData = driverType === 'main' ? formData : formData.secondDriver;
          const prefix = driverType === 'main' ? '' : 'secondDriver.';

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-400">Nome *</label><input type="text" name={`${prefix}firstName`} value={(driverData as any).firstName} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-1.5 mt-1 text-white text-sm" />{errors[`${prefix}firstName`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}firstName`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Cognome *</label><input type="text" name={`${prefix}lastName`} value={(driverData as any).lastName} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-1.5 mt-1 text-white text-sm" />{errors[`${prefix}lastName`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}lastName`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Email *</label><input type="email" name={`${prefix}email`} value={(driverData as any).email} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-1.5 mt-1 text-white text-sm" />{errors[`${prefix}email`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}email`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Telefono *</label><input type="tel" name={`${prefix}phone`} value={(driverData as any).phone} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-1.5 mt-1 text-white text-sm" />{errors[`${prefix}phone`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}phone`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Data di nascita *</label><input type="date" name={`${prefix}birthDate`} value={(driverData as any).birthDate} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-1.5 mt-1 text-white text-sm" />{errors[`${prefix}birthDate`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}birthDate`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Numero patente *</label><input type="text" name={`${prefix}licenseNumber`} value={(driverData as any).licenseNumber} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-1.5 mt-1 text-white text-sm" />{errors[`${prefix}licenseNumber`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}licenseNumber`]}</p>}</div>
              <div><label className="text-sm text-gray-400">Data rilascio patente *</label><input type="date" name={`${prefix}licenseIssueDate`} value={(driverData as any).licenseIssueDate} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-1.5 mt-1 text-white text-sm" />{errors[`${prefix}licenseIssueDate`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}licenseIssueDate`]}</p>}</div>
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

              {/* Check if documents are already on file */}
              {(hasStoredDocs.licensePath && hasStoredDocs.idPath) ? (
                <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-4 flex items-center mb-4">
                  <div className="mr-3 bg-green-500/20 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-green-400 font-semibold">Documenti già presenti in archivio</p>
                    <p className="text-sm text-gray-400">Non è necessario caricare nuovamente i documenti.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* License Uploader */}
                  {hasStoredDocs.licensePath ? (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 opacity-75">
                      <p className="text-green-400 text-sm font-medium mb-1">✓ Patente di Guida presente</p>
                      <p className="text-xs text-gray-500">Già in archivio</p>
                    </div>
                  ) : (
                    <>
                      <DocumentUploader
                        title="1. PATENTE DI GUIDA"
                        details={["Solo fronte/retro", "Foto chiara e leggibile", "Formati: JPG, PNG, PDF (max 5MB)"]}
                        onFileChange={(file) => setFormData(prev => ({ ...prev, licenseImage: file }))}
                      />
                      {errors.licenseImage && <p className="text-xs text-red-400 mt-1">{errors.licenseImage}</p>}
                    </>
                  )}

                  {/* ID Uploader */}
                  {hasStoredDocs.idPath ? (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 opacity-75">
                      <p className="text-green-400 text-sm font-medium mb-1">✓ Carta d'Identità presente</p>
                      <p className="text-xs text-gray-500">Già in archivio</p>
                    </div>
                  ) : (
                    <>
                      <DocumentUploader
                        title="2. CARTA D'IDENTITÀ / PASSAPORTO"
                        details={["Documento valido", "Foto chiara e leggibile", "Formati: JPG, PNG, PDF (max 5MB)"]}
                        onFileChange={(file) => setFormData(prev => ({ ...prev, idImage: file }))}
                      />
                      {errors.idImage && <p className="text-xs text-red-400 mt-1">{errors.idImage}</p>}
                    </>
                  )}
                </div>
              )}
            </section>

            {/* Automatic Validation */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">C. AUTOMATIC VALIDATION AND CALCULATION</h3>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
                <p>Età conducente: {driverAgeLocal || '--'} anni</p>
                <p>Anzianità patente: {licenseYearsLocal || '--'} anni</p>
                {licenseYearsLocal < 2 && formData.licenseIssueDate && <p className="text-red-500 font-bold">ATTENZIONE: È richiesta una patente con almeno 2 anni di anzianità per noleggiare.</p>}
              </div>
            </section>

            {/* Second Driver */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">D. SECOND DRIVER (OPTIONAL)</h3>
              <div className="flex items-center">
                <input type="checkbox" name="addSecondDriver" checked={formData.addSecondDriver} onChange={handleChange} id="add-second-driver" className="h-4 w-4 text-white bg-gray-700 border-gray-600 rounded focus:ring-white" />
                <label htmlFor="add-second-driver" className="ml-2 text-white">Aggiungi secondo guidatore (gratuito)</label>
              </div>
              <AnimatePresence>
                {formData.addSecondDriver && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pl-4 border-l-2 border-gray-700">
                    {renderDriverForm('second')}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Security Deposit - Sixt Style */}
            <section className="border-t border-gray-700 pt-6">
              {!isUrbanOrCorporate && (
                <div className="mt-4">
                  <p className="text-base font-semibold text-white mb-3">Sei residente in Sardegna? *</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <input type="radio" id="resident-yes" name="isSardinianResident" checked={formData.isSardinianResident} onChange={() => setFormData(p => ({ ...p, isSardinianResident: true }))} className="w-4 h-4 text-white" />
                      <label htmlFor="resident-yes" className="ml-2 text-white">Sì - Residente in Sardegna</label>
                    </div>
                    <div className="flex items-center">
                      <input type="radio" id="resident-no" name="isSardinianResident" checked={!formData.isSardinianResident} onChange={() => setFormData(p => ({ ...p, isSardinianResident: false }))} className="w-4 h-4 text-white" />
                      <label htmlFor="resident-no" className="ml-2 text-white">No - Non residente</label>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Final Checkbox */}
            <section className="border-t border-gray-700 pt-6">
              <div className="flex items-start">
                <input type="checkbox" name="confirmsInformation" checked={formData.confirmsInformation} onChange={handleChange} id="confirms-information" className="h-4 w-4 mt-1 text-white bg-gray-700 border-gray-600 rounded focus:ring-white" />
                <label htmlFor="confirms-information" className="ml-2 text-white">Dichiaro che i dati inseriti sono veritieri e conformi ai requisiti richiesti.</label>
              </div>
              {errors.confirmsInformation && <p className="text-xs text-red-400 mt-1">{errors.confirmsInformation}</p>}
            </section>
          </div>
        );
      case 3:
        const unlimitedOptions = getUnlimitedKmOptions(item.name);
        const isPremium = isPremiumVehicle(item.name);

        // Check if vehicle requires higher deductible (for urban cars only)
        // Removed old isPremiumUrbanVehicle logic as granular logic handles it better
        // const isPremiumUrbanVehicle = ...


        // Define detailed insurance coverage info
        // Define detailed insurance coverage info
        const displayVehicleType = getVehicleType(item);

        const insuranceDetails: Record<string, { title: string; requirements: string; standard: string }> = {
          KASKO_BASE: {
            title: 'KASKO BASE',
            requirements: displayVehicleType === 'UTILITARIA' || displayVehicleType === 'FURGONE' || displayVehicleType === 'V_CLASS'
              ? 'DISPONIBILE SOLO PER CLIENTI CON ALMENO 3 ANNI DI PATENTE'
              : 'DISPONIBILE SOLO PER CLIENTI CON ALMENO 2 ANNI DI PATENTE', // Supercar logic might differ? User said "Minimo 3 anni obbligatori" generally? No, standard is 3 years now. User said "UNDER 5 ANNI PATENTE (Minimo 3 anni...)"
            standard: displayVehicleType === 'UTILITARIA' ? 'FRANCHIGIA EUR €2.000 + 30% DEL DANNO' // Wait, user said Base Utilitarie €15. Franchise? Standard Base Franchise €2k+30%? Urban standard.
              : displayVehicleType === 'FURGONE' ? 'FRANCHIGIA EUR €2.000 + 30% DEL DANNO'
                : displayVehicleType === 'V_CLASS' ? 'FRANCHIGIA EUR €2.000 + 30% DEL DANNO' // Corporate Fleet uses Urban rules per task
                  : 'FRANCHIGIA EUR €5.000 + 30% DEL DANNO' // Supercar
          },
          KASKO_BLACK: {
            title: 'KASKO BLACK',
            requirements: "DISPONIBILE SOLO PER CLIENTI CON 25 ANNI DI ETA' E 5 ANNI DI PATENTE",
            standard: displayVehicleType === 'SUPERCAR' ? 'FRANCHIGIA EUR €5.000 + 10% DEL DANNO'
              : 'FRANCHIGIA EUR €1.000 + 10% DEL DANNO' // Urban/Other
          },
          KASKO_SIGNATURE: {
            title: 'KASKO SIGNATURE',
            requirements: "DISPONIBILE SOLO PER CLIENTI CON 30 ANNI DI ETA' E 10 ANNI DI PATENTE",
            standard: displayVehicleType === 'SUPERCAR' ? 'FRANCHIGIA EUR €5.000 ( FISSA )'
              : 'FRANCHIGIA EUR €800 ( FISSA )' // Urban/Other
          },
          KASKO_DR7: {
            title: 'DR7',
            requirements: "DISPONIBILE SOLO PER CLIENTI CON 30 ANNI DI ETA' E 10 ANNI DI PATENTE",
            standard: 'FRANCHIGIA EUR €0 ( FISSA )'
          }
        };

        return (
          <div className="space-y-8">
            {/* Insurance is now automatic (KASKO BASE included) - no selection UI */}
            <section>
              <h3 className="text-lg font-bold text-white mb-4">A. ASSICURAZIONE INCLUSA</h3>
              <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
                <p className="text-green-300 font-semibold">✅ KASKO BASE inclusa automaticamente nel prezzo</p>
                <p className="text-sm text-gray-400 mt-2">Copertura completa RCA + KASKO BASE per tutti i veicoli</p>
              </div>
            </section>


            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">B. CHILOMETRI INCLUSI</h3>
              <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors border-green-500 bg-green-500/10`}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">
                      {(isMassimo || displayVehicleType === 'UTILITARIA' || displayVehicleType === 'FURGONE' || displayVehicleType === 'V_CLASS')
                        ? 'Km illimitati GRATIS nel noleggio'
                        : 'Km illimitati inclusi nel noleggio'}
                    </span>
                    <p className="text-sm text-gray-400">Basato sulla durata del noleggio</p>
                  </div>
                  <span className="font-bold text-white">
                    {(isMassimo || displayVehicleType === 'UTILITARIA' || displayVehicleType === 'FURGONE' || displayVehicleType === 'V_CLASS')
                      ? 'Incluso'
                      : formatPrice(0)}
                  </span>
                </div>
              </div>
            </section>

            {/* KM packages removed - all vehicles now have unlimited KM included */}

            {/* === USAGE ZONE SELECTOR === */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-2">C. ZONA DI UTILIZZO *</h3>
              <p className="text-sm text-gray-400 mb-4">
                Seleziona dove utilizzerai il veicolo durante il noleggio.
              </p>

              <div className="space-y-3">
                {/* Option 1: Cagliari e Sud Sardegna */}
                <div
                  className={`p-4 rounded-md border cursor-pointer transition-all ${formData.usageZone === 'CAGLIARI_SUD'
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-gray-700 hover:border-gray-500'
                    }`}
                  onClick={() => setFormData(p => ({ ...p, usageZone: 'CAGLIARI_SUD' }))}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="usageZone"
                      value="CAGLIARI_SUD"
                      checked={formData.usageZone === 'CAGLIARI_SUD'}
                      onChange={() => setFormData(p => ({ ...p, usageZone: 'CAGLIARI_SUD' }))}
                      className="w-4 h-4 text-yellow-400"
                    />
                    <label className="ml-3 text-white font-semibold">
                      Cagliari e Sud Sardegna
                    </label>
                  </div>
                  <p className="ml-7 text-xs text-gray-400 mt-1">
                    Utilizzo limitato all'area di Cagliari e provincia del Sud Sardegna
                  </p>
                </div>

                {/* Option 2: Fuori zona */}
                <div
                  className={`p-4 rounded-md border transition-all ${formData.usageZone === 'FUORI_ZONA'
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-gray-700 hover:border-gray-500'
                    } ${usageZoneError ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => {
                    const userResidencyZone = (user as any)?.residencyZone || 'NON_RESIDENTE';
                    const isResident = userResidencyZone === 'RESIDENTE_CAGLIARI_SUD_SARDEGNA';

                    // Allow non-residents to select, block residents
                    if (!isResident) {
                      setFormData(p => ({ ...p, usageZone: 'FUORI_ZONA' }));
                    }
                  }}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="usageZone"
                      value="FUORI_ZONA"
                      checked={formData.usageZone === 'FUORI_ZONA'}
                      disabled={!!usageZoneError}
                      onChange={() => {
                        const userResidencyZone = (user as any)?.residencyZone || 'NON_RESIDENTE';
                        const isResident = userResidencyZone === 'RESIDENTE_CAGLIARI_SUD_SARDEGNA';
                        if (!isResident) {
                          setFormData(p => ({ ...p, usageZone: 'FUORI_ZONA' }));
                        }
                      }}
                      className="w-4 h-4 text-yellow-400"
                    />
                    <label className="ml-3 text-white font-semibold">
                      Fuori zona (resto della Sardegna / Italia)
                    </label>
                  </div>
                  <p className="ml-7 text-xs text-gray-400 mt-1">
                    Utilizzo al di fuori dell'area di Cagliari e Sud Sardegna
                  </p>
                </div>

                {/* Error message for residents trying to select Fuori zona */}
                {usageZoneError && (
                  <div className="mt-3 p-4 bg-red-900/30 border-2 border-red-500 rounded-lg">
                    <p className="text-red-300 font-semibold text-sm">
                      ⚠️ {usageZoneError}
                    </p>
                  </div>
                )}

                {/* Validation error if no zone selected */}
                {errors.usageZone && (
                  <p className="text-xs text-red-400 mt-2 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.usageZone}
                  </p>
                )}
              </div>
            </section>

            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-2">C. SERVIZI AGGIUNTIVI</h3>
              <p className="text-sm text-gray-400 mb-4">
                Aggiungi servizi extra per un viaggio più confortevole e sicuro.
              </p>
              <div className="space-y-3">
                {/* Mandatory car wash */}
                <div className="flex items-center p-3 bg-gray-800/50 rounded-md border border-gray-700">
                  <input type="checkbox" checked disabled className="h-4 w-4" />
                  <span className="ml-3 text-white">LAVAGGIO COMPLETO [OBBLIGATORIO]</span>
                  <span className="ml-auto font-semibold text-white">€30</span>
                </div>

                {/* Rental Extras from constants */}
                {RENTAL_EXTRAS.filter(extra => !extra.autoApply && extra.id !== 'additional_driver').map(extra => {
                  const isSelected = formData.extras.includes(extra.id);
                  const priceDisplay = extra.oneTime
                    ? `€${extra.pricePerDay.eur}`
                    : `€${extra.pricePerDay.eur}/giorno`;

                  return (
                    <div
                      key={extra.id}
                      className={`p-3 rounded-md border cursor-pointer transition-all ${isSelected
                        ? 'border-white bg-white/5'
                        : 'border-gray-700 hover:border-gray-500'
                        }`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          extras: isSelected
                            ? prev.extras.filter(id => id !== extra.id)
                            : [...prev.extras, extra.id]
                        }));
                      }}
                    >
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => { }}
                          className="h-4 w-4 mt-1 text-white"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium">{getTranslated(extra.label)}</span>
                            <span className="font-semibold text-white">{priceDisplay}</span>
                          </div>
                          {extra.description && (
                            <p className="text-xs text-gray-400 mt-1">{getTranslated(extra.description)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-white mb-4">METODO DI PAGAMENTO</h3>
              <div className="flex border-b border-gray-700 mb-6">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'credit' }))}
                  className={`flex-1 py-2 text-sm font-semibold ${formData.paymentMethod === 'credit' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                >
                  Credit Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'stripe' }))}
                  className={`flex-1 py-2 text-sm font-semibold ${formData.paymentMethod === 'stripe' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                >
                  Carta
                </button>
              </div>

              {formData.paymentMethod === 'credit' ? (
                <div className="text-center py-6">
                  {isLoadingBalance ? (
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-t-white border-gray-600 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-400 mb-2">Saldo Disponibile</p>
                      <p className="text-4xl font-bold text-white mb-4">€{creditBalance.toFixed(2)}</p>
                      {creditBalance < total ? (
                        <p className="text-sm text-red-400">Credito insufficiente. Richiesto: €{total.toFixed(2)}</p>
                      ) : (
                        <p className="text-sm text-green-400">✓ Saldo sufficiente</p>
                      )}
                    </>
                  )}
                  {stripeError && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                      <p className="text-sm text-red-400 text-center">{stripeError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <h4 className="text-base font-semibold text-white mb-3">DATI CARTA DI CREDITO/DEBITO</h4>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-h-[56px] flex items-center">
                    {isClientSecretLoading ? <div className="text-gray-400 text-sm">Initializing Payment...</div> : <div ref={cardElementRef} className="w-full" />}
                  </div>
                  {stripeError && <p className="text-xs text-red-400 mt-1">{stripeError}</p>}
                </>
              )}
            </section>

            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4 uppercase">Conferme Finali</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-start">
                    <input id="confirms-documents" name="confirmsDocuments" type="checkbox" checked={formData.confirmsDocuments} onChange={handleChange} className="h-4 w-4 mt-1 rounded border-gray-600 bg-gray-700 text-white focus:ring-white" />
                    <label htmlFor="confirms-documents" className="ml-3 block text-sm font-medium text-white">
                      Confermo che i documenti caricati sono corretti e appartengono al conducente principale.
                    </label>
                  </div>
                  {errors.confirmsDocuments && <p className="text-xs text-red-400 mt-1 pl-7">{errors.confirmsDocuments}</p>}
                </div>
                <div>
                  <div className="flex items-start">
                    <input id="agrees-to-terms" name="agreesToTerms" type="checkbox" checked={formData.agreesToTerms} onChange={handleChange} className="h-4 w-4 mt-1 rounded border-gray-600 bg-gray-700 text-white focus:ring-white" />
                    <label htmlFor="agrees-to-terms" className="ml-3 block text-sm font-medium text-white">
                      Ho letto e accetto i <Link to="/rental-agreement" target="_blank" className="underline hover:text-white">termini e le condizioni di noleggio</Link>.
                    </label>
                  </div>
                  {errors.agreesToTerms && <p className="text-xs text-red-400 mt-1 pl-7">{errors.agreesToTerms}</p>}
                </div>
                <div>
                  <div className="flex items-start">
                    <input id="agrees-to-privacy" name="agreesToPrivacy" type="checkbox" checked={formData.agreesToPrivacy} onChange={handleChange} className="h-4 w-4 mt-1 rounded border-gray-600 bg-gray-700 text-white focus:ring-white" />
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
                  <hr className="border-gray-600 mb-2" />
                  <p>{item.name}</p>
                </div>

                <div>
                  <p className="font-bold text-base text-white mb-2">DATE E LOCALITÀ</p>
                  <hr className="border-gray-600 mb-2" />
                  <p>Ritiro: {formData.pickupDate} alle {formData.pickupTime} - {getTranslated(PICKUP_LOCATIONS.find(l => l.id === formData.pickupLocation)?.label)}</p>
                  <p>Riconsegna: {formData.returnDate} alle {formData.returnTime} - {getTranslated(PICKUP_LOCATIONS.find(l => l.id === formData.returnLocation)?.label)}</p>
                  <p>Durata: {duration.days} giorni</p>
                  <p>Pacchetto km: {(formData.kmPackageType === 'unlimited' || includedKm >= 9999) ? 'ILLIMITATI' : `${includedKm} km`}</p>
                </div>

                <div>
                  <p className="font-bold text-base text-white mb-2">CONDUCENTE/I</p>
                  <hr className="border-gray-600 mb-2" />
                  <p>Principale: {formData.firstName} {formData.lastName}</p>
                  <p className="text-xs text-gray-400">{formData.email} - {formData.phone}</p>
                  <p className="text-xs text-gray-400">{driverAge} anni - Patente: {licenseYears} anni</p>
                  {(formData.licenseImage || formData.idImage) && <p className="text-xs text-green-400">Documenti caricati</p>}
                  {formData.addSecondDriver && (
                    <div className="mt-2">
                      <p>Secondo: {formData.secondDriver.firstName} {formData.secondDriver.lastName}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-bold text-base text-white mb-2">ASSICURAZIONE E SERVIZI</p>
                  <hr className="border-gray-600 mb-2" />
                  <p>Assicurazione: KASKO BASE (inclusa)</p>
                  <p>Lavaggio completo obbligatorio</p>
                  {formData.addSecondDriver && <p>Secondo guidatore</p>}
                </div>

                <div>
                  <p className="font-bold text-base text-white mb-2">DETTAGLIO COSTI</p>
                  <hr className="border-gray-600 mb-2" />
                  <div className="flex justify-between">
                    <span>
                      Noleggio ({duration.days} gg {isMassimo ? `× €${Math.round(rentalCost / duration.days)} [FISSO]` : `× ${item.pricePerDay ? formatPrice(item.pricePerDay[currency]) : '€0'}`})
                    </span>
                    <span>{formatPrice(rentalCost)}</span>
                  </div>
                  <div className="flex justify-between"><span>Pacchetto km ({(formData.kmPackageType === 'unlimited' || includedKm >= 9999) ? 'illimitati' : `${includedKm} km`})</span> <span>{formatPrice(kmPackageCost)}</span></div>
                  <div className="flex justify-between"><span className="notranslate">Assicurazione {formData.insuranceOption?.replace(/_/g, ' ') || 'KASKO'}</span> <span>{formatPrice(insuranceCost)}</span></div>
                  {/* Lavaggio is now included in the price - no additional fee */}
                  <div className="flex justify-between"><span>Spese di ritiro</span> <span>{formatPrice(pickupFee)}</span></div>
                  <div className="flex justify-between"><span>Spese di riconsegna</span> <span>{formatPrice(dropoffFee)}</span></div>
                  {secondDriverFee > 0 && <div className="flex justify-between"><span>Secondo guidatore ({duration.days} gg × €10)</span> <span>{formatPrice(secondDriverFee)}</span></div>}
                  {youngDriverFee > 0 && <div className="flex justify-between"><span>Supplemento under 25 ({duration.days} gg × €10)</span> <span>{formatPrice(youngDriverFee)}</span></div>}
                  {recentLicenseFee > 0 && <div className="flex justify-between"><span>Supplemento patente recente ({duration.days} gg × €20)</span> <span>{formatPrice(recentLicenseFee)}</span></div>}
                  <hr className="border-gray-500 my-2" />

                  {isMassimo && (
                    <div className="mb-2 p-2 bg-blue-900/30 border border-blue-500/30 rounded">
                      <p className="text-blue-200 font-semibold text-center text-xs uppercase mb-1">★ Cliente Speciale Massimo Runchina ★</p>
                      {specialDiscountAmount > 0 ? (
                        <div className="flex justify-between text-green-400 font-bold">
                          <span>Sconto Fedeltà (10% dopo 3gg)</span>
                          <span>-{formatPrice(specialDiscountAmount)}</span>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-xs text-center">Tariffa fissa €305/gg applicata</p>
                      )}
                    </div>
                  )}

                  {membershipDiscount > 0 ? (
                    <>
                      <div className="flex justify-between text-gray-400 line-through"><span>Totale</span> <span>{formatPrice(originalTotal)}</span></div>
                      <div className="flex justify-between text-green-400 text-sm">
                        <span>Sconto {membershipTier} ({(membershipDiscount / originalTotal * 100).toFixed(0)}%)</span>
                        <span>-{formatPrice(membershipDiscount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-white"><span>TOTALE</span> <span>{formatPrice(finalTotal)}</span></div>
                    </>
                  ) : (
                    <div className="flex justify-between font-bold text-lg"><span>TOTALE</span> <span>{formatPrice(total)}</span></div>
                  )}
                </div>

                {/* Maggiori informazioni */}
                <div className="border-t border-gray-600 pt-3">
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-gray-300 hover:text-white flex items-center gap-2 font-semibold">
                      <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                      Maggiori informazioni
                    </summary>
                    <div className="mt-3 pl-4 space-y-3 border-l-2 border-gray-600">
                      <div>
                        {isPremiumVehicle(item.name) ? (
                          <>
                            <p className="text-sm text-gray-300">
                              Al Check-in vi verrà richiesto un deposito cauzionale di 5000€
                            </p>
                            <p className="text-sm text-gray-300 mt-2">
                              O un veicolo dal 2020 in poi di proprietà in buone condizioni,con un supplemento di servizio di 20€ al gg
                            </p>
                            <p className="text-sm text-gray-300 mt-2">
                              Non residente in sardegna 10.000€
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-300">
                              {formData.insuranceOption === 'RCA' && 'Cauzione: 2000€'}
                              {/* Deposit display - now dynamic based on loyalty and license years */}
                              {isLoyalCustomer && 'Cauzione: €0 (Cliente Fedele)'}
                              {!isLoyalCustomer && formData.insuranceOption === 'KASKO_DR7' && 'Cauzione: €0 (Nessun deposito richiesto)'}
                              {!isLoyalCustomer && formData.insuranceOption !== 'KASKO_DR7' && `Cauzione: ${formatDeposit(getDeposit())}`}
                              {formData.insuranceOption === 'KASKO_DR7' && 'Cauzione: 0€ (Nessun deposito richiesto)'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </details>
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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
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

      <div className="w-full max-w-lg mx-auto mb-12 px-4">
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

      <div className={step === 4 ? "lg:grid lg:grid-cols-3 lg:gap-8 px-4" : "px-4"}>
        {step === 4 && (
          <aside className="lg:col-span-1 lg:sticky lg:top-32 self-start mb-8 lg:mb-0">
            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-4">RIEPILOGO COSTI</h2>
              <img src={item.image} alt={item.name} className="w-full h-40 object-contain rounded-md mb-4 bg-gray-800/30" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Durata noleggio:</span><span className="text-white font-medium">{duration.days} giorni</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Km pacchetto:</span>
                  <span className="text-white font-medium">
                    {(formData.kmPackageType === 'unlimited' || includedKm >= 9999) ? 'ILLIMITATI' : `${includedKm} km`}
                  </span>
                </div>

                <div className="border-t border-gray-700 my-2"></div>

                <div className="flex justify-between"><span className="text-gray-400">Noleggio {item.name}</span><span className="text-white font-medium">{formatPrice(rentalCost)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Pacchetto chilometrici</span><span className="text-white font-medium">{formatPrice(kmPackageCost)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 notranslate">Assicurazione {formData.insuranceOption?.replace(/_/g, ' ') || 'KASKO'}</span><span className="text-white font-medium">{formatPrice(insuranceCost)}</span></div>
                {/* Lavaggio is now included in the price - no additional fee */}
                <div className="flex justify-between"><span className="text-gray-400">Spese di ritiro</span><span className="text-white font-medium">{formatPrice(pickupFee)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Spese di riconsegna</span><span className="text-white font-medium">{formatPrice(dropoffFee)}</span></div>
                {secondDriverFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Secondo guidatore</span><span className="text-white font-medium">{formatPrice(secondDriverFee)}</span></div>}
                {youngDriverFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Supplemento under 25</span><span className="text-white font-medium">{formatPrice(youngDriverFee)}</span></div>}
                {recentLicenseFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Supplemento patente recente</span><span className="text-white font-medium">{formatPrice(recentLicenseFee)}</span></div>}

                <div className="border-t border-white/20 my-2"></div>

                {membershipDiscount > 0 ? (
                  <>
                    <div className="flex justify-between text-gray-400 line-through text-sm"><span>Totale</span><span>{formatPrice(originalTotal)}</span></div>
                    <div className="flex justify-between text-green-400 text-sm">
                      <span>Sconto {membershipTier}</span>
                      <span>-{formatPrice(membershipDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold"><span className="text-white">TOTALE</span><span className="text-white">{formatPrice(finalTotal)}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between text-xl font-bold"><span className="text-white">TOTALE</span><span className="text-white">{formatPrice(total)}</span></div>
                )}
              </div>
            </div>
          </aside>
        )}

        <main className={step === 4 ? "lg:col-span-2" : ""}>
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900/50 p-4 sm:p-6 md:p-8 rounded-lg border border-gray-800 relative"
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {errors.form && (
              <div className="mt-4 text-center p-3 rounded-md border border-red-500 bg-red-500/10 text-red-400">
                <p>{errors.form}</p>
              </div>
            )}

            <div className="flex justify-between gap-4 mt-8">
              <button type="button" onClick={handleBack} disabled={step === 1} className="px-4 sm:px-8 py-3 bg-gray-700 text-white text-sm sm:text-base font-bold rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('Back')}</button>
              {step < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 sm:px-8 py-3 bg-white text-black text-sm sm:text-base font-bold rounded-full hover:bg-gray-200 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={(licenseYears < 2 && step === 2) || (step === 2 && !formData.confirmsInformation)}
                >
                  Continua
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isProcessing || !formData.agreesToTerms || !formData.agreesToPrivacy || !formData.confirmsDocuments}
                  className="px-4 sm:px-8 py-3 bg-white text-black text-sm sm:text-base font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'CONFERMA PRENOTAZIONE'}
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
