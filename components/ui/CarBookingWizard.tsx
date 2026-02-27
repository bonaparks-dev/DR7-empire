import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../contexts/CurrencyContext';
import { isMassimoRunchina, SPECIAL_CLIENTS } from '../../utils/clientPricingRules';
import { calculateMultiDayPrice } from '../../utils/multiDayPricing';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import { PICKUP_LOCATIONS, AUTO_INSURANCE, INSURANCE_DEDUCTIBLES, RENTAL_EXTRAS, DEPOSIT_RULES } from '../../constants';
import type { Booking, RentalItem } from '../../types';
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
import { roundToTwoDecimals, eurosToCents } from '../../utils/pricing';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { URBAN_SERVICES, MAXI_SERVICES, EXTRA_CARE_SERVICES, EXPERIENCE_SERVICES } from '../../pages/CarWashServicesPage';
import type { WashService } from '../../pages/CarWashServicesPage';
import { classifyVehicle } from '../../utils/vehicleClassification';
import { lookupTarga, isValidItalianPlate, normalizePlate, type TargaResult } from '../../utils/lookupTarga';

// Filter out dummy/placeholder names from auth profiles (e.g. "No Name", "User", "Test")
const DUMMY_NAMES = ['no name', 'no-name', 'noname', 'user', 'test', 'unknown', 'n/a', 'none', 'cliente'];
const isRealName = (name: string | null | undefined): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  if (DUMMY_NAMES.includes(trimmed.toLowerCase())) return '';
  return trimmed;
};

// All extra/add-on services available in the wash upsell (exclude Cortesia)
const UPSELL_EXTRAS = [...EXTRA_CARE_SERVICES, ...EXPERIENCE_SERVICES].filter(s => s.id !== 'extra-courtesy');

const FUNCTIONS_BASE =
  import.meta.env.VITE_FUNCTIONS_BASE ??
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:8888'
    : window.location.origin);

// Nexi payment integration

type KaskoTier = 'KASKO' | 'KASKO_BLACK' | 'KASKO_SIGNATURE';

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

const createItalyDateTime = (dateStr: string, timeStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const checkDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const italyFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    hour12: false
  });
  const italyNoonHour = parseInt(italyFormatter.format(checkDate));
  const italyOffset = italyNoonHour - 12;
  return new Date(Date.UTC(year, month - 1, day, hours - italyOffset, minutes, 0, 0));
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
  const isUrbanOrCorporate = vehicleType === 'UTILITARIA' || vehicleType === 'FURGONE' || vehicleType === 'V_CLASS';

  // Utilitarie availability deadline - last availability March 25th 2026
  const UTILITARIE_MAX_DATE = '2026-03-25';
  const isUtilitaria = vehicleType === 'UTILITARIA';

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const today = useMemo(() => {
    // Get today's date in Italy timezone (Europe/Rome)
    const italyDate = new Date().toLocaleString('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' });
    return italyDate.split(',')[0]; // Returns YYYY-MM-DD format
  }, []);

  const [formData, setFormData] = useState(() => {
    return {
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
        licenseExpiryDate: '',
        countryOfIssue: '',
        licenseImage: null as File | string | null,
        idImage: null as File | string | null,
      },

      // Step 3
      insuranceOption: 'KASKO',
      depositOption: '' as '' | 'with_deposit' | 'no_deposit',
      extras: [] as string[],
      kmPackageType: 'unlimited' as 'none' | 'unlimited' | '50km', // 'none' = only free included km, '50km' = 50km/day supercar package
      kmPackageDistance: 100, // default 100km package
      expectedKm: 0, // user's expected distance for recommendation
      usageZone: '' as 'CAGLIARI_SUD' | 'FUORI_ZONA' | '', // Will be set by useEffect after user data loads

      // Step 4
      paymentMethod: 'nexi' as 'nexi' | 'credit',
      agreesToTerms: false,
      agreesToPrivacy: false,
      confirmsDocuments: false,
    };
  });




  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedInsurance, setExpandedInsurance] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [partialUnavailabilityWarning, setPartialUnavailabilityWarning] = useState<string | null>(null);
  const [shortSlotWarning, setShortSlotWarning] = useState<string | null>(null); // Warning for short availability slots
  const [availableVehicleName, setAvailableVehicleName] = useState<string | null>(null);
  const [usageZoneError, setUsageZoneError] = useState<string | null>(null); // Error for resident blocking
  const [showZoneConfirmation, setShowZoneConfirmation] = useState(false); // Zone confirmation modal

  // Wash upsell state
  const [showWashUpsell, setShowWashUpsell] = useState(false);
  const [selectedUpsellWash, setSelectedUpsellWash] = useState<WashService | null>(null);
  const [selectedUpsellExtras, setSelectedUpsellExtras] = useState<WashService[]>([]);
  const [upsellCarInput, setUpsellCarInput] = useState('');
  const [upsellCarCategory, setUpsellCarCategory] = useState<'urban' | 'maxi' | null>(null);
  const [upsellCarModel, setUpsellCarModel] = useState<string | null>(null);

  // Wash upsell targa state
  const [upsellTargaInput, setUpsellTargaInput] = useState('');
  const [upsellTargaLoading, setUpsellTargaLoading] = useState(false);
  const [upsellTargaError, setUpsellTargaError] = useState<string | null>(null);
  const [upsellTargaResult, setUpsellTargaResult] = useState<TargaResult | null>(null);
  const [upsellTargaManualCategory, setUpsellTargaManualCategory] = useState<'urban' | 'maxi' | null>(null);

  // Single source of truth for availability
  const [earliestAvailability, setEarliestAvailability] = useState<{
    isAvailable: boolean;
    earliestAvailableDate?: string;
    earliestAvailableTime?: string;
    earliestAvailableDatetime?: string;
  } | null>(null);

  // Availability windows for gap detection
  interface AvailabilityWindow {
    start: string; // ISO timestamp
    end: string;
  }
  const [availabilityWindows, setAvailabilityWindows] = useState<AvailabilityWindow[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<AvailabilityWindow | null>(null);
  const [isLoadingWindows, setIsLoadingWindows] = useState(false);
  const [hasBusyPeriods, setHasBusyPeriods] = useState(false); // Track if there are actual bookings

  // Credit wallet state
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Customer loyalty state (for deposit calculation)
  const [customerRentalCount, setCustomerRentalCount] = useState<number>(0);
  const [isLoyalCustomer, setIsLoyalCustomer] = useState<boolean>(false);

  // Nexi payment state
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Birthday discount code state
  const [discountCode, setDiscountCode] = useState<string>('');
  const [discountCodeError, setDiscountCodeError] = useState<string | null>(null);
  const [discountCodeValid, setDiscountCodeValid] = useState<boolean>(false);
  const [isValidatingCode, setIsValidatingCode] = useState<boolean>(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    type: 'rental' | 'car_wash' | 'fixed' | 'percentage';
    code_type?: 'birthday' | 'marketing' | 'codice_sconto' | 'gift_card';
  } | null>(null);

  // Camera
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isSubmittingRef = useRef(false);

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

  // Auto-set km package based on vehicle type
  useEffect(() => {
    const vType = getVehicleType(item, categoryContext);
    if (vType === 'SUPERCAR') {
      // Supercars default to 50km/day package at €149/day
      setFormData(prev => ({
        ...prev,
        kmPackageType: '50km'
      }));
    } else {
      // Urban/utility/corporate vehicles get unlimited km
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
        const res = await fetchWithTimeout(`${FUNCTIONS_BASE}/.netlify/functions/health`, { method: 'GET' });
        if (!res.ok) console.warn('Functions health not OK:', res.status, res.statusText);
        else console.log('Functions health: OK');
      } catch (e) {
        console.error('Functions not reachable at', FUNCTIONS_BASE, e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch availability windows for gap detection
  useEffect(() => {
    const fetchAvailabilityWindows = async () => {
      // Only fetch if we have vehicle IDs
      const vehicleIds = item.vehicleIds || (item.id ? [item.id.replace('car-', '')] : []);
      if (vehicleIds.length === 0) return;

      setIsLoadingWindows(true);
      try {
        const response = await fetchWithTimeout(`${FUNCTIONS_BASE}/.netlify/functions/getAvailabilityWindows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleIds,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          })
        });

        if (response.ok) {
          const data = await response.json();

          // Filter out same-day availability windows that start after office hours
          const now = new Date();
          const filteredWindows = (data.freeWindows || []).filter(window => {
            const windowStart = new Date(window.start);

            // Check if window starts today
            const isToday = windowStart.toDateString() === now.toDateString();

            if (!isToday) {
              // Future dates are always valid
              return true;
            }

            // For same-day windows, check if start time is after office hours
            const hour = windowStart.getHours();
            const minute = windowStart.getMinutes();
            const timeInMinutes = hour * 60 + minute;

            // Office closing time: 18:30 (last pickup time)
            const officeClosingTime = 18 * 60 + 30; // 18:30

            // If same-day availability starts after office hours, exclude it
            // (it will show as next-day availability instead)
            if (timeInMinutes > officeClosingTime) {
              return false;
            }

            return true;
          });

          setAvailabilityWindows(filteredWindows);
          // Only show blue box if there are actual busy periods (not just "fully available")
          const busyIntervals = data.busyIntervals || [];
          setHasBusyPeriods(busyIntervals.length > 0);
          console.log('Fetched availability windows:', data);
          console.log('Filtered windows (excluded after-hours same-day):', filteredWindows);
          console.log('Has busy periods:', busyIntervals.length > 0);
        } else {
          console.error('Failed to fetch availability windows:', response.status);
        }
      } catch (error) {
        console.error('Error fetching availability windows:', error);
      } finally {
        setIsLoadingWindows(false);
      }
    };

    fetchAvailabilityWindows();
  }, [item.id, item.vehicleIds]);

  // Fetch credit balance with safe fallback
  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.id) {
        setIsLoadingBalance(true);
        try {
          const balance = await getUserCreditBalance(user.id);
          setCreditBalance(balance);
        } catch (error) {
          // Enhanced error logging with full diagnostics
          const ua = navigator.userAgent;
          const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
          const isSafari = /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor);

          console.error('Error fetching credit balance (detailed diagnostics):', {
            // Request info
            requestUrl: '[credit balance endpoint]',
            userId: user.id,

            // Error details
            errorMessage: (error as Error).message,
            errorName: (error as Error).name,
            errorStack: (error as Error).stack,

            // Network info
            networkOnline: navigator.onLine,

            // Browser info
            browser: isChrome ? 'Chrome' : isSafari ? 'Safari' : 'Other',
            userAgent: ua,

            // Timestamp
            timestamp: new Date().toISOString(),

            // Error type indicators
            possibleHTTP2Error: (error as Error).message?.includes('HTTP2') || (error as Error).message?.includes('ERR_'),
          });
          // Safe default: set balance to 0 if fetch fails
          setCreditBalance(0);
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
        return;
      }

      try {
        // Count completed car rentals for loyalty deposit waiver
        const { count, error } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('customer_email', email)
          .eq('status', 'completed')
          .eq('vehicle_type', 'car');

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

  // Usage zone validation removed - pricing is now based on usage zone selection only
  // Users can freely select CAGLIARI_SUD (resident pricing) or FUORI_ZONA (non-resident pricing)



  // Helper function to get day of week without timezone issues

  // Initialize dates from first availability window
  // DISABLED - was auto-resetting dates, confusing users
  /*
  useEffect(() => {
    if (availabilityWindows.length > 0) {
      const firstWindow = availabilityWindows[0];
      const start = new Date(firstWindow.start);
      const end = new Date(Math.min(
        new Date(firstWindow.end).getTime(),
        start.getTime() + 24 * 60 * 60 * 1000 // Default to +1 day
      ));

      // Only set if not already set or if current dates are invalid
      if (!formData.pickupDate || formData.pickupDate < start.toISOString().split('T')[0]) {
        setFormData(prev => ({
          ...prev,
          pickupDate: start.toISOString().split('T')[0],
          pickupTime: start.toTimeString().slice(0, 5),
          returnDate: end.toISOString().split('T')[0],
          returnTime: end.toTimeString().slice(0, 5)
        }));
      }
    }
  }, [availabilityWindows]);
  */

  // Validate return date is after pickup date
  // DISABLED - was auto-adjusting, confusing users
  /*
  useEffect(() => {
    if (formData.pickupDate && formData.returnDate && formData.pickupTime && formData.returnTime) {
      const pickup = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
      const returnDt = new Date(`${formData.returnDate}T${formData.returnTime}`);

      if (returnDt <= pickup) {
        // Auto-fix: set return to pickup + 1 day
        const nextDay = new Date(pickup);
        nextDay.setDate(nextDay.getDate() + 1);
        setFormData(prev => ({
          ...prev,
          returnDate: nextDay.toISOString().split('T')[0],
          returnTime: formData.pickupTime
        }));
      }
    }
  }, [formData.pickupDate, formData.pickupTime, formData.returnDate, formData.returnTime]);
  */

  // Validate dates are within availability windows
  // DISABLED - was auto-adjusting dates, confusing users
  /*
  useEffect(() => {
    if (availabilityWindows.length === 0) return;
    if (!formData.pickupDate || !formData.returnDate) return;

    const pickup = new Date(`${formData.pickupDate}T${formData.pickupTime || '10:00'}`);
    const returnDt = new Date(`${formData.returnDate}T${formData.returnTime || '10:00'}`);

    // Find window that contains pickup
    const window = availabilityWindows.find(w => {
      const start = new Date(w.start);
      const end = new Date(w.end);
      return pickup >= start && pickup <= end;
    });

    if (!window) {
      // Pickup is outside all windows - auto-adjust to first window
      const firstWindow = availabilityWindows[0];
      const windowStart = new Date(firstWindow.start);
      setFormData(prev => ({
        ...prev,
        pickupDate: windowStart.toISOString().split('T')[0],
        pickupTime: windowStart.toTimeString().slice(0, 5)
      }));
      return;
    }

    // Check if return is in same window
    const windowEnd = new Date(window.end);
    if (returnDt > windowEnd) {
      // Return exceeds window - cap it at window end
      setFormData(prev => ({
        ...prev,
        returnDate: windowEnd.toISOString().split('T')[0],
        returnTime: windowEnd.toTimeString().slice(0, 5)
      }));
    }
  }, [formData.pickupDate, formData.pickupTime, formData.returnDate, formData.returnTime, availabilityWindows]);
  */

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

    // Office hours with 15-minute intervals
    // Mon-Fri: Morning 10:30-12:30, Afternoon 17:30-18:30
    // Saturday: Morning only 10:30-13:30 (closed at 14:00, no afternoon)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Monday to Friday
      addTimes(10 * 60 + 30, 12 * 60 + 30, 15);  // 10:30 to 12:30
      addTimes(17 * 60 + 30, 18 * 60 + 30, 15);  // 17:30 to 18:30
    } else if (dayOfWeek === 6) {
      // Saturday - morning only (close at 14:00)
      addTimes(10 * 60 + 30, 13 * 60 + 30, 15);  // 10:30 to 13:30
    }

    const selectedDate = safeDate(date);
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    // Filter out past times if the selected date is today
    let filteredTimes = times;
    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      // Add 1 hour buffer (60 minutes) to allow preparation time
      const minTimeInMinutes = currentTimeInMinutes + 60;

      filteredTimes = times.filter(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        return timeInMinutes >= minTimeInMinutes;
      });
    }

    return filteredTimes;
  };

  const getValidReturnTimes = (date: string): string[] => {
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

    // RETURN (Check-out) hours - DIFFERENT from pickup
    // Mon-Fri: 09:00-11:00, 16:00-17:00
    // Saturday: 09:00-12:00
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Monday to Friday
      addTimes(9 * 60, 11 * 60, 15);   // 09:00 to 11:00
      addTimes(16 * 60, 17 * 60, 15);  // 16:00 to 17:00
    } else if (dayOfWeek === 6) {
      // Saturday
      addTimes(9 * 60, 12 * 60, 15);   // 09:00 to 12:00
    }

    // Filter out past times if today
    const selectedDate = safeDate(date);
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    let filteredTimes = times;
    if (isToday) {
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
      filteredTimes = times.filter(time => {
        const [hours, minutes] = time.split(':').map(Number);
        return (hours * 60 + minutes) >= currentTimeInMinutes;
      });
    }

    // If no pickup date/time set, return empty array
    // User must select pickup before selecting return
    if (!formData.pickupDate || !formData.pickupTime) {
      return [];
    }

    // Server-side conflict check (checkVehicleAvailability) handles real conflicts
    // Allow all valid return times based on office hours
    const pickup = new Date(`${formData.pickupDate}T${formData.pickupTime}`);

    // Allow any return time as long as it's after pickup datetime
    // Calendar day billing means no need to restrict return time based on pickup time
    return filteredTimes.filter(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const returnDt = new Date(date);
      returnDt.setHours(hours, minutes, 0, 0);
      return returnDt > pickup;
    });
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

  // AUTOFILL USER DATA FROM PROFILE with safe fallback
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        // Fetch customer data via Netlify Function (with auth token)
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const fetchHeaders: Record<string, string> = {};
        if (authSession?.access_token) {
          fetchHeaders['Authorization'] = `Bearer ${authSession.access_token}`;
        }
        const response = await fetch(`/.netlify/functions/getResidencyZone?user_id=${user.id}`, { headers: fetchHeaders });
        const customerData = response.ok ? await response.json() : null;
        const error = !response.ok ? new Error(`HTTP ${response.status}`) : null;

        if (error || !customerData) {
          if (error) {
            // Enhanced error logging with full diagnostics
            const ua = navigator.userAgent;
            const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
            const isSafari = /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor);

            console.warn('Unable to fetch customer data from customers_extended (detailed diagnostics):', {
              // Request info
              requestUrl: '[customers_extended endpoint]',
              userId: user.id,

              // Error details
              errorMessage: error.message,
              errorName: error.name,
              errorCode: error.code,
              errorDetails: error.details,
              errorHint: error.hint,
              errorStack: error.stack,

              // Network info
              networkOnline: navigator.onLine,

              // Browser info
              browser: isChrome ? 'Chrome' : isSafari ? 'Safari' : 'Other',
              userAgent: ua,

              // Timestamp
              timestamp: new Date().toISOString(),

              // Error type indicators
              possibleHTTP2Error: error.message?.includes('HTTP2') || error.message?.includes('ERR_'),
              possibleCORS: error.message?.includes('CORS') || error.message?.includes('blocked'),
            });
          }
          // If no extended profile, at least try to fill basic info from Auth Context if available
          const realName1 = isRealName(user.fullName);
          setFormData(prev => ({
            ...prev,
            firstName: prev.firstName || (realName1 ? realName1.split(' ')[0] : ''),
            lastName: prev.lastName || (realName1 ? realName1.split(' ').slice(1).join(' ') : ''),
            email: prev.email || user.email || '',
            phone: prev.phone || user.phone || ''
          }));
          return;
        }

        // Autofill form with extended data
        const realName2 = isRealName(user.fullName);
        setFormData(prev => ({
          ...prev,
          firstName: customerData.nome || prev.firstName || (realName2 ? realName2.split(' ')[0] : ''),
          lastName: customerData.cognome || prev.lastName || (realName2 ? realName2.split(' ').slice(1).join(' ') : ''),
          email: customerData.email || prev.email || user.email || '',
          phone: customerData.telefono || prev.phone || user.phone || '',
          birthDate: customerData.data_nascita || prev.birthDate,
          // License fields from metadata
          licenseNumber: customerData.metadata?.numero_patente || prev.licenseNumber,
          licenseIssueDate: customerData.metadata?.patente_data_rilascio || prev.licenseIssueDate,
        }));

        console.log('Autofilled form with user profile data');

      } catch (err) {
        // Enhanced error logging with full diagnostics
        const ua = navigator.userAgent;
        const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
        const isSafari = /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor);

        console.error('Error autofilling user data (detailed diagnostics):', {
          // Request info
          requestUrl: '[customers_extended endpoint]',
          userId: user.id,

          // Error details
          errorMessage: (err as Error).message,
          errorName: (err as Error).name,
          errorStack: (err as Error).stack,

          // Network info
          networkOnline: navigator.onLine,

          // Browser info
          browser: isChrome ? 'Chrome' : isSafari ? 'Safari' : 'Other',
          userAgent: ua,

          // Timestamp
          timestamp: new Date().toISOString(),

          // Error type indicators
          possibleHTTP2Error: (err as Error).message?.includes('HTTP2') || (err as Error).message?.includes('ERR_'),
        });
        // Continue with basic auth data even if extended profile fails
        const realName3 = isRealName(user.fullName);
        setFormData(prev => ({
          ...prev,
          firstName: prev.firstName || (realName3 ? realName3.split(' ')[0] : ''),
          lastName: prev.lastName || (realName3 ? realName3.split(' ').slice(1).join(' ') : ''),
          email: prev.email || user.email || '',
          phone: prev.phone || user.phone || ''
        }));
      }
    };

    fetchUserData();
  }, [user?.id, user?.email, user?.fullName, user?.phone]);


  // Nexi initialization not needed here

  // Camera stream binding
  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  // Return time auto-calculation: default to same time as pickup
  useEffect(() => {
    if (formData.pickupTime && formData.pickupDate && formData.returnDate) {
      setFormData(prev => ({ ...prev, returnTime: formData.pickupTime }));
    }
  }, [formData.pickupTime, formData.pickupDate, formData.returnDate, availabilityWindows]);

  // Check vehicle availability when dates change
  useEffect(() => {
    const checkAvailability = async () => {
      if (!item || !formData.pickupDate || !formData.returnDate || !formData.pickupTime || !formData.returnTime) {
        setAvailabilityError(null);
        setPartialUnavailabilityWarning(null);
        setShortSlotWarning(null);
        return;
      }

      setIsCheckingAvailability(true);
      setAvailabilityError(null);
      setPartialUnavailabilityWarning(null);
      setShortSlotWarning(null);

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
          const conflictEnd = new Date(conflicts[0].dropoff_date);
          const conflictEndFormatted = conflictEnd.toLocaleDateString('it-IT', {
            day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome'
          });
          const conflictTimeFormatted = conflictEnd.toLocaleTimeString('it-IT', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome'
          });
          setAvailabilityError(
            `Veicolo non disponibile per le date selezionate. Già prenotato fino al ${conflictEndFormatted} alle ${conflictTimeFormatted}.`
          );
          setIsCheckingAvailability(false);
          return;
        }

        // Check for partial-day unavailability (e.g., at mechanic)
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
    isMassimo, specialDiscountAmount, carWashFee, noDepositSurcharge,
    effectivePricePerDay // Calculated price per day (resident or non-resident)
  } = useMemo(() => {
    const zero = {
      duration: { days: 0, hours: 0 }, rentalCost: 0, insuranceCost: 0, extrasCost: 0, kmPackageCost: 0, pickupFee: 0, dropoffFee: 0, subtotal: 0, taxes: 0, total: 0, includedKm: 0, driverAge: 0, licenseYears: 0, youngDriverFee: 0, recentLicenseFee: 0, secondDriverFee: 0, recommendedKm: null, membershipDiscount: 0, membershipTier: null, originalTotal: 0, finalTotal: 0,
      isMassimo: false, specialDiscountAmount: 0, carWashFee: 0, noDepositSurcharge: 0
    };
    if (!item || !item.pricePerDay) return zero;

    // === DUAL PRICING LOGIC ===
    // Determine which price to use based on residency and usage zone
    let pricePerDay = item.pricePerDay[currency]; // fallback to legacy pricing

    if (item.priceResidentDaily && item.priceNonresidentDaily) {
      // Dual pricing available for this vehicle
      const userResidencyZone = (user as any)?.residencyZone || 'NON_RESIDENTE';
      const isResident = userResidencyZone === 'RESIDENTE_CAGLIARI_SUD_SARDEGNA' || userResidencyZone === 'RESIDENTE_CA' || userResidencyZone === 'RESIDENTE_SU';

      // Debug logging for pricing
      console.log('Pricing Debug:', {
        userResidencyZone,
        isResidentInDB: isResident,
        usageZone: formData.usageZone,
        priceResidentDaily: item.priceResidentDaily,
        priceNonresidentDaily: item.priceNonresidentDaily,
        willApplyResidentPrice: formData.usageZone === 'CAGLIARI_SUD'
      });

      // NEW LOGIC: Apply resident pricing based on USAGE ZONE selection
      // This allows users without the database residency_zone field to still get resident pricing
      // when they select "Cagliari e Sud Sardegna" usage zone
      if (formData.usageZone === 'CAGLIARI_SUD') {
        pricePerDay = item.priceResidentDaily;
        console.log('Applied RESIDENT pricing (based on usage zone selection):', pricePerDay);
      } else {
        // All other cases use non-resident pricing:
        // - FUORI_ZONA selected
        // - No zone selected yet (defaults to non-resident)
        pricePerDay = item.priceNonresidentDaily;
        console.log('Applied NON-RESIDENT pricing:', pricePerDay);
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
    // Check if supercar with 50km/day package (flat €149/day, no discounts)
    const SUPERCAR_50KM_DAILY_RATE = 149;
    const isSupercar50km = formData.kmPackageType === '50km' && getVehicleType(item, categoryContext) === 'SUPERCAR';

    let calculatedRentalCost = billingDays * pricePerDay;

    if (isSupercar50km) {
      // 50km/day supercar package: flat €149/day, no multi-day discounts
      calculatedRentalCost = billingDaysCalc * SUPERCAR_50KM_DAILY_RATE;
    } else if (isMassimo && getVehicleType(item, categoryContext) === 'SUPERCAR') {
      // Massimo Runchina: flat €339/day for supercars, NO tiered discounts
      // Additional discounts ONLY via codice sconto
      calculatedRentalCost = billingDaysCalc * SPECIAL_CLIENTS.MASSIMO_RUNCHINA.config.baseRate;
    } else {
      // Standard multi-day pricing for all other customers
      const vType = getVehicleType(item, categoryContext);
      const isResident = formData.usageZone === 'CAGLIARI_SUD';

      calculatedRentalCost = calculateMultiDayPrice(vType, billingDaysCalc, pricePerDay, isResident);
    }


    // --- INSURANCE COST ---
    // KASKO is now INCLUDED in the rental price at NO ADDITIONAL COST
    // All insurance costs are €0 regardless of vehicle type
    let insuranceDailyPrice = 0;
    const tier = formData.insuranceOption;

    // Type checking for VehicleType specific logic
    const vType = getVehicleType(item, categoryContext);

    // Insurance pricing - KASKO is now INCLUDED (free)
    // All tiers have €0 cost since insurance is included in the base rental price
    insuranceDailyPrice = 0;

    let calculatedInsuranceCost = 0; // Always 0 since insurance is included

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



    // KM package handling
    let calculatedKmPackageCost = 0;
    let calculatedIncludedKm = 9999; // Default: unlimited for all vehicles
    if (isSupercar50km) {
      // 50km/day package: km cost is already baked into the flat daily rate
      calculatedIncludedKm = 50 * billingDaysCalc;
      calculatedKmPackageCost = 0; // Included in rental cost
    }

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

    // No-deposit surcharge: +30% on subtotal for urban/corporate vehicles when customer opts out of deposit
    const vTypeForDeposit = getVehicleType(item, categoryContext);
    const isUrbanForDeposit = vTypeForDeposit === 'UTILITARIA' || vTypeForDeposit === 'FURGONE' || vTypeForDeposit === 'V_CLASS';
    const calculatedNoDepositSurcharge = (isUrbanForDeposit && formData.depositOption === 'no_deposit')
      ? roundToTwoDecimals(calculatedSubtotal * 0.30)
      : 0;
    calculatedSubtotal = calculatedSubtotal + calculatedNoDepositSurcharge;

    let specialDiscountAmount = 0;

    // Tax calculation
    // ALL PRICES ARE TAX-INCLUSIVE (IVA/TVA already included)
    // No additional tax should be added
    const calculatedTaxes = 0;
    const calculatedTotal = calculatedSubtotal;

    // Apply membership discount (same for all customers including Massimo)
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
      carWashFee,
      noDepositSurcharge: calculatedNoDepositSurcharge,
      effectivePricePerDay: isSupercar50km ? SUPERCAR_50KM_DAILY_RATE : pricePerDay // Expose the calculated price per day
    };
  }, [
    formData.pickupDate, formData.pickupTime, formData.returnDate, formData.returnTime,
    formData.insuranceOption, formData.extras, formData.birthDate, formData.licenseIssueDate, formData.addSecondDriver,
    formData.kmPackageType, formData.kmPackageDistance, formData.expectedKm,
    formData.email, formData.usageZone, formData.depositOption,
    item, currency, user, isUrbanOrCorporate, categoryContext
  ]);

  // Online booking discount (5%) — NOT for supercars, NOT for Massimo
  const isEligibleForOnlineDiscount = vehicleType !== 'SUPERCAR' && !isMassimo;
  const onlineDiscountAmount = isEligibleForOnlineDiscount ? finalTotal * 0.05 : 0;
  const finalTotalWithOnlineDiscount = isEligibleForOnlineDiscount ? finalTotal * 0.95 : finalTotal;

  // Calculate discount code amount — supercars excluded (except special clients with dedicated codes)
  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    // Safety: never apply discount codes to supercars (except special clients with dedicated codes)
    if (vehicleType === 'SUPERCAR' && !isMassimo) return 0;

    if (appliedDiscount.type === 'percentage') {
      return Math.min(finalTotal * (appliedDiscount.amount / 100), finalTotal);
    } else {
      // Fixed amount: €150 means €150, capped at subtotal only
      return Math.min(appliedDiscount.amount, finalTotal);
    }
  }, [appliedDiscount, finalTotal, vehicleType]);

  const finalPriceWithBirthdayDiscount = Math.max(0, finalTotalWithOnlineDiscount - discountAmount);

  // Wash upsell cost (-10% on selected wash service + extras)
  const washUpsellCost = selectedUpsellWash ? roundToTwoDecimals(selectedUpsellWash.price * 0.90) : 0;
  const extrasUpsellCost = selectedUpsellExtras.reduce((sum, svc) => sum + roundToTwoDecimals(svc.price * 0.90), 0);
  const totalWashUpsellCost = roundToTwoDecimals(washUpsellCost + extrasUpsellCost);
  const grandTotal = finalPriceWithBirthdayDiscount + totalWashUpsellCost;

  // Forcer horaires valides et pas de dimanche
  useEffect(() => {
    const validTimes = getValidPickupTimes(formData.pickupDate);
    if (validTimes.length > 0 && !validTimes.includes(formData.pickupTime)) {
      setFormData(prev => ({ ...prev, pickupTime: validTimes[0] }));
    } else if (validTimes.length === 0 && formData.pickupTime) {
      setFormData(prev => ({ ...prev, pickupTime: '' }));
    }
  }, [formData.pickupDate]);


  // Auto-set usage zone for residents to ensure correct pricing
  useEffect(() => {
    const userResidencyZone = (user as any)?.residencyZone || 'NON_RESIDENTE';
    const isResident = userResidencyZone === 'RESIDENTE_CAGLIARI_SUD_SARDEGNA' || userResidencyZone === 'RESIDENTE_CA' || userResidencyZone === 'RESIDENTE_SU';
    const vType = getVehicleType(item, categoryContext);

    console.log('Usage Zone Auto-Set Check:', {
      userExists: !!user,
      userId: user?.id,
      userResidencyZone,
      isResident,
      vehicleType: vType,
      currentUsageZone: formData.usageZone,
      willAutoSet: isResident && !formData.usageZone
    });

    // Auto-set logic based on vehicle type and km package
    if (vType !== 'SUPERCAR') {
      // Utility vehicles (UTILITARIA, FURGONE, V_CLASS) always use FUORI_ZONA
      if (formData.usageZone !== 'FUORI_ZONA') {
        console.log('Auto-setting usageZone to FUORI_ZONA for utility vehicle');
        setFormData(prev => ({ ...prev, usageZone: 'FUORI_ZONA' }));
      }
    } else if (formData.kmPackageType === '50km') {
      // SUPERCAR with 50km/day: no zone restriction, auto-set FUORI_ZONA
      if (formData.usageZone !== 'FUORI_ZONA') {
        console.log('Auto-setting usageZone to FUORI_ZONA for supercar 50km/day package');
        setFormData(prev => ({ ...prev, usageZone: 'FUORI_ZONA' }));
      }
    } else {
      // SUPERCAR with unlimited km: Default to CAGLIARI_SUD for residents if not already set
      if (isResident && !formData.usageZone) {
        console.log('Auto-setting usageZone to CAGLIARI_SUD for resident user with supercar unlimited km');
        setFormData(prev => ({ ...prev, usageZone: 'CAGLIARI_SUD' }));
      } else if (!isResident && !formData.usageZone) {
        console.log('Non-resident user with supercar unlimited km - usageZone will remain empty until manually selected');
      } else if (formData.usageZone) {
        console.log(`usageZone already set to: ${formData.usageZone}`);
      }
    }
  }, [user, formData.usageZone, formData.kmPackageType, item, categoryContext]);

  // Force Massimo Runchina settings & Pre-fill Personal Data
  useEffect(() => {
    let updates: any = {};

    // 1. Pre-fill Personal Data (Fast Track) for ANY logged-in user
    if (user && !formData.firstName && !formData.lastName) {
      const realName = isRealName(user.fullName);
      const nameParts = realName ? realName.split(' ') : [];
      const first = nameParts.length > 0 ? nameParts[0] : '';
      const last = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      updates.firstName = first;
      updates.lastName = last;
      updates.phone = user.phone || '';
      updates.email = user.email || '';
    }

    // 2. Special Rules for Massimo Runchina & VIPs — fast track booking flow
    const emailToCheck = formData.email || user?.email || '';
    if (isMassimoRunchina(emailToCheck)) {
      // Auto-set options so Massimo skips selection steps
      if (formData.insuranceOption !== 'KASKO') updates.insuranceOption = 'KASKO';
      if (formData.kmPackageType !== 'unlimited') updates.kmPackageType = 'unlimited';
      if (formData.usageZone !== 'FUORI_ZONA') updates.usageZone = 'FUORI_ZONA';

      // Determine which VIP it is for name defaults
      const isJeanne = emailToCheck.toLowerCase().trim() === 'jeannegiraud92@gmail.com';
      const defaultFirst = isJeanne ? 'Jeanne' : 'Massimo';
      const defaultLast = isJeanne ? 'Giraud' : 'Runchina';

      // Ensure name is correct if empty
      if (!formData.firstName && !updates.firstName) updates.firstName = defaultFirst;
      if (!formData.lastName && !updates.lastName) updates.lastName = defaultLast;
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
  }, [user, formData.firstName, formData.lastName, formData.email, formData.insuranceOption, formData.kmPackageType, formData.usageZone]);




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
    // Determine vehicle type
    const vType = getVehicleType(item, categoryContext);
    const isUtilitaria = vType === 'UTILITARIA' || vType === 'FURGONE' || vType === 'V_CLASS';
    const isSupercar = !isUtilitaria;

    // Special client with noDeposit = always €0
    if (isMassimo) return 0;

    // Urban/corporate vehicles: if customer chose "no deposit" option, deposit is €0 (surcharge applied instead)
    if (isUtilitaria && formData.depositOption === 'no_deposit') return 0;

    // Rule 1: Fidelizzato (Gold/Platinum) OR 3+ supercar rentals = NO deposit for ANY vehicle
    const membershipTier = getMembershipTierName(user);
    if (membershipTier === 'gold' || membershipTier === 'platinum') return 0;
    if (isLoyalCustomer) return 0; // 3+ supercar rentals

    // Rule 2: Standard customer - calculate deposit based on vehicle type and license years
    const depositRules = isUtilitaria ? DEPOSIT_RULES.UTILITARIA : DEPOSIT_RULES.SUPERCAR;

    // Use license years from pricing calculation (≥5 years = lower deposit)
    if (licenseYears >= 5) {
      return depositRules.LICENSE_5_OR_MORE;
    } else {
      return depositRules.LICENSE_UNDER_5;
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
        setErrors(prev => ({ ...prev, pickupDate: "Siamo chiusi la domenica. Seleziona un altro giorno per il ritiro." }));
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
      // Clear second driver field error
      const errorKey = `secondDriver.${secondDriverField}`;
      if (errors[errorKey]) setErrors(prev => ({ ...prev, [errorKey]: '' }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (isFile ? (e.target as HTMLInputElement).files?.[0] || null : value)
      }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    // When pickup time changes, auto-set return time to pickup time - 1h30
    if (name === 'pickupTime') {
      const [h, m] = value.split(':').map(Number);
      const retMinutes = Math.max(0, (h * 60 + m) - 90);
      const retH = String(Math.floor(retMinutes / 60)).padStart(2, '0');
      const retM = String(retMinutes % 60).padStart(2, '0');
      setFormData(prev => ({ ...prev, returnTime: `${retH}:${retM}` }));
    }

    // Immediate Sunday check when return date is selected
    if (name === 'returnDate' && value) {
      const dayOfWeek = getDayOfWeek(value);
      if (dayOfWeek === 0) {
        setErrors(prev => ({ ...prev, returnDate: "Siamo chiusi la domenica. Seleziona un altro giorno per la riconsegna." }));
      } else {
        setErrors(prev => ({ ...prev, returnDate: '' }));
      }
    }

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

      // Get auth token for authenticated upload
      const { data: { session } } = await supabase.auth.getSession();
      const uploadHeaders: Record<string, string> = {};
      if (session?.access_token) {
        uploadHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetchWithTimeout(`${FUNCTIONS_BASE}/.netlify/functions/upload-file`, {
        method: 'POST',
        headers: uploadHeaders,
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

        // Calendar day logic: if there's a night between pickup and return, it counts as 1+ days
        // This matches the billing logic (pickup 17:30, return next day 09:00 = 1 day)
        const pDate = new Date(formData.pickupDate); pDate.setHours(0, 0, 0, 0);
        const rDate = new Date(formData.returnDate); rDate.setHours(0, 0, 0, 0);
        const calendarDays = Math.round((rDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffMs <= 0) {
          // Return is before or equal to pickup
          newErrors.date = "La data di riconsegna deve essere successiva al ritiro.";
        } else if (calendarDays < 1) {
          // Same calendar day — check if constrained availability window
          let isConstrainedSlot = false;

          if (availabilityWindows.length > 0 && hasBusyPeriods) {
            const pickupWindow = availabilityWindows.find(w => {
              const start = new Date(w.start);
              const end = new Date(w.end);
              return pickup >= start && pickup <= end;
            });

            if (pickupWindow) {
              const windowStart = new Date(pickupWindow.start);
              const windowEnd = new Date(pickupWindow.end);
              const windowDurationHours = (windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60);

              if (windowDurationHours < 24) {
                isConstrainedSlot = true;
                const startStr = windowStart.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                const endStr = windowEnd.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                const startDateStr = windowStart.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
                const endDateStr = windowEnd.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
                setShortSlotWarning(
                  `Attenzione: questo veicolo è disponibile solo per questo slot ridotto (${startDateStr} ${startStr} → ${endDateStr} ${endStr}).`
                );
              }
            }
          }

          if (!isConstrainedSlot) {
            newErrors.date = "Il noleggio minimo è di 1 giorno.";
            setShortSlotWarning(null);
          }
        } else {
          // 1+ calendar days — valid rental
          setShortSlotWarning(null);
        }

        // Check minimum rental duration of 2 hours for airport drop-offs
        const isAirportDropoff = formData.returnLocation === 'cagliari_airport';
        if (isAirportDropoff && diffHours < 2) {
          newErrors.returnTime = "Per la riconsegna in aeroporto, la durata minima del noleggio è di 2 ore.";
        }

        // Check Sunday drop-off (CLOSED)
        const returnDayOfWeek = getDayOfWeek(formData.returnDate);
        if (returnDayOfWeek === 0) { // Sunday = 0
          newErrors.returnDate = "Siamo chiusi la domenica. Seleziona un altro giorno per la riconsegna.";
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

        // Server-side availability check (checkVehicleAvailability) handles conflict detection
      }
      if (formData.pickupDate && getDayOfWeek(formData.pickupDate) === 0) {
        newErrors.pickupDate = "Siamo chiusi la domenica. Seleziona un altro giorno per il ritiro.";
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
      if (!formData.birthDate) {
        newErrors.birthDate = "La data di nascita è obbligatoria.";
      } else {
        // Age verification - must be at least 18 years old
        const driverAge = calculateAgeFromDDMMYYYY(formData.birthDate);
        if (driverAge < 18) {
          newErrors.birthDate = "Devi avere almeno 18 anni per noleggiare un veicolo.";
        }
      }
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

      // License requirements: 3 years minimum, 5 years for BMW M4
      const isBMW_M4 = item.name?.includes('BMW M4') || item.name?.includes('M4 Competition');
      const requiredYears = isBMW_M4 ? 5 : 3;

      if (ly < requiredYears) {
        newErrors.licenseIssueDate = isBMW_M4
          ? "Per la BMW M4 è richiesta una patente con almeno 5 anni di anzianità."
          : "È richiesta una patente con almeno 3 anni di anzianità.";
      }

      // Second driver validation — mandatory when checkbox is checked
      if (formData.addSecondDriver) {
        const sd = formData.secondDriver;
        if (!sd.firstName.trim()) newErrors['secondDriver.firstName'] = "Nome obbligatorio.";
        if (!sd.lastName.trim()) newErrors['secondDriver.lastName'] = "Cognome obbligatorio.";
        if (!sd.email.trim()) newErrors['secondDriver.email'] = "Email obbligatoria.";
        if (!sd.phone.trim()) newErrors['secondDriver.phone'] = "Telefono obbligatorio.";
        if (!sd.birthDate) {
          newErrors['secondDriver.birthDate'] = "Data di nascita obbligatoria.";
        } else {
          const sdAge = calculateAgeFromDDMMYYYY(sd.birthDate);
          if (sdAge < 18) newErrors['secondDriver.birthDate'] = "Il secondo conducente deve avere almeno 18 anni.";
        }
        if (!sd.licenseNumber.trim()) newErrors['secondDriver.licenseNumber'] = "Numero patente obbligatorio.";
        if (!sd.licenseIssueDate) {
          newErrors['secondDriver.licenseIssueDate'] = "Data rilascio patente obbligatoria.";
        } else {
          const sdLicenseYears = calculateYearsSince(sd.licenseIssueDate);
          if (sdLicenseYears < requiredYears) {
            newErrors['secondDriver.licenseIssueDate'] = isBMW_M4
              ? "Per la BMW M4 è richiesta una patente con almeno 5 anni di anzianità."
              : "È richiesta una patente con almeno 3 anni di anzianità.";
          }
        }
        if (!sd.licenseExpiryDate) {
          newErrors['secondDriver.licenseExpiryDate'] = "La data di scadenza della patente è obbligatoria.";
        } else {
          const today = new Date().toISOString().split('T')[0];
          if (sd.licenseExpiryDate < today) {
            newErrors['secondDriver.licenseExpiryDate'] = "La patente è scaduta.";
          }
        }
        if (!sd.countryOfIssue) newErrors['secondDriver.countryOfIssue'] = "Il paese di rilascio è obbligatorio.";
        if (!sd.licenseImage) newErrors['secondDriver.licenseImage'] = "Patente secondo conducente obbligatoria.";
        if (!sd.idImage) newErrors['secondDriver.idImage'] = "Documento secondo conducente obbligatorio.";
      }
    }
    if (step === 3) {
      const vType = getVehicleType(item, categoryContext);

      if (isUrbanOrCorporate && !formData.depositOption) {
        newErrors.depositOption = "Devi selezionare un'opzione per la cauzione.";
      }

      // Validate usage zone — skip for Massimo (auto-set to FUORI_ZONA)
      if (vType === 'SUPERCAR' && !isMassimo && formData.kmPackageType === 'unlimited') {
        if (!formData.usageZone) {
          newErrors.usageZone = "Devi selezionare una zona di utilizzo.";
        }
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
      const pickupDateTime = createItalyDateTime(formData.pickupDate, formData.pickupTime);
      const dropoffDateTime = createItalyDateTime(formData.returnDate, formData.returnTime);

      // Resolve customer data with fallback to user object
      const rFirstName = formData.firstName || (user.fullName?.split(' ')[0]) || '';
      const rLastName = formData.lastName || (user.fullName?.split(' ').slice(1).join(' ')) || '';
      const rFullName = `${rFirstName} ${rLastName}`.trim() || user.fullName || 'Cliente';
      const rEmail = formData.email || user.email || '';
      const rPhone = formData.phone || (user as any).phone || '';

      const bookingData = {
        user_id: user.id,
        vehicle_type: item.type || 'car',
        vehicle_name: availableVehicleName || item.name, // Use specific vehicle from group if available
        vehicle_image_url: item.image,
        pickup_date: pickupDateTime.toISOString(),
        dropoff_date: dropoffDateTime.toISOString(),
        pickup_location: formData.pickupLocation,
        dropoff_location: formData.returnLocation,
        price_total: eurosToCents(grandTotal),
        currency: currency.toUpperCase(),
        status: 'pending',
        payment_status: paymentIntentId || formData.paymentMethod === 'credit' ? 'succeeded' : 'pending',
        payment_method: formData.paymentMethod,
        stripe_payment_intent_id: paymentIntentId || null,
        booked_at: new Date().toISOString(),
        booking_usage_zone: formData.usageZone || null,
        vehicle_id: formData.selectedVehicleId || null,
        deposit_amount: getDeposit(),
        insurance_option: formData.insuranceOption,
        customer_name: rFullName,
        customer_email: rEmail,
        customer_phone: rPhone,
        booking_details: {
          customer: {
            fullName: rFullName,
            firstName: rFirstName,
            lastName: rLastName,
            email: rEmail,
            phone: rPhone,
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
            licenseExpiryDate: formData.secondDriver.licenseExpiryDate,
            countryOfIssue: formData.secondDriver.countryOfIssue,
          } : null,
          duration: `${days} days`,
          insuranceOption: formData.insuranceOption,
          extras: formData.extras,
          kmPackage: {
            type: formData.kmPackageType === '50km' ? '50km' : (includedKm >= 9999 ? 'unlimited' : formData.kmPackageType),
            distance: formData.kmPackageType === '50km' ? `50km/day (${includedKm} total)` : (includedKm >= 9999 ? 'unlimited' : (formData.kmPackageType === 'unlimited' ? 'unlimited' : formData.kmPackageDistance)),
            cost: kmPackageCost,
            includedKm: includedKm,
            isPremium: isPremiumVehicle(item.name),
            dailyRate: formData.kmPackageType === '50km' ? 149 : undefined
          },
          depositOption: formData.depositOption,
          noDepositSurcharge: noDepositSurcharge,
          vehicle_id: formData.selectedVehicleId, // Store specific vehicle ID to avoid grouping collisions
          driverLicenseImage: licenseImageUrl,
          driverIdImage: idImageUrl,
          ...(selectedUpsellWash || selectedUpsellExtras.length > 0 ? { washUpsell: {
            ...(selectedUpsellWash ? {
              serviceId: selectedUpsellWash.id,
              serviceName: selectedUpsellWash.name,
              originalPrice: selectedUpsellWash.price,
              discountedPrice: washUpsellCost,
            } : {}),
            discountPercent: 10,
            customerCarModel: upsellCarInput,
            carCategory: upsellCarCategory,
            ...(upsellTargaResult ? { customerPlate: upsellTargaResult.plate } : {}),
            washUpsellExtras: selectedUpsellExtras.map(svc => ({
              serviceId: svc.id, serviceName: svc.name,
              originalPrice: svc.price, discountedPrice: roundToTwoDecimals(svc.price * 0.90),
            })),
            totalCost: totalWashUpsellCost,
          }} : {}),
        }
      };

      const { data, error } = await supabase.from('bookings').insert(bookingData).select().single();

      if (error) {
        console.error('DB insert error details:', error);
        throw new Error(`DB insert failed: ${error.message}`);
      }

      if (data) {
        // Send email confirmation
        fetchWithTimeout(`${FUNCTIONS_BASE}/.netlify/functions/send-booking-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: data }),
        }).catch(emailError => console.error('Failed to send confirmation email:', emailError));

        // Send WhatsApp notification to admin
        fetchWithTimeout(`${FUNCTIONS_BASE}/.netlify/functions/send-whatsapp-notification`, {
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
          `*Dettagli Prenotazione*\n` +
          `*ID:* DR7-${bookingId}\n` +
          `*Nome:* ${customerName}\n` +
          `*Telefono:* ${customerPhone}\n` +
          `*Veicolo:* ${vehicleName}\n` +
          `*Data Ritiro:* ${pickupDate.toLocaleDateString('it-IT')} alle ${pickupDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n` +
          `*Data Riconsegna:* ${dropoffDate.toLocaleDateString('it-IT')} alle ${dropoffDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n` +
          `*Luogo Ritiro:* ${data.pickup_location}\n` +
          `*Assicurazione:* ${insuranceOption}\n` +
          (selectedUpsellWash ? `*Lavaggio Auto:* ${selectedUpsellWash.name} (€${washUpsellCost.toFixed(2)}) - ${upsellCarInput}\n` : '') +
          (selectedUpsellExtras.length > 0 ? `*Servizi Aggiuntivi:* ${selectedUpsellExtras.map(s => `${s.name} (€${roundToTwoDecimals(s.price * 0.90).toFixed(2)})`).join(', ')}\n` : '') +
          `*Totale:* €${totalPrice}\n\n` +
          `Grazie!`;

        const officeWhatsAppNumber = '393457905205';
        const whatsappUrl = `https://wa.me/${officeWhatsAppNumber}?text=${encodeURIComponent(whatsappMessage)}`;

        // Open WhatsApp in a new tab after a short delay
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1000);
      }

      // Mark birthday discount code as used
      if (appliedDiscount && data.id) {
        await markDiscountCodeAsUsed(data.id);
      }

      onBookingComplete(data);
      setIsProcessing(false);

    } catch (e: any) {
      setErrors(prev => ({ ...prev, form: `Booking failed: ${e.message}` }));
      setIsProcessing(false);
    }
  };

  // Validate discount code (supports both birthday codes and marketing codes)
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountCodeError('Inserisci un codice sconto');
      return;
    }

    // Check if user is logged in
    if (!user) {
      setDiscountCodeError('Devi effettuare il login per utilizzare un codice sconto');
      return;
    }

    // Block discount codes on supercar bookings (except for special clients who get codes made for them)
    if (vehicleType === 'SUPERCAR' && !isMassimoRunchina(user)) {
      setDiscountCodeError('I codici sconto non sono applicabili ai veicoli Supercar');
      return;
    }

    setIsValidatingCode(true);
    setDiscountCodeError(null);

    // Determine service type for scope validation
    let serviceType = 'noleggio';
    if (categoryContext === 'cars') {
      serviceType = 'supercar';
    } else if (categoryContext === 'urban-cars') {
      serviceType = 'utilitarie';
    }

    try {
      // Call the admin API to validate the code with service context
      const response = await fetch('/.netlify/functions/validate-discount-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          code: discountCode.trim().toUpperCase(),
          serviceType: serviceType,
          orderTotal: Math.round(finalTotalWithOnlineDiscount * 100)
        })
      });

      const rawResult = await response.json();

      if (!response.ok || !rawResult.valid) {
        setDiscountCodeError(rawResult.message || rawResult.error || 'Codice non valido');
        setDiscountCodeValid(false);
        setAppliedDiscount(null);
        return;
      }

      // The API may return discount data nested in discountCode or at top level
      const result = { ...rawResult, ...(rawResult.discountCode || {}) };

      // Check if rental credit is already used (for birthday codes)
      if (result.code_type === 'birthday' && result.rental_used) {
        setDiscountCodeError('Il credito noleggio di questo codice è già stato utilizzato');
        setDiscountCodeValid(false);
        setAppliedDiscount(null);
        return;
      }

      // For birthday codes ONLY: verify the logged-in user matches the code's customer
      // Marketing codes (from admin generator) can be used by anyone
      // Skip check if no customer_email/customer_phone is set on the code (admin didn't restrict it)
      if (result.code_type === 'birthday' && (result.customer_email || result.customer_phone)) {
        const userEmail = user.email?.toLowerCase().trim();
        const userPhone = user.phone?.replace(/[\s\-\+]/g, '');
        const codeCustomerPhone = result.customer_phone?.replace(/[\s\-\+]/g, '');

        // Check if user's email or phone matches the code's customer
        const emailMatch = userEmail && result.customer_email && userEmail === result.customer_email.toLowerCase().trim();
        const phoneMatch = userPhone && codeCustomerPhone && (
          userPhone === codeCustomerPhone ||
          userPhone.endsWith(codeCustomerPhone.slice(-9)) ||
          codeCustomerPhone.endsWith(userPhone.slice(-9))
        );

        if (!emailMatch && !phoneMatch) {
          setDiscountCodeError('Questo codice sconto è riservato a un altro cliente. Verifica di aver effettuato il login con lo stesso account.');
          setDiscountCodeValid(false);
          setAppliedDiscount(null);
          return;
        }
      }

      // Code is valid - apply the discount
      // Use value_type/value_amount for all codes, with rental_credit as fallback for birthday codes
      let discountAmount = 0;
      let discountType: 'fixed' | 'percentage' | 'rental' = 'fixed';

      if (result.value_type && result.value_amount) {
        // Prefer explicit value_type and value_amount (works for all code types)
        discountType = result.value_type; // 'fixed' or 'percentage'
        discountAmount = result.value_amount;
      } else if (result.rental_credit) {
        // Fallback for birthday codes that only have rental_credit
        discountType = 'fixed';
        discountAmount = result.rental_credit;
      }

      setDiscountCodeValid(true);
      setAppliedDiscount({
        code: result.code,
        amount: discountAmount,
        type: discountType,
        code_type: result.code_type || 'marketing'
      });
      setDiscountCodeError(null);

    } catch (error: any) {
      console.error('Error validating discount code:', error);
      setDiscountCodeError('Errore nella verifica del codice');
      setDiscountCodeValid(false);
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Remove applied discount
  const removeDiscount = () => {
    setDiscountCode('');
    setDiscountCodeValid(false);
    setAppliedDiscount(null);
    setDiscountCodeError(null);
  };

  // Mark discount code as used after successful booking
  const markDiscountCodeAsUsed = async (bookingId: string) => {
    if (!appliedDiscount?.code) return;

    // Determine service type
    let serviceType = 'noleggio';
    if (categoryContext === 'cars') {
      serviceType = 'supercar';
    } else if (categoryContext === 'urban-cars') {
      serviceType = 'utilitarie';
    }

    try {
      await fetch('/.netlify/functions/validate-discount-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_rental',
          code: appliedDiscount.code,
          booking_id: bookingId,
          service_type: serviceType
        })
      });
      console.log('Discount code marked as used:', appliedDiscount.code);
    } catch (error) {
      console.error('Error marking discount code as used:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    console.log("handleSubmit called", { paymentMethod: formData.paymentMethod, step, userId: user?.id });
    if (!validateStep() || !item) return;

    // Ref-based guard: prevents double-tap/double-click even if state hasn't updated yet
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsProcessing(true);

    // Safety timeout: auto-reset after 120 seconds (enough for slow networks + Nexi redirect)
    const safetyTimer = setTimeout(() => {
      isSubmittingRef.current = false;
      setIsProcessing(false);
      setPaymentError('Timeout — riprova il pagamento.');
    }, 120000);

    try {

    // SAFETY NET: Re-validate critical customer fields before ANY booking
    const customerName = `${formData.firstName} ${formData.lastName}`.trim();
    if (!customerName || !formData.firstName.trim() || !formData.lastName.trim()) {
      clearTimeout(safetyTimer);
      setPaymentError('Nome e cognome sono obbligatori. Torna allo Step 2 e compila i campi.');
      isSubmittingRef.current = false;
      setIsProcessing(false);
      return;
    }
    if (!formData.email.trim()) {
      clearTimeout(safetyTimer);
      setPaymentError('Email obbligatoria. Torna allo Step 2 e compila il campo.');
      isSubmittingRef.current = false;
      setIsProcessing(false);
      return;
    }

    // Credit wallet requires login
    if (formData.paymentMethod === 'credit' && !user?.id) {
      clearTimeout(safetyTimer);
      setPaymentError('Devi effettuare il login per procedere.');
      isSubmittingRef.current = false;
      setIsProcessing(false);
      return;
    }

    // Check sufficient balance only for credit wallet payments
    if (formData.paymentMethod === 'credit') {
      const hasBalance = await hasSufficientBalance(user.id, grandTotal);
      if (!hasBalance) {
        clearTimeout(safetyTimer);
        setPaymentError(`Credito insufficiente. Saldo attuale: €${creditBalance.toFixed(2)}, Richiesto: €${grandTotal.toFixed(2)}`);
        isSubmittingRef.current = false;
        setIsProcessing(false);
        return;
      }
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
          price_total: Math.round(grandTotal * 100),
          currency: currency.toUpperCase(),
          booking_source: 'website',
          customer_name: `${formData.firstName} ${formData.lastName}`,
          customer_email: formData.email,
          customer_phone: formData.phone,
          deposit_amount: getDeposit(),
          vehicle_id: formData.selectedVehicleId || null,
          insurance_option: formData.insuranceOption,
          booking_usage_zone: formData.usageZone || null,
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
              licenseExpiryDate: formData.secondDriver.licenseExpiryDate,
              countryOfIssue: formData.secondDriver.countryOfIssue,
            } : null,
            duration: `${days} days`,
            insuranceOption: formData.insuranceOption,
            extras: formData.extras,
            kmPackage: {
              type: formData.kmPackageType === '50km' ? '50km' : (includedKm >= 9999 ? 'unlimited' : formData.kmPackageType),
              distance: formData.kmPackageType === '50km' ? `50km/day (${includedKm} total)` : (includedKm >= 9999 ? 'unlimited' : (formData.kmPackageType === 'unlimited' ? 'unlimited' : formData.kmPackageDistance)),
              cost: kmPackageCost,
              includedKm: includedKm,
              isPremium: isPremiumVehicle(item.name),
              dailyRate: formData.kmPackageType === '50km' ? 149 : undefined
            },
            vehicle_id: formData.selectedVehicleId,
            depositOption: formData.depositOption,
            noDepositSurcharge: noDepositSurcharge,
            driverLicenseImage: licenseImageUrl,
            driverIdImage: idImageUrl,
            ...(selectedUpsellWash || selectedUpsellExtras.length > 0 ? { washUpsell: {
              ...(selectedUpsellWash ? {
                serviceId: selectedUpsellWash.id,
                serviceName: selectedUpsellWash.name,
                originalPrice: selectedUpsellWash.price,
                discountedPrice: washUpsellCost,
              } : {}),
              discountPercent: 10,
              customerCarModel: upsellCarInput,
              carCategory: upsellCarCategory,
              washUpsellExtras: selectedUpsellExtras.map(svc => ({
                serviceId: svc.id, serviceName: svc.name,
                originalPrice: svc.price, discountedPrice: roundToTwoDecimals(svc.price * 0.90),
              })),
              totalCost: totalWashUpsellCost,
            }} : {}),
          }
        };

        // 3. Call Atomic RPC
        console.log("Starting credit booking RPC call...", { user: user.id, amount: Math.round(grandTotal * 100), vehicle: item.name });
        const { data, error } = await supabase.rpc('book_with_credits', {
          p_user_id: user.id,
          p_amount_cents: Math.round(grandTotal * 100),
          p_vehicle_name: item.name,
          p_booking_payload: bookingPayload
        });
        console.log("RPC returned:", { data, error });

        if (error) {
          console.error("RPC Error:", error);
          setPaymentError(error.message);
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
          fetchWithTimeout(`${FUNCTIONS_BASE}/.netlify/functions/send-booking-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: finalBookingData }),
          }).catch(e => console.error('Email error', e));

          // Send WhatsApp Admin
          fetchWithTimeout(`${FUNCTIONS_BASE}/.netlify/functions/send-whatsapp-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: finalBookingData }),
          }).catch(e => console.error('WhatsApp error', e));

          // Mark birthday discount code as used
          if (appliedDiscount) {
            try {
              await markDiscountCodeAsUsed(data.booking_id);
            } catch (discountErr) {
              console.error('Failed to mark discount code as used:', discountErr);
            }
          }

          // Completed - Pass the full object with ID so UI can redirect
          onBookingComplete(finalBookingData);

          // WhatsApp Customer Message
          const bookingId = data.booking_id.substring(0, 8).toUpperCase();
          const customerName = `${formData.firstName} ${formData.lastName}`;
          const customerPhone = formData.phone;
          const totalPrice = grandTotal.toFixed(2);

          const whatsappMessage = `Ciao! Ho appena completato una prenotazione con Credito DR7.\n\n` +
            `*Dettagli Prenotazione*\n` +
            `*ID:* DR7-${bookingId}\n` +
            `*Nome:* ${customerName}\n` +
            `*Telefono:* ${customerPhone}\n` +
            `*Veicolo:* ${item.name}\n` +
            `*Ritiro:* ${formData.pickupDate} ${formData.pickupTime}\n` +
            (selectedUpsellWash ? `*Lavaggio Auto:* ${selectedUpsellWash.name} (€${washUpsellCost.toFixed(2)}) - ${upsellCarInput}\n` : '') +
          (selectedUpsellExtras.length > 0 ? `*Servizi Aggiuntivi:* ${selectedUpsellExtras.map(s => `${s.name} (€${roundToTwoDecimals(s.price * 0.90).toFixed(2)})`).join(', ')}\n` : '') +
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
          setPaymentError(data?.message || "Prenotazione fallita. Riprova o contatta il supporto.");
          setIsProcessing(false);
        }

      } catch (err: any) {
        console.error("Catch Error during booking:", err);
        setPaymentError(err.message || "Errore sconosciuto durante la prenotazione.");
        setIsProcessing(false);
      }
    } else if (formData.paymentMethod === 'nexi' && step === 4) {
      setPaymentError(null);
      setIsProcessing(true);

      try {
        // user.id is preferred but not strictly required for Nexi (booking data has customer info)

        // 1. Prepare standardized booking payload
        const { days } = duration;

        // Ensure dates are parsed as Italy/Europe time
        const pickupDateTime = createItalyDateTime(formData.pickupDate, formData.pickupTime);
        const dropoffDateTime = createItalyDateTime(formData.returnDate, formData.returnTime);

        // Upload documents if needed (reusing logic from standard flow if separated, 
        // but here we might need to duplicate or extract upload logic. 
        // For safety, let's assume images are already uploaded or we call a helper.
        // Actually, the main handleBooking function logic above handles uploads.
        // But wait, the original code had `finalizeBooking` separate from `handleBooking`?
        // No, `handleBooking` called `stripe.confirmCardPayment` then `finalizeBooking`.
        // We need to SAVE the booking as 'pending' first, then redirect.

        // Let's implement the "Save Pending Record" pattern directly here.

        // 1a. Upload Images First (Critical)
        let licenseImageUrl = null;
        let idImageUrl = null;
        const userId = user?.id || 'guest';
        if (formData.licenseImage) {
          licenseImageUrl = await uploadToBucket('driver-licenses', userId, formData.licenseImage, 'license');
        } else if (hasStoredDocs.licensePath) {
          licenseImageUrl = hasStoredDocs.licensePath;
        }
        if (formData.idImage) {
          idImageUrl = await uploadToBucket('carta-identita', userId, formData.idImage, 'id');
        } else if (hasStoredDocs.idPath) {
          idImageUrl = hasStoredDocs.idPath;
        }

        const vehicleName = availableVehicleName || item.name;

        // 2. Generate Nexi Order ID BEFORE insert
        const nexiOrderId = `DR7${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // 3. Resolve customer data with fallback to user object
        const nFirstName = formData.firstName || (user?.fullName?.split(' ')[0]) || '';
        const nLastName = formData.lastName || (user?.fullName?.split(' ').slice(1).join(' ')) || '';
        const nFullName = `${nFirstName} ${nLastName}`.trim() || user?.fullName || 'Cliente';
        const nEmail = formData.email || user?.email || '';
        const nPhone = formData.phone || (user as any)?.phone || '';

        // 4. Insert Pending Booking (only confirmed columns + extras in booking_details JSONB)
        const bookingData: Record<string, any> = {
          user_id: user?.id || null,
          vehicle_type: item.type || 'car',
          vehicle_name: vehicleName,
          pickup_date: pickupDateTime.toISOString(),
          dropoff_date: dropoffDateTime.toISOString(),
          pickup_location: formData.pickupLocation,
          dropoff_location: formData.returnLocation,
          price_total: Math.round(grandTotal * 100), // Store in cents
          currency: 'EUR',
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'nexi',
          booked_at: new Date().toISOString(),
          customer_name: nFullName,
          customer_email: nEmail,
          customer_phone: nPhone,
          booking_details: {
            nexi_order_id: nexiOrderId,
            vehicle_image_url: item.image,
            vehicle_id: formData.selectedVehicleId || null,
            insurance_option: formData.insuranceOption,
            deposit_amount: getDeposit(),
            booking_usage_zone: formData.usageZone || null,
            customer: {
              fullName: nFullName,
              firstName: nFirstName,
              lastName: nLastName,
              email: nEmail,
              phone: nPhone,
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
              licenseExpiryDate: formData.secondDriver.licenseExpiryDate,
              countryOfIssue: formData.secondDriver.countryOfIssue,
            } : null,
            duration: `${days} days`,
            insuranceOption: formData.insuranceOption,
            extras: formData.extras,
            kmPackage: {
              type: formData.kmPackageType === '50km' ? '50km' : recommendedKm.type,
              distance: formData.kmPackageType === '50km' ? `50km/day (${includedKm} total)` : recommendedKm.value,
              cost: kmPackageCost,
              includedKm: includedKm,
              isPremium: isPremiumVehicle(item.name),
              dailyRate: formData.kmPackageType === '50km' ? 149 : undefined
            },
            vehicle_id: formData.selectedVehicleId,
            depositOption: formData.depositOption,
            noDepositSurcharge: noDepositSurcharge,
            driverLicenseImage: licenseImageUrl,
            driverIdImage: idImageUrl,
            ...(selectedUpsellWash || selectedUpsellExtras.length > 0 ? { washUpsell: {
              ...(selectedUpsellWash ? {
                serviceId: selectedUpsellWash.id,
                serviceName: selectedUpsellWash.name,
                originalPrice: selectedUpsellWash.price,
                discountedPrice: washUpsellCost,
              } : {}),
              discountPercent: 10,
              customerCarModel: upsellCarInput,
              carCategory: upsellCarCategory,
              washUpsellExtras: selectedUpsellExtras.map(svc => ({
                serviceId: svc.id, serviceName: svc.name,
                originalPrice: svc.price, discountedPrice: roundToTwoDecimals(svc.price * 0.90),
              })),
              totalCost: totalWashUpsellCost,
            }} : {}),
          }
        };

        console.log("Booking amount:", { nexiOrderId, amount: bookingData.price_total });

        // CHECK: If discount covers full amount (€0 total), skip Nexi and book directly
        if (Math.round(grandTotal * 100) <= 0) {
          console.log("Zero-total booking: discount covers full amount, skipping Nexi payment");

          // Insert directly into bookings table (no payment needed)
          bookingData.status = 'confirmed';
          bookingData.payment_status = 'succeeded';
          bookingData.payment_method = 'discount_code';
          bookingData.vehicle_image_url = item.image;
          bookingData.vehicle_id = formData.selectedVehicleId || null;
          bookingData.deposit_amount = getDeposit();
          bookingData.insurance_option = formData.insuranceOption;
          bookingData.booking_usage_zone = formData.usageZone || null;

          const { data: insertedBooking, error: insertError } = await supabase
            .from('bookings')
            .insert(bookingData)
            .select()
            .single();

          if (insertError) {
            console.error("Booking INSERT failed:", insertError);
            throw new Error(`Errore salvataggio prenotazione: ${insertError.message}`);
          }

          console.log("Zero-total booking created:", insertedBooking.id);

          // Send email confirmation
          fetchWithTimeout(`${FUNCTIONS_BASE}/.netlify/functions/send-booking-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: insertedBooking }),
          }).catch(e => console.error('Email error', e));

          // Send WhatsApp admin notification
          fetchWithTimeout(`${FUNCTIONS_BASE}/.netlify/functions/send-whatsapp-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: insertedBooking }),
          }).catch(e => console.error('WhatsApp error', e));

          // Mark discount code as used
          if (appliedDiscount) {
            try {
              await markDiscountCodeAsUsed(insertedBooking.id);
            } catch (discountErr) {
              console.error('Failed to mark discount code as used:', discountErr);
            }
          }

          // Redeem discount code
          if (appliedDiscount?.code) {
            fetch('/.netlify/functions/redeem-discount-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: appliedDiscount.code,
                bookingId: insertedBooking.id,
                customerName: nFullName,
                serviceType: categoryContext === 'cars' ? 'supercar' : categoryContext === 'urban-cars' ? 'utilitarie' : 'noleggio',
                discountApplied: Math.round(discountAmount * 100),
              })
            }).catch(e => console.error('Redeem discount error', e));
          }

          onBookingComplete(insertedBooking);

          // WhatsApp customer message
          const bookingId = insertedBooking.id.substring(0, 8).toUpperCase();
          const whatsappMessage = `Ciao! Ho appena completato una prenotazione con codice sconto.\n\n` +
            `*Dettagli Prenotazione*\n` +
            `*ID:* DR7-${bookingId}\n` +
            `*Nome:* ${nFullName}\n` +
            `*Telefono:* ${nPhone}\n` +
            `*Veicolo:* ${vehicleName}\n` +
            `*Ritiro:* ${formData.pickupDate} ${formData.pickupTime}\n` +
            (selectedUpsellWash ? `*Lavaggio Auto:* ${selectedUpsellWash.name} (€${washUpsellCost.toFixed(2)}) - ${upsellCarInput}\n` : '') +
          (selectedUpsellExtras.length > 0 ? `*Servizi Aggiuntivi:* ${selectedUpsellExtras.map(s => `${s.name} (€${roundToTwoDecimals(s.price * 0.90).toFixed(2)})`).join(', ')}\n` : '') +
            `*Totale:* €0.00 (coperto da codice sconto)\n\n` +
            `Grazie!`;
          const whatsappUrl = `https://wa.me/393457905205?text=${encodeURIComponent(whatsappMessage)}`;
          setTimeout(() => window.open(whatsappUrl, '_blank'), 1000);

          isSubmittingRef.current = false;
          setIsProcessing(false);
          return;
        }

        // Normal Nexi flow: amount > 0
        // 3. Store booking data in pending_nexi_bookings (NOT in bookings table)
        // The real booking will only be created AFTER payment succeeds via nexi-callback
        const { error: pendingError } = await supabase
          .from('pending_nexi_bookings')
          .insert({
            nexi_order_id: nexiOrderId,
            booking_data: bookingData
          });

        if (pendingError) {
          console.error("Pending booking INSERT failed:", { message: pendingError.message, code: pendingError.code, details: pendingError.details, hint: pendingError.hint });
          throw new Error(`Errore salvataggio prenotazione: ${pendingError.message}`);
        }

        // 4. Validate amount before calling Nexi
        const amountCents = Math.round(grandTotal * 100);
        if (!amountCents || isNaN(amountCents) || amountCents <= 0) {
          console.error('Invalid payment amount:', { grandTotal, amountCents });
          throw new Error("Importo non valido per il pagamento. Controlla i dati della prenotazione.");
        }

        // 5. Initiate Nexi Payment
        const nexiResponse = await fetch('/.netlify/functions/create-nexi-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: nexiOrderId,
            amount: amountCents,
            currency: 'EUR',
            description: `Noleggio ${vehicleName} - ${days} giorni`,
            customerEmail: nEmail,
            customerName: nFullName
          })
        });

        const nexiData = await nexiResponse.json();

        if (!nexiResponse.ok) {
          throw new Error(nexiData.error || "Errore durante l'inizializzazione del pagamento");
        }

        if (!nexiData.paymentUrl) {
          throw new Error("URL di pagamento non ricevuto da Nexi");
        }

        // 5. Store orderId in sessionStorage as fallback for PaymentSuccessPage
        try {
          sessionStorage.setItem('dr7_pending_order', nexiOrderId);
          sessionStorage.setItem('dr7_pending_type', 'booking');
        } catch (e) { /* sessionStorage may be unavailable */ }

        // 6. Redirect to Nexi HPP
        console.log("Redirecting to Nexi:", nexiData.paymentUrl);
        window.location.href = nexiData.paymentUrl;

      } catch (err: any) {
        console.error("Booking Error:", err.message || err, { code: err?.code, details: err?.details, hint: err?.hint });
        setPaymentError(err.message || "Si è verificato un errore durante la prenotazione.");
        isSubmittingRef.current = false;
        setIsProcessing(false);
      }
    }

    } catch (outerErr: any) {
      // Catch-all safety net for any unhandled errors
      console.error("Unhandled booking error:", outerErr);
      setPaymentError("Errore imprevisto. Riprova.");
      isSubmittingRef.current = false;
      setIsProcessing(false);
    } finally {
      clearTimeout(safetyTimer);
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;

    // Intercept Step 3 → Step 4 transition for resident zone confirmation
    // Only show confirmation modal for SUPERCAR vehicles with CAGLIARI_SUD selection
    const vType = getVehicleType(item, categoryContext);
    if (step === 3 && vType === 'SUPERCAR' && formData.usageZone === 'CAGLIARI_SUD') {
      setShowZoneConfirmation(true);
      return;
    }

    // Show wash upsell modal on Step 3 → 4 transition (if zone confirmation didn't trigger)
    if (step === 3) {
      setShowWashUpsell(true);
      return;
    }

    setStep(s => s + 1);
  };

  const handleZoneConfirmation = () => {
    setShowZoneConfirmation(false);
    // Chain to wash upsell instead of going directly to Step 4
    setShowWashUpsell(true);
  };

  const handleZoneModification = () => {
    setShowZoneConfirmation(false);
    // Stay on Step 3 so user can modify their selection
  };

  const handleWashUpsellAccept = () => {
    setShowWashUpsell(false);
    setStep(4);
  };

  const handleWashUpsellDecline = () => {
    setSelectedUpsellWash(null);
    setSelectedUpsellExtras([]);
    setUpsellCarInput('');
    setUpsellCarCategory(null);
    setUpsellCarModel(null);
    setUpsellTargaInput('');
    setUpsellTargaError(null);
    setUpsellTargaResult(null);
    setUpsellTargaLoading(false);
    setUpsellTargaManualCategory(null);
    setShowWashUpsell(false);
    setStep(4);
  };

  const handleUpsellTargaSearch = async () => {
    const plate = normalizePlate(upsellTargaInput);
    if (!isValidItalianPlate(plate)) {
      setUpsellTargaError('Targa non valida. Inserisci una targa italiana (es. EX117YA).');
      return;
    }
    setUpsellTargaLoading(true);
    setUpsellTargaError(null);
    setUpsellTargaResult(null);
    setUpsellTargaManualCategory(null);
    setUpsellCarCategory(null);
    setUpsellCarModel(null);
    setSelectedUpsellWash(null);
    try {
      const result = await lookupTarga(plate);
      setUpsellTargaResult(result);
      setUpsellCarInput(`${result.carMake} ${result.carModel}`.trim());
      const classification = classifyVehicle(`${result.carMake} ${result.carModel}`.trim());
      setUpsellCarCategory(classification.category);
      setUpsellCarModel(classification.matchedModel || null);
    } catch (err: any) {
      setUpsellTargaError(err.message || 'Errore nella ricerca.');
    } finally {
      setUpsellTargaLoading(false);
    }
  };

  const handleBack = () => setStep(s => s - 1);

  const steps = [
    { id: 1, name: t('STEP 1: Date e Località') },
    { id: 2, name: t('STEP 2: Informazioni Conducente') },
    { id: 3, name: t('STEP 3: Opzioni e Assicurazioni') },
    { id: 4, name: t('STEP 4: Pagamento e Conferma') }
  ];

  const renderStepContent = () => {
    // Insurance is now automatic (KASKO included) - no selection UI needed


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
              {effectivePricePerDay && (
                <p className="text-gray-400 text-sm">Prezzo base: {formatPrice(effectivePricePerDay)}/giorno</p>
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


            {/* Utilitarie deadline - calendar max date handles blocking, no message needed */}

            {/* Availability is handled directly by date picker validation — no separate box needed */}

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

                          // Auto-Clear Return Date if Pickup > Return or invalid
                          // IMPROVED: Reset return date cleanly to avoid "return date before pickup date" errors
                          const newPickup = value;
                          const currentReturn = formData.returnDate;

                          if (currentReturn && newPickup > currentReturn) {
                            // Reset return date if it becomes invalid
                            setFormData(prev => ({ ...prev, pickupDate: value, returnDate: '', returnTime: '' }));
                          } else {
                            // Just update pickup
                            handleChange(e);
                          }
                        }}
                        // FIX: Ensure min date is never in the past, even if availability says so (which we fixed in logic, but safety first)
                        min={earliestAvailability?.earliestAvailableDate && earliestAvailability.earliestAvailableDate > today
                          ? earliestAvailability.earliestAvailableDate
                          : today}
                        max={isUtilitaria ? UTILITARIE_MAX_DATE : undefined}
                        required
                        className={`w-full bg-gray-800 rounded-md px-3 py-2 text-white text-sm border-2 transition-colors cursor-pointer ${errors.pickupDate || (formData.pickupDate && availabilityError)
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

                          // STRICT VALIDATION: Return Date must be at least the day after Pickup Date
                          if (formData.pickupDate && value <= formData.pickupDate) {
                            setErrors(prev => ({ ...prev, returnDate: 'Il noleggio minimo è di 1 giorno. Seleziona almeno il giorno successivo al ritiro.' }));
                            return;
                          }

                          // Check if return date is a Sunday or holiday
                          const returnDayOfWeek = getDayOfWeek(value);
                          if (returnDayOfWeek === 0) {
                            setErrors(prev => ({ ...prev, returnDate: 'Siamo chiusi la domenica. Seleziona un altro giorno.' }));
                            return;
                          }
                          if (isHoliday(value)) {
                            setErrors(prev => ({ ...prev, returnDate: 'Siamo chiusi nei giorni festivi. Seleziona un altro giorno.' }));
                            return;
                          }

                          // Clear return date errors if valid
                          setErrors(prev => ({ ...prev, returnDate: undefined, date: undefined }));

                          // CRITICAL: Check if this date has ANY valid return times
                          const validTimesForDate = getValidReturnTimes(value);
                          if (validTimesForDate.length === 0) {
                            setErrors(prev => ({ ...prev, returnDate: 'Questa data non è disponibile. Seleziona una data compatibile.' }));
                            return;
                          }

                          handleChange(e);
                        }}
                        min={formData.pickupDate ? (() => { const d = new Date(formData.pickupDate); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })() : today}
                        max={isUtilitaria ? UTILITARIE_MAX_DATE : undefined}
                        disabled={!formData.pickupDate || !formData.pickupTime}
                        required
                        className={`w-full bg-gray-800 rounded-md px-3 py-2 text-white text-sm border-2 transition-colors ${!formData.pickupDate || !formData.pickupTime
                          ? 'border-gray-700 opacity-50 cursor-not-allowed'
                          : errors.returnDate || errors.date || (formData.returnDate && availabilityError)
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
                      {formData.pickupDate && !formData.pickupTime && (
                        <p className="text-xs text-gray-400 mt-1">Seleziona prima l'ora di ritiro</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ora di riconsegna *
                        <span className="ml-2 text-xs text-gray-400">(auto-calcolata, modificabile)</span>
                      </label>
                      <select
                        name="returnTime"
                        value={formData.returnTime}
                        onChange={handleChange}
                        required
                        disabled={!formData.returnDate || getValidReturnTimes(formData.returnDate).length === 0}
                        className={`w-full bg-gray-800 rounded-md px-3 py-2 text-white text-sm border-2 transition-colors ${!formData.returnDate || getValidReturnTimes(formData.returnDate).length === 0
                          ? 'border-gray-700 opacity-50 cursor-not-allowed'
                          : formData.returnTime
                            ? 'border-green-500 focus:border-green-400'
                            : 'border-gray-700 focus:border-white'
                          }`}
                      >
                        {getValidReturnTimes(formData.returnDate).length > 0 ? (
                          getValidReturnTimes(formData.returnDate).map(time => <option key={time} value={time}>{time}</option>)
                        ) : (
                          <option value="">Seleziona prima una data</option>
                        )}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">Stessa ora del ritiro (auto), modificabile</p>
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
                  {shortSlotWarning && !availabilityError && (
                    <div className="mt-4 p-4 bg-amber-900/30 border-2 border-amber-500 rounded-lg">
                      <p className="text-amber-200 font-semibold">{shortSlotWarning}</p>
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
              {driverType === 'second' && (
                <>
                  <div><label className="text-sm text-gray-400">Data scadenza patente *</label><input type="date" name={`${prefix}licenseExpiryDate`} value={(driverData as any).licenseExpiryDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-1.5 mt-1 text-white text-sm" />{errors[`${prefix}licenseExpiryDate`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}licenseExpiryDate`]}</p>}</div>
                  <div><label className="text-sm text-gray-400">Paese di rilascio *</label><input type="text" name={`${prefix}countryOfIssue`} value={(driverData as any).countryOfIssue} onChange={handleChange} placeholder="es. Italia" className="w-full bg-gray-800 border-gray-700 rounded-md px-3 py-1.5 mt-1 text-white text-sm" />{errors[`${prefix}countryOfIssue`] && <p className="text-xs text-red-400 mt-1">{errors[`${prefix}countryOfIssue`]}</p>}</div>
                </>
              )}
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
              <h3 className="text-lg font-bold text-white mb-4">DOCUMENTI RICHIESTI (OBBLIGATORI)</h3>

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
                {(() => {
                  const isBMW_M4 = item.name?.includes('BMW M4') || item.name?.includes('M4 Competition');
                  const requiredYears = isBMW_M4 ? 5 : 3;

                  if (licenseYearsLocal < requiredYears && formData.licenseIssueDate) {
                    return (
                      <p className="text-red-500 font-bold">
                        ATTENZIONE: {isBMW_M4
                          ? 'Per la BMW M4 è richiesta una patente con almeno 5 anni di anzianità.'
                          : 'È richiesta una patente con almeno 3 anni di anzianità per noleggiare.'}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </section>

            {/* Second Driver */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">D. SECONDO CONDUCENTE (OPZIONALE)</h3>
              <div className="flex items-start mb-4">
                <input
                  type="checkbox"
                  name="addSecondDriver"
                  checked={formData.addSecondDriver}
                  onChange={handleChange}
                  id="add-second-driver"
                  className="h-4 w-4 mt-1 text-white bg-gray-700 border-gray-600 rounded focus:ring-white"
                />
                <label htmlFor="add-second-driver" className="ml-2 text-white">
                  Aggiungi un secondo conducente autorizzato
                </label>
              </div>

              <AnimatePresence>
              {formData.addSecondDriver && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700 space-y-4">
                  <p className="text-sm text-amber-300">Tutti i campi sono obbligatori per il secondo conducente.</p>
                  {renderDriverForm('second')}

                  {/* Second Driver Document Upload */}
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-white mb-3">Documenti secondo conducente *</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <DocumentUploader
                          title="PATENTE SECONDO CONDUCENTE"
                          details={["Solo fronte/retro", "Foto chiara e leggibile", "Formati: JPG, PNG, PDF (max 5MB)"]}
                          onFileChange={(file) => setFormData(prev => ({
                            ...prev,
                            secondDriver: { ...prev.secondDriver, licenseImage: file }
                          }))}
                        />
                        {errors['secondDriver.licenseImage'] && <p className="text-xs text-red-400 mt-1">{errors['secondDriver.licenseImage']}</p>}
                      </div>
                      <div>
                        <DocumentUploader
                          title="DOCUMENTO SECONDO CONDUCENTE"
                          details={["Carta d'identità o passaporto", "Foto chiara e leggibile", "Formati: JPG, PNG, PDF (max 5MB)"]}
                          onFileChange={(file) => setFormData(prev => ({
                            ...prev,
                            secondDriver: { ...prev.secondDriver, idImage: file }
                          }))}
                        />
                        {errors['secondDriver.idImage'] && <p className="text-xs text-red-400 mt-1">{errors['secondDriver.idImage']}</p>}
                      </div>
                    </div>
                  </div>
                </div>
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
          KASKO: {
            title: 'KASKO',
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
            {/* Insurance is now automatic (KASKO included) - no selection UI */}
            <section>
              <h3 className="text-lg font-bold text-white mb-4">A. ASSICURAZIONE INCLUSA</h3>
              <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
                <p className="text-green-300 font-semibold">KASKO inclusa automaticamente nel prezzo</p>
                <p className="text-sm text-gray-400 mt-2">Copertura completa KASKO per tutti i veicoli</p>
              </div>
            </section>


            {/* === DEPOSIT CHOICE (Urban/Corporate only) === */}
            {isUrbanOrCorporate && (
              <section className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-bold text-white mb-2">B. CAUZIONE</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Scegli se versare una cauzione al ritiro o se preferisci noleggiare senza cauzione con un supplemento sul totale.
                </p>
                {!formData.depositOption && (
                  <div className="p-3 bg-amber-900/20 border border-amber-500/50 rounded-lg mb-3">
                    <p className="text-amber-300 text-sm font-medium">
                      Seleziona un'opzione per la cauzione per continuare
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {/* Option 1: With deposit */}
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${formData.depositOption === 'with_deposit'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-600 hover:border-gray-500'}`}
                    onClick={() => setFormData(prev => ({ ...prev, depositOption: 'with_deposit' as const }))}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="depositOption"
                        value="with_deposit"
                        checked={formData.depositOption === 'with_deposit'}
                        onChange={() => setFormData(prev => ({ ...prev, depositOption: 'with_deposit' as const }))}
                        className="w-4 h-4 text-green-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">Con Cauzione</span>
                          <span className="font-bold text-green-400">
                            {formatDeposit(licenseYears >= 5 ? DEPOSIT_RULES.UTILITARIA.LICENSE_5_OR_MORE : DEPOSIT_RULES.UTILITARIA.LICENSE_UNDER_5)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {licenseYears >= 5
                            ? `Cauzione di €${DEPOSIT_RULES.UTILITARIA.LICENSE_5_OR_MORE} (patente ≥ 5 anni)`
                            : `Cauzione di €${DEPOSIT_RULES.UTILITARIA.LICENSE_UNDER_5} (patente < 5 anni)`
                          } — Prezzo base del noleggio
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: No deposit */}
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${formData.depositOption === 'no_deposit'
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-gray-600 hover:border-gray-500'}`}
                    onClick={() => setFormData(prev => ({ ...prev, depositOption: 'no_deposit' as const }))}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="depositOption"
                        value="no_deposit"
                        checked={formData.depositOption === 'no_deposit'}
                        onChange={() => setFormData(prev => ({ ...prev, depositOption: 'no_deposit' as const }))}
                        className="w-4 h-4 text-yellow-400"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">Senza Cauzione</span>
                          <span className="font-bold text-yellow-400">+30% sul totale</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Nessuna cauzione richiesta — Supplemento del 30% applicato al totale del noleggio
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {errors.depositOption && (
                  <p className="text-xs text-red-400 mt-2">{errors.depositOption}</p>
                )}
              </section>
            )}

            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">{isUrbanOrCorporate ? 'C' : 'B'}. CHILOMETRI</h3>
              {displayVehicleType === 'SUPERCAR' && !isMassimo ? (
                // Supercar km package selection: 50km/day or unlimited
                <div className="space-y-3">
                  {/* Option 1: 50km/day at €149/day */}
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${formData.kmPackageType === '50km'
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-gray-600 hover:border-gray-500'}`}
                    onClick={() => setFormData(prev => ({ ...prev, kmPackageType: '50km' as any }))}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white">50 km al giorno</span>
                        <p className="text-sm text-gray-400">Ideale per uso cittadino</p>
                      </div>
                      <span className="font-bold text-yellow-400">{formatPrice(149)}/giorno</span>
                    </div>
                  </div>
                  {/* Option 2: Unlimited km at standard pricing */}
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${formData.kmPackageType === 'unlimited'
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-gray-600 hover:border-gray-500'}`}
                    onClick={() => setFormData(prev => ({ ...prev, kmPackageType: 'unlimited' as any }))}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white">Km illimitati</span>
                        <p className="text-sm text-gray-400">Senza limiti di percorrenza</p>
                      </div>
                      <span className="font-bold text-white">Prezzo variabile</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Non-supercar: unlimited km always included
                <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors border-green-500 bg-green-500/10`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white">Km illimitati GRATIS nel noleggio</span>
                      <p className="text-sm text-gray-400">Basato sulla durata del noleggio</p>
                    </div>
                    <span className="font-bold text-white">Incluso</span>
                  </div>
                </div>
              )}
            </section>

            {/* === USAGE ZONE SELECTOR === */}
            {/* Hidden for Massimo (auto-set FUORI_ZONA) */}
            {vehicleType === 'SUPERCAR' && !isMassimo && formData.kmPackageType === 'unlimited' && (
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
                      } cursor-pointer`}
                    onClick={() => {
                      setFormData(p => ({ ...p, usageZone: 'FUORI_ZONA' }));
                    }}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="usageZone"
                        value="FUORI_ZONA"
                        checked={formData.usageZone === 'FUORI_ZONA'}
                        onChange={() => {
                          setFormData(p => ({ ...p, usageZone: 'FUORI_ZONA' }));
                        }}
                        className="w-4 h-4 text-yellow-400"
                      />
                      <label className="ml-3 text-white font-semibold">
                        Fuori zona (resto della Sardegna)
                      </label>
                    </div>
                    <p className="ml-7 text-xs text-gray-400 mt-1">
                      Utilizzo al di fuori dell'area di Cagliari e Sud Sardegna (solo Sardegna, non Italia continentale)
                    </p>
                    {/* Pricing warning for residents */}
                    {user && ((user as any)?.residencyZone === 'RESIDENTE_CAGLIARI_SUD_SARDEGNA' || (user as any)?.residencyZone === 'RESIDENTE_CA' || (user as any)?.residencyZone === 'RESIDENTE_SU') && item.priceResidentDaily && item.priceNonresidentDaily && (
                      <div className="ml-7 mt-2 p-2 bg-yellow-900/20 border border-yellow-600/50 rounded">
                        <p className="text-yellow-300 text-xs font-semibold">
                          Attenzione: Selezionando questa opzione, si applica la tariffa non residente: €{item.priceNonresidentDaily}/giorno invece di €{item.priceResidentDaily}/giorno
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Error message for residents trying to select Fuori zona */}
                  {usageZoneError && (
                    <div className="mt-3 p-4 bg-red-900/30 border-2 border-red-500 rounded-lg">
                      <p className="text-red-300 font-semibold text-sm">
                        {usageZoneError}
                      </p>
                    </div>
                  )}

                  {/* Validation error if no zone selected */}
                  {errors.usageZone && (
                    <p className="text-xs text-red-400 mt-2 flex items-center">
                      {errors.usageZone}
                    </p>
                  )}
                </div>
              </section>
            )}


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
                  <span className="ml-auto font-semibold text-green-400">INCLUSO</span>
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
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'nexi' }))}
                  className={`flex-1 py-2 text-sm font-semibold ${formData.paymentMethod === 'nexi' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                >
                  Carta
                </button>
              </div>

              {
                formData.paymentMethod === 'credit' ? (
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
                    {paymentError && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                        <p className="text-sm text-red-400 text-center">{paymentError}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <h4 className="text-base font-semibold text-white mb-3">METODO DI PAGAMENTO</h4>
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6 opacity-70" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6 opacity-70" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png" alt="PayPal" className="h-6 opacity-70" />
                      </div>
                      <p className="text-gray-400 text-sm text-center">
                        Sarai reindirizzato a una pagina di pagamento sicura per completare la transazione.
                      </p>
                    </div>
                  </>
                )
              }
            </section >

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
                  <p>Pacchetto km: {formData.kmPackageType === '50km' ? `50 km/giorno (${includedKm} km totali)` : (formData.kmPackageType === 'unlimited' || includedKm >= 9999) ? 'ILLIMITATI' : `${includedKm} km`}</p>
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
                      <p className="text-xs text-gray-400">{formData.secondDriver.email} - {formData.secondDriver.phone}</p>
                      <p className="text-xs text-gray-400">Patente: {formData.secondDriver.licenseNumber} - Rilascio: {formData.secondDriver.licenseIssueDate} - Scadenza: {formData.secondDriver.licenseExpiryDate}</p>
                      <p className="text-xs text-gray-400">Paese di rilascio: {formData.secondDriver.countryOfIssue}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-bold text-base text-white mb-2">ASSICURAZIONE E SERVIZI</p>
                  <hr className="border-gray-600 mb-2" />
                  <p>Assicurazione: KASKO (inclusa)</p>
                  <p>Lavaggio completo obbligatorio</p>
                  {formData.addSecondDriver && <p>Secondo guidatore</p>}
                  {isUrbanOrCorporate && formData.depositOption && (
                    <p className={formData.depositOption === 'no_deposit' ? 'text-yellow-400' : 'text-green-400'}>
                      {formData.depositOption === 'with_deposit'
                        ? `Cauzione: €${getDeposit()} (patente ${licenseYears >= 5 ? '≥' : '<'} 5 anni)`
                        : 'Senza cauzione (supplemento +30% applicato)'}
                    </p>
                  )}
                </div>

                <div>
                  <p className="font-bold text-base text-white mb-2">DETTAGLIO COSTI</p>
                  <hr className="border-gray-600 mb-2" />
                  <div className="flex justify-between">
                    <span>
                      Noleggio ({duration.days} gg × {effectivePricePerDay ? formatPrice(effectivePricePerDay) : '€0'})
                    </span>
                    <span>{formatPrice(rentalCost)}</span>
                  </div>
                  <div className="flex justify-between"><span>Pacchetto km ({formData.kmPackageType === '50km' ? `50 km/giorno` : (formData.kmPackageType === 'unlimited' || includedKm >= 9999) ? 'illimitati' : `${includedKm} km`})</span> <span>{formData.kmPackageType === '50km' ? 'Incluso' : formatPrice(kmPackageCost)}</span></div>
                  <div className="flex justify-between"><span className="notranslate">Assicurazione {formData.insuranceOption?.replace(/_/g, ' ') || 'KASKO'}</span> <span>{formatPrice(insuranceCost)}</span></div>
                  {/* Lavaggio is now included in the price - no additional fee */}
                  <div className="flex justify-between"><span>Spese di ritiro</span> <span>{formatPrice(pickupFee)}</span></div>
                  <div className="flex justify-between"><span>Spese di riconsegna</span> <span>{formatPrice(dropoffFee)}</span></div>
                  {noDepositSurcharge > 0 && <div className="flex justify-between text-yellow-400"><span>Supplemento senza cauzione (+30%)</span> <span>{formatPrice(noDepositSurcharge)}</span></div>}
                  {secondDriverFee > 0 && <div className="flex justify-between"><span>Secondo guidatore ({duration.days} gg × €10)</span> <span>{formatPrice(secondDriverFee)}</span></div>}
                  {youngDriverFee > 0 && <div className="flex justify-between"><span>Supplemento under 25 ({duration.days} gg × €10)</span> <span>{formatPrice(youngDriverFee)}</span></div>}
                  {recentLicenseFee > 0 && <div className="flex justify-between"><span>Supplemento patente recente ({duration.days} gg × €20)</span> <span>{formatPrice(recentLicenseFee)}</span></div>}
                  <hr className="border-gray-500 my-2" />


                  {membershipDiscount > 0 ? (
                    <>
                      <div className="flex justify-between text-gray-400 line-through"><span>Totale</span> <span>{formatPrice(originalTotal)}</span></div>
                      <div className="flex justify-between text-green-400 text-sm">
                        <span>Sconto {membershipTier} ({(membershipDiscount / originalTotal * 100).toFixed(0)}%)</span>
                        <span>-{formatPrice(membershipDiscount)}</span>
                      </div>
                      {onlineDiscountAmount > 0 && (
                        <div className="flex justify-between text-green-400 text-sm">
                          <span>Sconto Online -5%</span>
                          <span>-{formatPrice(onlineDiscountAmount)}</span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-yellow-400 text-sm">
                          <span>Codice Sconto ({appliedDiscount?.code})</span>
                          <span>-{formatPrice(discountAmount)}</span>
                        </div>
                      )}
                      {selectedUpsellWash && (
                        <div className="flex justify-between text-blue-400 text-sm">
                          <span>Lavaggio {selectedUpsellWash.name} (-10%)</span>
                          <span>+{formatPrice(washUpsellCost)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg text-white"><span>TOTALE</span> <span>{formatPrice(grandTotal)}</span></div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-gray-400"><span>Subtotale</span> <span>{formatPrice(finalTotal)}</span></div>
                      {onlineDiscountAmount > 0 && (
                        <div className="flex justify-between text-green-400 text-sm">
                          <span>Sconto Online -5%</span>
                          <span>-{formatPrice(onlineDiscountAmount)}</span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-yellow-400 text-sm">
                          <span>Codice Sconto ({appliedDiscount?.code})</span>
                          <span>-{formatPrice(discountAmount)}</span>
                        </div>
                      )}
                      {selectedUpsellWash && (
                        <div className="flex justify-between text-blue-400 text-sm">
                          <span>Lavaggio {selectedUpsellWash.name} (-10%)</span>
                          <span>+{formatPrice(washUpsellCost)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg"><span>TOTALE</span> <span>{formatPrice(grandTotal)}</span></div>
                    </>
                  )}
                </div>

                {/* Codice Sconto - Hidden for Supercars (except special clients who get dedicated codes) */}
                {(vehicleType !== 'SUPERCAR' || isMassimo) && (
                <div className="border-t border-gray-600 pt-4">
                  <p className="font-bold text-base text-white mb-3">CODICE SCONTO</p>
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                      <div>
                        <p className="text-green-400 font-bold">{appliedDiscount.code}</p>
                        <p className="text-green-300 text-sm">
                          {appliedDiscount.type === 'percentage'
                            ? `Sconto del ${appliedDiscount.amount}% applicato (-€${discountAmount.toFixed(2)})`
                            : `Sconto di €${appliedDiscount.amount} applicato`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeDiscount}
                        className="text-red-400 hover:text-red-300 text-sm underline"
                      >
                        Rimuovi
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Inserisci codice (es. BDAY-XXXX-XXXX)"
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm uppercase"
                      />
                      <button
                        type="button"
                        onClick={validateDiscountCode}
                        disabled={isValidatingCode || !discountCode.trim()}
                        className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isValidatingCode ? 'Verifica...' : 'Applica'}
                      </button>
                    </div>
                  )}
                  {discountCodeError && (
                    <p className="text-red-400 text-sm mt-2">{discountCodeError}</p>
                  )}
                </div>
                )}

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
                              {/* Automatic deposit calculation - single amount based on loyalty and license years */}
                              Cauzione: {formatDeposit(getDeposit())}
                              {getDeposit() === 0 && formData.depositOption === 'no_deposit' && ' (Senza cauzione — supplemento +30% applicato)'}
                              {getDeposit() === 0 && formData.depositOption !== 'no_deposit' && isLoyalCustomer && ' (Cliente Fedele)'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </section>
          </div >
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
      {/* Full-screen modal overlay */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm">
        <div className="min-h-screen px-2 sm:px-4 py-4 sm:py-8">
          <div className="max-w-6xl mx-auto">

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

            {/* Resident Zone Confirmation Modal */}
            <AnimatePresence>
              {showZoneConfirmation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setShowZoneConfirmation(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500/20 rounded-full mb-3 sm:mb-4">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-2xl font-bold text-yellow-500 mb-2">
                        ATTENZIONE – LIMITI DI UTILIZZO DEL VEICOLO
                      </h3>
                    </div>

                    <div className="space-y-3 sm:space-y-4 text-white mb-6 sm:mb-8">
                      <p className="text-sm sm:text-lg">
                        Hai selezionato <strong>"Cagliari e Sud Sardegna"</strong> come zona di utilizzo.
                      </p>
                      <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3 sm:p-4">
                        <p className="text-yellow-300 text-xs sm:text-sm font-semibold mb-2">
                          LIMITAZIONI GEOGRAFICHE
                        </p>
                        <p className="text-yellow-100 text-xs sm:text-sm">
                          Il veicolo è autorizzato <strong>SOLO</strong> all'interno dell'area di Cagliari e provincia del Sud Sardegna. L'utilizzo al di fuori di questa zona comporterà:
                        </p>
                        <ul className="list-disc list-inside mt-2 text-yellow-100 text-xs sm:text-sm space-y-1">
                          <li>Tracciamento GPS attivo</li>
                          <li>Penali economiche</li>
                          <li>Possibile sospensione del servizio</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button
                        onClick={handleZoneModification}
                        className="flex-1 px-4 sm:px-6 py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors text-sm sm:text-base"
                      >
                        Modifica selezione
                      </button>
                      <button
                        onClick={handleZoneConfirmation}
                        className="flex-1 px-4 sm:px-6 py-3 bg-yellow-500 text-black font-bold rounded-full hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confermo
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Wash Upsell Modal */}
              {showWashUpsell && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
                  onClick={handleWashUpsellDecline}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-gray-900 border border-gray-700 rounded-2xl p-5 sm:p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header image */}
                    <img
                      src="/prime-wash-header.jpeg"
                      alt="Prime Wash"
                      className="w-full h-48 sm:h-56 object-cover rounded-xl mb-5"
                    />

                    {/* Header */}
                    <div className="text-center mb-5 sm:mb-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide mb-1">
                        APPROFITTA SUBITO
                      </h3>
                      <div className="w-12 h-0.5 bg-white/30 mx-auto mb-4"></div>
                      <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                        Grazie per aver prenotato il tuo noleggio.
                      </p>
                      <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-md mx-auto mt-1">
                        Mentre ti godi la tua {categoryContext === 'urban-cars' || categoryContext === 'corporate-fleet' ? 'utilitaria' : 'supercar'}, lascia a noi la cura della <strong className="text-white">tua auto</strong>.
                      </p>
                      <p className="text-white font-semibold text-base sm:text-lg mt-3">
                        Solo per i clienti noleggio: <span className="text-green-400">–10%</span> su qualsiasi servizio lavaggio.
                      </p>
                    </div>

                    {/* Targa Search */}
                    <div className="mb-5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={upsellTargaInput}
                          onChange={(e) => setUpsellTargaInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                          onKeyDown={(e) => { if (e.key === 'Enter' && isValidItalianPlate(upsellTargaInput)) handleUpsellTargaSearch(); }}
                          placeholder="es. EX117YA"
                          className="flex-1 bg-gray-800/80 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors font-mono tracking-widest uppercase text-center"
                          maxLength={8}
                        />
                        <button
                          type="button"
                          onClick={handleUpsellTargaSearch}
                          disabled={!isValidItalianPlate(upsellTargaInput) || upsellTargaLoading}
                          className={`px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                            isValidItalianPlate(upsellTargaInput) && !upsellTargaLoading
                              ? 'bg-white text-black hover:bg-gray-200'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {upsellTargaLoading ? '...' : 'Cerca'}
                        </button>
                      </div>
                      {upsellTargaError && (
                        <div className="mt-3 text-center">
                          <p className="text-red-400 text-sm mb-2">{upsellTargaError}</p>
                          <p className="text-gray-400 text-xs mb-2">Seleziona manualmente la categoria del tuo veicolo:</p>
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => { setUpsellTargaManualCategory('urban'); setUpsellCarCategory('urban'); setUpsellCarInput('Veicolo cliente'); }}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                upsellTargaManualCategory === 'urban'
                                  ? 'bg-emerald-600/20 text-emerald-400 border-2 border-emerald-500'
                                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-emerald-500'
                              }`}
                            >
                              URBAN
                            </button>
                            <button
                              type="button"
                              onClick={() => { setUpsellTargaManualCategory('maxi'); setUpsellCarCategory('maxi'); setUpsellCarInput('Veicolo cliente'); }}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                upsellTargaManualCategory === 'maxi'
                                  ? 'bg-amber-600/20 text-amber-400 border-2 border-amber-500'
                                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-amber-500'
                              }`}
                            >
                              MAXI
                            </button>
                          </div>
                        </div>
                      )}
                      {upsellTargaResult && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-gray-700/60 text-white border border-gray-600">
                            {upsellTargaResult.plate}
                          </span>
                          {upsellCarCategory && (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              upsellCarCategory === 'urban'
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40'
                                : 'bg-amber-600/20 text-amber-400 border border-amber-600/40'
                            }`}>
                              {upsellCarModel && <span className="opacity-70 mr-1">{upsellCarModel} →</span>}
                              {upsellCarCategory === 'urban' ? 'PRIME URBAN' : 'PRIME MAXI'}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Manual category pick if classifyVehicle returned null */}
                      {upsellTargaResult && !upsellCarCategory && (
                        <div className="mt-3 text-center">
                          <p className="text-gray-400 text-xs mb-2">
                            Veicolo trovato: {upsellTargaResult.description || `${upsellTargaResult.carMake} ${upsellTargaResult.carModel}`}. Seleziona la categoria:
                          </p>
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => { setUpsellTargaManualCategory('urban'); setUpsellCarCategory('urban'); }}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                upsellTargaManualCategory === 'urban'
                                  ? 'bg-emerald-600/20 text-emerald-400 border-2 border-emerald-500'
                                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-emerald-500'
                              }`}
                            >
                              URBAN
                            </button>
                            <button
                              type="button"
                              onClick={() => { setUpsellTargaManualCategory('maxi'); setUpsellCarCategory('maxi'); }}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                upsellTargaManualCategory === 'maxi'
                                  ? 'bg-amber-600/20 text-amber-400 border-2 border-amber-500'
                                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-amber-500'
                              }`}
                            >
                              MAXI
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Service grid — card design with images */}
                    {upsellCarCategory && (
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        {(upsellCarCategory === 'urban' ? URBAN_SERVICES : MAXI_SERVICES).map((svc) => {
                          const discountedPrice = roundToTwoDecimals(svc.price * 0.90);
                          const isSelected = selectedUpsellWash?.id === svc.id;
                          return (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => setSelectedUpsellWash(isSelected ? null : svc)}
                              className={`text-left rounded-xl border overflow-hidden transition-all ${
                                isSelected
                                  ? 'border-white ring-2 ring-white/50'
                                  : 'border-gray-700 hover:border-gray-500'
                              }`}
                            >
                              <img
                                src={svc.image || '/luxurywash.jpeg'}
                                alt={svc.name}
                                className="w-full h-auto object-contain"
                              />
                              <div className="p-2.5">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-gray-500 line-through text-xs">€{svc.price % 1 === 0 ? svc.price : svc.price.toFixed(2)}</span>
                                  <span className="text-white font-bold text-sm">€{discountedPrice % 1 === 0 ? discountedPrice : discountedPrice.toFixed(2)}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Servizi Aggiuntivi — multi-select extras */}
                    {upsellCarCategory && (
                      <div className="mb-5">
                        <h4 className="text-white font-bold text-sm tracking-widest mb-3">SERVIZI AGGIUNTIVI</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {UPSELL_EXTRAS.map((svc) => {
                            const discountedPrice = roundToTwoDecimals(svc.price * 0.90);
                            const isSelected = selectedUpsellExtras.some(s => s.id === svc.id);
                            return (
                              <button
                                key={svc.id}
                                type="button"
                                onClick={() => setSelectedUpsellExtras(prev =>
                                  isSelected ? prev.filter(s => s.id !== svc.id) : [...prev, svc]
                                )}
                                className={`text-left rounded-xl border overflow-hidden transition-all ${
                                  isSelected
                                    ? 'border-blue-400 ring-2 ring-blue-400/50'
                                    : 'border-gray-700 hover:border-gray-500'
                                }`}
                              >
                                <img
                                  src={svc.image || '/luxurywash.jpeg'}
                                  alt={svc.name}
                                  className="w-full h-auto object-contain"
                                />
                                <div className="p-2.5">
                                  <p className="text-white text-[11px] font-semibold leading-tight mb-1">{svc.name}</p>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-gray-500 line-through text-xs">€{svc.price % 1 === 0 ? svc.price : svc.price.toFixed(2)}</span>
                                    <span className="text-white font-bold text-sm">€{discountedPrice % 1 === 0 ? discountedPrice : discountedPrice.toFixed(2)}</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={handleWashUpsellAccept}
                        disabled={!selectedUpsellWash && selectedUpsellExtras.length === 0}
                        className={`w-full py-3.5 rounded-full font-bold text-sm sm:text-base transition-all ${
                          selectedUpsellWash || selectedUpsellExtras.length > 0
                            ? 'bg-white text-black hover:bg-gray-100'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {selectedUpsellWash || selectedUpsellExtras.length > 0
                          ? `Aggiungi servizi – €${totalWashUpsellCost % 1 === 0 ? totalWashUpsellCost : totalWashUpsellCost.toFixed(2)}`
                          : 'Seleziona un servizio'}
                      </button>
                      <button
                        type="button"
                        onClick={handleWashUpsellDecline}
                        className="w-full py-3 text-gray-400 hover:text-white text-sm transition-colors"
                      >
                        No, grazie
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <canvas ref={canvasRef} className="hidden"></canvas>

            <div className="w-full max-w-4xl mx-auto mb-6 sm:mb-12 px-2 sm:px-4">
              <div className="flex items-center justify-between">
                {steps.map((s, index) => (
                  <React.Fragment key={s.id}>
                    <div className="flex flex-col items-center text-center flex-shrink-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 text-sm sm:text-base transition-all duration-300 ${step >= s.id ? 'bg-white border-white text-black' : 'border-gray-600 text-gray-400'}`}>{s.id}</div>
                      <p className={`mt-1 sm:mt-2 text-[10px] sm:text-xs font-semibold max-w-[60px] sm:max-w-none leading-tight ${step >= s.id ? 'text-white' : 'text-gray-500'}`}>{s.name}</p>
                    </div>
                    {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 sm:mx-4 transition-colors duration-300 ${step > s.id ? 'bg-white' : 'bg-gray-700'}`}></div>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className={step === 4 ? "lg:grid lg:grid-cols-3 lg:gap-8 px-2 sm:px-4" : "px-2 sm:px-4"}>
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
                          {formData.kmPackageType === '50km' ? `50 km/giorno` : (formData.kmPackageType === 'unlimited' || includedKm >= 9999) ? 'ILLIMITATI' : `${includedKm} km`}
                        </span>
                      </div>

                      <div className="border-t border-gray-700 my-2"></div>

                      <div className="flex justify-between"><span className="text-gray-400">Noleggio {item.name}</span><span className="text-white font-medium">{formatPrice(rentalCost)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Pacchetto chilometrici</span><span className="text-white font-medium">{formData.kmPackageType === '50km' ? 'Incluso' : formatPrice(kmPackageCost)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400 notranslate">Assicurazione {formData.insuranceOption?.replace(/_/g, ' ') || 'KASKO'}</span><span className="text-white font-medium">{formatPrice(insuranceCost)}</span></div>
                      {/* Lavaggio is now included in the price - no additional fee */}
                      <div className="flex justify-between"><span className="text-gray-400">Spese di ritiro</span><span className="text-white font-medium">{formatPrice(pickupFee)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Spese di riconsegna</span><span className="text-white font-medium">{formatPrice(dropoffFee)}</span></div>
                      {secondDriverFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Secondo guidatore</span><span className="text-white font-medium">{formatPrice(secondDriverFee)}</span></div>}
                      {youngDriverFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Supplemento under 25</span><span className="text-white font-medium">{formatPrice(youngDriverFee)}</span></div>}
                      {recentLicenseFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Supplemento patente recente</span><span className="text-white font-medium">{formatPrice(recentLicenseFee)}</span></div>}
                      {noDepositSurcharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-yellow-400">Supplemento senza cauzione (+30%)</span>
                          <span className="text-yellow-400 font-medium">{formatPrice(noDepositSurcharge)}</span>
                        </div>
                      )}
                      {selectedUpsellWash && (
                        <div className="flex justify-between">
                          <span className="text-blue-400">Lavaggio auto (-10%)</span>
                          <span className="text-blue-400 font-medium">{formatPrice(washUpsellCost)}</span>
                        </div>
                      )}
                      {selectedUpsellExtras.map(svc => (
                        <div key={svc.id} className="flex justify-between">
                          <span className="text-blue-400 text-xs">{svc.name} (-10%)</span>
                          <span className="text-blue-400 font-medium">{formatPrice(roundToTwoDecimals(svc.price * 0.90))}</span>
                        </div>
                      ))}

                      <div className="border-t border-white/20 my-2"></div>

                      {membershipDiscount > 0 ? (
                        <>
                          <div className="flex justify-between text-gray-400 line-through text-sm"><span>Totale</span><span>{formatPrice(originalTotal)}</span></div>
                          <div className="flex justify-between text-green-400 text-sm">
                            <span>Sconto {membershipTier}</span>
                            <span>-{formatPrice(membershipDiscount)}</span>
                          </div>
                          {onlineDiscountAmount > 0 && (
                            <div className="flex justify-between text-green-400 text-sm">
                              <span>Sconto Online -5%</span>
                              <span>-{formatPrice(onlineDiscountAmount)}</span>
                            </div>
                          )}
                          {discountAmount > 0 && (
                            <div className="flex justify-between text-yellow-400 text-sm">
                              <span>Codice Sconto</span>
                              <span>-{formatPrice(discountAmount)}</span>
                            </div>
                          )}
                          {(selectedUpsellWash || selectedUpsellExtras.length > 0) && (
                            <div className="flex justify-between text-blue-400 text-sm">
                              <span>Lavaggio + Servizi (-10%)</span>
                              <span>+{formatPrice(totalWashUpsellCost)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xl font-bold"><span className="text-white">TOTALE</span><span className="text-white">{formatPrice(grandTotal)}</span></div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-gray-400 text-sm"><span>Subtotale</span><span>{formatPrice(finalTotal)}</span></div>
                          {onlineDiscountAmount > 0 && (
                            <div className="flex justify-between text-green-400 text-sm">
                              <span>Sconto Online -5%</span>
                              <span>-{formatPrice(onlineDiscountAmount)}</span>
                            </div>
                          )}
                          {discountAmount > 0 && (
                            <div className="flex justify-between text-yellow-400 text-sm">
                              <span>Codice Sconto</span>
                              <span>-{formatPrice(discountAmount)}</span>
                            </div>
                          )}
                          {(selectedUpsellWash || selectedUpsellExtras.length > 0) && (
                            <div className="flex justify-between text-blue-400 text-sm">
                              <span>Lavaggio + Servizi (-10%)</span>
                              <span>+{formatPrice(totalWashUpsellCost)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xl font-bold"><span className="text-white">TOTALE</span><span className="text-white">{formatPrice(grandTotal)}</span></div>
                        </>
                      )}
                      {isUrbanOrCorporate && formData.depositOption === 'with_deposit' && getDeposit() > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Cauzione al ritiro</span>
                            <span className="text-white font-medium">€{getDeposit()}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Restituita dopo la riconsegna</p>
                        </div>
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
                      className="bg-gray-900/50 p-3 sm:p-6 md:p-8 rounded-lg border border-gray-800 relative"
                    >
                      <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-colors z-10 p-2"
                        aria-label="Close"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                  {/* Show payment error near the button so it's visible on all devices */}
                  {paymentError && step === steps.length && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                      <p className="text-sm text-red-400 text-center">{paymentError}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 sm:mt-8">
                    <button type="button" onClick={handleBack} disabled={step === 1} className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gray-700 text-white text-sm sm:text-base font-bold rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('Back')}</button>
                    {step < steps.length ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-black text-sm sm:text-base font-bold rounded-full hover:bg-gray-200 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={(step === 1 && !!availabilityError) || (step === 1 && isCheckingAvailability) || (licenseYears < 2 && step === 2) || (step === 2 && !formData.confirmsInformation) || (step === 3 && isUrbanOrCorporate && !formData.depositOption)}
                      >
                        Continua
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isProcessing || !formData.agreesToTerms || !formData.agreesToPrivacy || !formData.confirmsDocuments}
                        className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-black text-sm sm:text-base font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      >
                        {isProcessing ? 'Elaborazione in corso...' : 'CONFERMA PRENOTAZIONE'}
                      </button>
                    )}
                  </div>
                </form>
              </main>
            </div>
          </div>
        </div>
      </div >
    </>
  );
};

export default CarBookingWizard;

