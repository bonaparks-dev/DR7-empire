import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { SERVICES, Service } from './CarWashServicesPage';
import { useCarWashAvailability } from '../hooks/useRealtimeBookings';
import { getUserCreditBalance, deductCredits, addCredits, hasSufficientBalance } from '../utils/creditWallet';

interface CartItem {
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
  option?: string;
}

const CarWashBookingPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  // Existing clients state
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Support both single serviceId (legacy) and cartItems (new multi-service)
  const locationState = location.state as any;
  const cartItems: CartItem[] = locationState?.cartItems || [];
  const cartTotal: number = locationState?.total || 0;

  // Legacy single service support
  const serviceId = locationState?.serviceId;
  const selectedService = serviceId ? SERVICES.find(s => s.id === serviceId) : null;

  // Determine if we have valid booking data
  const hasCartItems = cartItems.length > 0;
  const hasSelectedService = !!selectedService;
  const hasValidBooking = hasCartItems || hasSelectedService;

  // Debug logging
  useEffect(() => {
    console.log('CarWashBookingPage - cartItems:', cartItems);
    console.log('CarWashBookingPage - cartTotal:', cartTotal);
    console.log('CarWashBookingPage - serviceId:', serviceId);
    console.log('CarWashBookingPage - selectedService:', selectedService);
  }, [cartItems, cartTotal, serviceId, selectedService]);

  // Get today's date in YYYY-MM-DD format - always get fresh current date
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = getTodayDate();

  // === HOLIDAY LOGIC ===
  const ITALIAN_HOLIDAYS = [
    '01-01', '06-01', '25-04', '01-05', '02-06', '15-08', '01-11', '08-12', '25-12', '26-12',
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

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    codiceFiscale: '',
    indirizzo: '',
    numeroCivico: '',
    cittaResidenza: '',
    codicePostale: '',
    provinciaResidenza: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isSubmittingRef = useRef(false);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);

  // Credit wallet state
  const [paymentMethod, setPaymentMethod] = useState<'nexi' | 'credit'>('nexi');
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Birthday discount code state
  const [discountCode, setDiscountCode] = useState<string>('');
  const [discountCodeError, setDiscountCodeError] = useState<string | null>(null);
  const [discountCodeValid, setDiscountCodeValid] = useState<boolean>(false);
  const [isValidatingCode, setIsValidatingCode] = useState<boolean>(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    type: 'rental' | 'car_wash';
  } | null>(null);

  // Use the real-time hook for bookings
  const { bookings: existingBookings, loading: bookingsLoading } = useCarWashAvailability(formData.appointmentDate);

  // Build duration map from SERVICES (real durations from CarWashServicesPage)
  // Parses duration strings like '10 min', '90 min', '120 min' into hours
  const SERVICE_DURATION_MAP: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    for (const svc of SERVICES) {
      if (svc.duration && svc.duration !== '-') {
        const minutes = parseInt(svc.duration, 10);
        if (!isNaN(minutes)) {
          map[svc.id] = minutes / 60;
        }
      }
    }
    return map;
  }, []);

  // Real working durations for admin calendar (not shown to customers)
  // Urban = lower value, Maxi = higher value
  const CALENDAR_DURATION_MAP: Record<string, number> = {
    'urban-interior': 40,
    'urban-exterior': 30,
    'urban-full': 80,
    'urban-full-n2': 80,
    'urban-top-shine': 120,
    'urban-vip': 140,
    'urban-luxury': 220,
    'maxi-interior': 45,
    'maxi-exterior': 40,
    'maxi-full': 90,
    'maxi-full-n2': 90,
    'maxi-top-shine': 130,
    'maxi-vip': 150,
    'maxi-luxury': 280,
  };

  // Get calendar duration in minutes for a service (for admin calendar + slot blocking)
  const getCalendarDurationMinutes = (serviceId: string): number => {
    return CALENDAR_DURATION_MAP[serviceId] || (SERVICE_DURATION_MAP[serviceId] ? SERVICE_DURATION_MAP[serviceId] * 60 : 15);
  };

  // Get duration by service ID (accurate), with price-based fallback for DB bookings
  const getServiceDurationById = (serviceId: string): number => {
    // Use calendar duration (real working time) for slot calculations
    if (CALENDAR_DURATION_MAP[serviceId]) {
      return CALENDAR_DURATION_MAP[serviceId] / 60; // convert minutes to hours
    }
    return SERVICE_DURATION_MAP[serviceId] || 0.25; // default 15 min if unknown
  };

  const getServiceDurationByPrice = (price: number): number => {
    // Fallback for existing DB bookings that only have price_total
    if (price <= 10) return 0.25;
    if (price <= 15) return 0.25;
    if (price <= 20) return 0.5;
    if (price <= 25) return 0.75;
    if (price <= 49) return 1.5;
    if (price <= 75) return 2;
    return 2.5;
  };

  // Log bookings for debugging
  useEffect(() => {
    console.log('Existing bookings from hook:', existingBookings);
    console.log('Selected date:', formData.appointmentDate);
  }, [existingBookings, formData.appointmentDate]);

  // Enforce min date on mount and update for mobile browsers
  useEffect(() => {
    const dateInput = document.querySelector('input[name="appointmentDate"]') as HTMLInputElement;
    if (dateInput) {
      dateInput.setAttribute('min', getTodayDate());
    }
  }, []);

  // Removed Stripe initialization - now using Nexi

  useEffect(() => {
    if (!hasValidBooking) {
      navigate('/car-wash-services');
    }
  }, [hasValidBooking, navigate]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  // Fetch existing clients for selection
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('customers_extended')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setExistingClients(data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return [];

    const query = clientSearchQuery.toLowerCase();
    return existingClients.filter(client => {
      const searchText = [
        client.nome,
        client.cognome,
        client.denominazione,
        client.ragione_sociale,
        client.email,
        client.codice_fiscale,
        client.telefono
      ].filter(Boolean).join(' ').toLowerCase();

      return searchText.includes(query);
    }).slice(0, 10); // Limit to 10 results
  }, [clientSearchQuery, existingClients]);

  // Handle client selection
  const handleClientSelect = (client: any) => {
    console.log('Selected client:', client);

    // Build full name based on client type
    let fullName = '';
    if (client.tipo_cliente === 'persona_fisica') {
      fullName = `${client.nome || ''} ${client.cognome || ''}`.trim();
    } else if (client.tipo_cliente === 'azienda') {
      fullName = client.denominazione || client.ragione_sociale || '';
    } else if (client.tipo_cliente === 'pubblica_amministrazione') {
      fullName = client.denominazione || client.ente_ufficio || '';
    }

    // Auto-fill form with client data
    setFormData(prev => ({
      ...prev,
      fullName: fullName,
      email: client.email || '',
      phone: client.telefono || '',
      codiceFiscale: client.codice_fiscale || '',
      indirizzo: client.indirizzo || '',
      cittaResidenza: client.citta || '',
      codicePostale: client.codice_postale || '',
      provinciaResidenza: client.provincia || '',
    }));

    // Close dropdown and clear search
    setClientSearchQuery('');
    setShowClientDropdown(false);
  };

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

  // Clear selected time when date changes to ensure valid time selection
  useEffect(() => {
    if (formData.appointmentDate && formData.appointmentTime) {
      // Check if the currently selected time is still valid for the selected date
      const availableSlots = getAvailableTimeSlots();
      if (!availableSlots.includes(formData.appointmentTime)) {
        setFormData(prev => ({ ...prev, appointmentTime: '' }));
      }
    }
  }, [formData.appointmentDate]);

  // Removed Stripe payment intent and card element mounting - now using Nexi redirect

  // Validation functions
  const validateCodiceFiscale = (cf: string): boolean => {
    const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
    return cf.length === 16 && cfRegex.test(cf.toUpperCase());
  };

  const validateItalianPhone = (phone: string): boolean => {
    const phoneRegex = /^(\+39|0039)?[\s]?[0-9]{9,13}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    // Auto-uppercase for specific fields
    if (name === 'codiceFiscale' || name === 'provinciaResidenza') {
      newValue = value.toUpperCase();
    }

    // Block past dates immediately when date field changes
    if (name === 'appointmentDate' && value) {
      if (value < minDate) {
        setErrors(prev => ({
          ...prev,
          appointmentDate: lang === 'it'
            ? 'Non puoi selezionare date passate. Seleziona da oggi in poi.'
            : 'You cannot select past dates. Select from today onwards.'
        }));
        setFormData(prev => ({ ...prev, appointmentDate: '' }));
        return;
      }

      // Block Holidays
      if (['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'].includes(value)) {
        setErrors(prev => ({
          ...prev,
          appointmentDate: lang === 'it'
            ? 'Siamo chiusi per ferie. Riapriremo il 5 Gennaio 2026.'
            : 'We are closed for holidays. We will reopen on January 5th, 2026.'
        }));
        setFormData(prev => ({ ...prev, appointmentDate: '' }));
        return;
      }

      if (isHoliday(value)) {
        setErrors(prev => ({
          ...prev,
          appointmentDate: lang === 'it'
            ? 'Non puoi prenotare nei giorni festivi. Siamo chiusi.'
            : 'You cannot book on holidays. We are closed.'
        }));
        setFormData(prev => ({ ...prev, appointmentDate: '' }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Double-check on blur in case mobile browser allows past dates
    if (value && value < minDate) {
      setErrors(prev => ({
        ...prev,
        appointmentDate: lang === 'it'
          ? 'Non puoi selezionare date passate. Seleziona da oggi in poi.'
          : 'You cannot select past dates. Select from today onwards.'
      }));
      setFormData(prev => ({ ...prev, appointmentDate: '' }));
    }
  };

  const getAllTimeSlotsWithAvailability = () => {
    if ((!selectedService && !hasCartItems) || !formData.appointmentDate) return [];

    // For cart items, sum individual durations by service ID; for single service, look up by ID
    const serviceDuration = hasCartItems
      ? cartItems.reduce((total, item) => total + getServiceDurationById(item.serviceId) * item.quantity, 0)
      : getServiceDurationById(selectedService?.id || '');

    // Weekdays: 9:00-13:00 / 15:00-19:00 (must FINISH by 13:00 or 19:00)
    // Saturday: 9:00-17:00 continuous (must FINISH by 17:00)
    const [year, month, day] = formData.appointmentDate.split('-').map(Number);
    const isSaturday = new Date(year, month - 1, day).getDay() === 6;

    // 15-minute intervals to maximize booking capacity
    const allTimeSlots = isSaturday
      ? [
          '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
          '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45',
          '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45',
          '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45'
        ]
      : [
          '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
          '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45',
          '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45',
          '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45'
        ];

    // Parse selected date as local date to avoid timezone issues
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.toDateString() === today.toDateString();

    // Helper to convert time string to minutes
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    // Helper to check if a time range overlaps with existing bookings
    // Only 1 booking per slot — no double bookings
    const MAX_CONCURRENT_WASHES = 1;

    const hasOverlap = (startTime: string, durationHours: number) => {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + (durationHours * 60);

      let overlappingCount = 0;
      for (const booking of existingBookings) {
        if (!booking.appointment_time) continue;
        const bookingStart = timeToMinutes(booking.appointment_time);
        const bookingDuration = getServiceDurationByPrice(booking.price_total / 100);
        const bookingEnd = bookingStart + (bookingDuration * 60);

        if (startMinutes < bookingEnd && endMinutes > bookingStart) {
          overlappingCount++;
        }
      }

      return overlappingCount >= MAX_CONCURRENT_WASHES;
    };

    // Helper to check if service can fit in time range
    // Rule from Valerio: must FINISH by 13:00 (morning), 19:00 (afternoon), 17:00 (Saturday)
    const canFitInRange = (startTime: string, durationHours: number) => {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + (durationHours * 60);

      // Saturday: continuous 9:00-17:00 — must finish by 17:00
      if (isSaturday) {
        return startMinutes >= 9 * 60 && endMinutes <= 17 * 60;
      }

      // Weekdays: morning must finish by 13:00, afternoon must finish by 19:00
      // Morning window: start from 9:00, end by 13:00
      if (startMinutes >= 9 * 60 && endMinutes <= 13 * 60) return true;
      // Afternoon window: start from 15:00, end by 19:00
      if (startMinutes >= 15 * 60 && endMinutes <= 19 * 60) return true;

      return false;
    };

    return allTimeSlots.map(slot => {
      let reason = '';
      let available = true;

      if (!canFitInRange(slot, serviceDuration)) {
        reason = 'Service too long';
        available = false;
      } else if (isToday) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const slotMinutes = timeToMinutes(slot);
        if (slotMinutes < currentMinutes + 120) {
          reason = 'Too soon';
          available = false;
        }
      }

      if (available && hasOverlap(slot, serviceDuration)) {
        reason = 'Already booked';
        available = false;
      }

      return { time: slot, available, reason };
    });
  };

  const getAvailableTimeSlots = () => {
    return getAllTimeSlotsWithAvailability()
      .filter(slot => slot.available)
      .map(slot => slot.time);
  };

  const isValidAppointmentTime = (date: string, time: string) => {
    if (!date || !time || !hasValidBooking) return false;

    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    const dayOfWeek = appointmentDate.getDay();

    // Sunday = 0 - closed on Sundays
    if (dayOfWeek === 0) return false;

    // Closed on Holidays
    if (isHoliday(date)) return false;

    // Check if the selected time is in the available slots
    const availableSlots = getAvailableTimeSlots();
    return availableSlots.includes(time);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    // Required: Nome e cognome, Telefono, Email
    if (!formData.fullName) newErrors.fullName = lang === 'it' ? 'Il nome è obbligatorio' : 'Name is required';
    if (!formData.email) newErrors.email = lang === 'it' ? 'L\'email è obbligatoria' : 'Email is required';
    if (!formData.phone) {
      newErrors.phone = lang === 'it' ? 'Il telefono è obbligatorio' : 'Phone is required';
    } else if (!validateItalianPhone(formData.phone)) {
      newErrors.phone = lang === 'it' ? 'Formato telefono non valido' : 'Invalid phone format';
    }
    // Codice Fiscale, indirizzo, etc. are now optional
    if (!formData.appointmentDate) newErrors.appointmentDate = lang === 'it' ? 'La data è obbligatoria' : 'Date is required';
    if (!formData.appointmentTime) newErrors.appointmentTime = lang === 'it' ? 'L\'ora è obbligatoria' : 'Time is required';

    // Validate date is not in the past (strict comparison with today's date string)
    if (formData.appointmentDate) {
      if (formData.appointmentDate < minDate) {
        newErrors.appointmentDate = lang === 'it' ? 'La data non può essere nel passato. Seleziona da oggi in poi.' : 'Date cannot be in the past. Select from today onwards.';
      }
    }

    // Validate working hours
    if (formData.appointmentDate && formData.appointmentTime && !newErrors.appointmentDate) {
      if (!isValidAppointmentTime(formData.appointmentDate, formData.appointmentTime)) {
        // Parse date string as local date to avoid timezone issues
        const [year, month, day] = formData.appointmentDate.split('-').map(Number);
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        if (dayOfWeek === 0) {
          newErrors.appointmentDate = lang === 'it' ? 'Siamo chiusi la domenica' : 'We are closed on Sundays';
        } else if (isHoliday(formData.appointmentDate)) {
          newErrors.appointmentDate = lang === 'it' ? 'Siamo chiusi nei giorni festivi' : 'We are closed on holidays';
        } else {
          newErrors.appointmentTime = lang === 'it' ? 'Orario disponibile: Lun-Ven 9:00-13:00 / 15:00-19:00, Sabato 9:00-17:00 (minimo 2 ore in anticipo)' : 'Available hours: Mon-Fri 9:00-1:00 PM / 3:00-7:00 PM, Saturday 9:00-5:00 PM (minimum 2 hours in advance)';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    // Use cart total if we have cart items, otherwise use selected service price
    const basePrice = hasCartItems ? cartTotal : (selectedService?.price || 0);
    const afterOnlineDiscount = basePrice * 0.95;
    const discount = appliedDiscount?.type === 'car_wash' ? Math.min(appliedDiscount.amount, afterOnlineDiscount) : 0;
    return Math.max(0, afterOnlineDiscount - discount);
  };

  const getBasePrice = () => {
    return hasCartItems ? cartTotal : (selectedService?.price || 0);
  };

  const onlineDiscountAmount = getBasePrice() * 0.05;

  const birthdayDiscountAmount = appliedDiscount?.type === 'car_wash' ? Math.min(appliedDiscount.amount, getBasePrice() * 0.95) : 0;

  // Validate birthday discount code
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountCodeError('Inserisci un codice sconto');
      return;
    }

    // Block scooter wash from using birthday discount
    if (serviceId === 'scooter-wash') {
      setDiscountCodeError('Il codice sconto compleanno non è applicabile al lavaggio scooter');
      return;
    }

    // Check if user is logged in
    if (!user) {
      setDiscountCodeError('Devi effettuare il login per utilizzare un codice sconto');
      return;
    }

    setIsValidatingCode(true);
    setDiscountCodeError(null);

    try {
      const response = await fetch('/.netlify/functions/validate-discount-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          code: discountCode.trim().toUpperCase(),
          serviceType: 'lavaggi',
          service_type: 'lavaggi',
          orderTotal: Math.round(calculateTotal() * 100),
          order_total: Math.round(calculateTotal() * 100)
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

      if (result.car_wash_used) {
        setDiscountCodeError('Lo sconto lavaggio di questo codice è già stato utilizzato');
        setDiscountCodeValid(false);
        setAppliedDiscount(null);
        return;
      }

      // For birthday codes ONLY: verify the logged-in user matches the code's customer
      // Marketing codes can be used by anyone
      // Skip check if no customer_email/customer_phone is set on the code
      if (result.code_type === 'birthday' && (result.customer_email || result.customer_phone)) {
        const userEmail = user.email?.toLowerCase().trim();
        const userPhone = user.phone?.replace(/[\s\-\+]/g, '');
        const codeCustomerPhone = result.customer_phone?.replace(/[\s\-\+]/g, '');

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

      // Apply discount based on code type
      let discountAmount = result.car_wash_discount || 0;
      let discountType: string = 'car_wash';

      if (result.code_type !== 'birthday' && result.value_type) {
        discountType = result.value_type; // 'fixed' or 'percentage'
        discountAmount = result.value_amount || 0;
      }

      setDiscountCodeValid(true);
      setAppliedDiscount({
        code: result.code,
        amount: discountAmount || 10,
        type: discountType
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

  const removeDiscount = () => {
    setDiscountCode('');
    setDiscountCodeValid(false);
    setAppliedDiscount(null);
    setDiscountCodeError(null);
  };

  const markDiscountCodeAsUsed = async (bookingId: string) => {
    if (!appliedDiscount?.code) return;

    try {
      await fetch('/.netlify/functions/validate-discount-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_car_wash',
          code: appliedDiscount.code,
          booking_id: bookingId
        })
      });
      console.log('Discount code marked as used:', appliedDiscount.code);
    } catch (error) {
      console.error('Error marking discount code as used:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called');
    console.log('selectedService:', selectedService);
    console.log('validation result:', validate());

    if (!validate() || !hasValidBooking) {
      console.log('Validation failed or no valid booking data');
      return;
    }

    // Prepare booking data and open payment modal
    console.log('User object:', user);
    console.log('User ID:', user?.id);

    // Create full appointment timestamp in Europe/Rome timezone
    // This ensures the time is always interpreted as Italy time, regardless of user's browser timezone
    // Determine DST by checking the UTC offset for the selected date in Europe/Rome
    const testDate = new Date(`${formData.appointmentDate}T12:00:00`);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Rome',
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(testDate);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || 'GMT+1';

    // Europe/Rome is UTC+1 in winter (CET) and UTC+2 in summer (CEST)
    const isDST = timeZoneName.includes('CEST') || timeZoneName.includes('+2');
    const timezoneOffset = isDST ? '+02:00' : '+01:00';

    // Create ISO string with explicit Italy timezone offset
    const adjustedDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}:00${timezoneOffset}`);

    // Build service name and ID based on cart items or single service
    const getServiceNames = () => {
      if (hasCartItems) {
        return cartItems.map(item => {
          const name = item.serviceName;
          const qty = item.quantity > 1 ? ` x${item.quantity}` : '';
          const opt = item.option ? ` (${item.option})` : '';
          return `${name}${qty}${opt}`;
        }).join(', ');
      }
      return lang === 'it' ? selectedService!.name : selectedService!.nameEn;
    };

    const getServiceIds = () => {
      if (hasCartItems) {
        return cartItems.map(item => item.serviceId).join(',');
      }
      return selectedService!.id;
    };

    // Calculate total calendar duration (real working time for admin calendar)
    const totalDurationMinutes = hasCartItems
      ? cartItems.reduce((total, item) => total + getCalendarDurationMinutes(item.serviceId) * item.quantity, 0)
      : getCalendarDurationMinutes(selectedService?.id || '');

    const bookingData = {
      user_id: user?.id || null,
      vehicle_type: 'car',
      vehicle_name: 'Car Wash Service',
      service_type: 'car_wash',
      service_name: getServiceNames(),
      service_id: getServiceIds(),
      duration: `${totalDurationMinutes} min`,
      price_total: Math.round(calculateTotal() * 100), // in cents
      currency: 'EUR',
      customer_name: formData.fullName,
      customer_email: formData.email,
      customer_phone: formData.phone,
      customer: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        codiceFiscale: formData.codiceFiscale,
        indirizzo: formData.indirizzo,
        numeroCivico: formData.numeroCivico,
        cittaResidenza: formData.cittaResidenza,
        codicePostale: formData.codicePostale,
        provinciaResidenza: formData.provinciaResidenza
      },
      appointment_date: adjustedDateTime.toISOString(),
      appointment_time: formData.appointmentTime,
      booking_details: {
        notes: formData.notes,
        ...(hasCartItems ? { cart_items: cartItems } : {})
      },
      status: 'confirmed',
      payment_status: 'pending',
      payment_method: 'online',
      booked_at: new Date().toISOString()
    };

    console.log('Complete booking data being prepared:', JSON.stringify(bookingData, null, 2));

    console.log('Setting pending booking data and opening modal');
    setPendingBookingData(bookingData);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    console.log('handlePayment called with method:', paymentMethod);
    if (!pendingBookingData) {
      console.log('Missing pending booking data');
      return;
    }

    // Ref-based guard: prevents double-tap/double-click even if state hasn't updated yet
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsProcessing(true);
    setPaymentError(null);

    // Track whether we're redirecting to Nexi (don't reset button state during redirect)
    let isRedirecting = false;

    // Safety timeout: auto-reset after 120 seconds (enough for slow networks + Nexi redirect)
    const safetyTimer = setTimeout(() => {
      if (!isRedirecting) {
        isSubmittingRef.current = false;
        setIsProcessing(false);
        setPaymentError('Timeout — riprova il pagamento.');
      }
    }, 120000);

    try {
      let bookingDataWithPayment;

      if (paymentMethod === 'credit') {
        // Credit wallet payment requires login
        if (!user?.id) {
          clearTimeout(safetyTimer);
          throw new Error('Devi effettuare il login per procedere.');
        }

        const totalAmount = calculateTotal();

        // Check sufficient balance
        const hasBalance = await hasSufficientBalance(user.id, totalAmount);
        if (!hasBalance) {
          clearTimeout(safetyTimer);
          setPaymentError(lang === 'it' ? 'Credito insufficiente' : 'Insufficient credit');
          isSubmittingRef.current = false;
          setIsProcessing(false);
          return;
        }

        // Deduct credits
        const serviceName = hasCartItems
          ? cartItems.map(i => i.serviceName).join(', ')
          : (lang === 'it' ? selectedService?.name : selectedService?.nameEn);
        const deductResult = await deductCredits(
          user.id,
          totalAmount,
          `Lavaggio ${serviceName}`,
          undefined,
          'car_wash_booking'
        );

        if (!deductResult.success) {
          clearTimeout(safetyTimer);
          setPaymentError(deductResult.error || 'Failed to deduct credits');
          isSubmittingRef.current = false;
          setIsProcessing(false);
          return;
        }

        // Create booking data for credit payment
        bookingDataWithPayment = {
          ...pendingBookingData,
          payment_status: 'succeeded',
          payment_method: 'credit_wallet'
        };

        // Create booking in database — if this fails, we MUST refund the credits
        const { data, error } = await supabase
          .from('bookings')
          .insert(bookingDataWithPayment)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          // CRITICAL: Refund credits since booking failed but credits were already deducted
          console.error('Booking insert failed after credit deduction — refunding credits...');
          try {
            await addCredits(
              user.id,
              totalAmount,
              `Rimborso automatico: errore prenotazione lavaggio`,
              undefined,
              'refund'
            );
            console.log('Credits refunded successfully after booking failure');
          } catch (refundError) {
            console.error('CRITICAL: Failed to refund credits after booking error!', refundError);
            // User will need to contact support — at least we log it
          }
          throw error;
        }

        console.log('Booking created successfully:', data);

        // Send confirmation email and WhatsApp notification (don't block on failure)
        let emailSent = false;
        let whatsappSent = false;

        try {
          console.log('Sending booking confirmation email...');
          const emailResponse = await fetch('/.netlify/functions/send-booking-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: data })
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('Email API returned error:', emailResponse.status, errorText);
          } else {
            emailSent = true;
            console.log('Email confirmation sent successfully');
          }
        } catch (emailError) {
          console.error('Email error (non-blocking):', emailError);
          console.error('Email error details:', {
            message: emailError instanceof Error ? emailError.message : 'Unknown error',
            stack: emailError instanceof Error ? emailError.stack : undefined
          });
        }

        try {
          console.log('Sending WhatsApp notification...');
          const whatsappResponse = await fetch('/.netlify/functions/send-whatsapp-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: data })
          });

          if (!whatsappResponse.ok) {
            console.error('WhatsApp API returned error:', whatsappResponse.status);
          } else {
            whatsappSent = true;
            console.log('WhatsApp notification sent successfully');
          }
        } catch (whatsappError) {
          console.error('WhatsApp error (non-blocking):', whatsappError);
        }

        // Log notification status for debugging
        console.log('Notification status:', { emailSent, whatsappSent, bookingId: data.id });

        // Show warning if emails failed (but don't block the success flow)
        if (!emailSent) {
          console.warn('Booking saved but email notification failed. Webhook backup will send notifications.');
        }

        // Generate WhatsApp prefilled message for customer
        const bookingId = data.id.substring(0, 8).toUpperCase();
        const whatsappServiceName = data.service_name;
        const appointmentDate = new Date(data.appointment_date);
        const customerName = formData.fullName;
        const customerPhone = formData.phone;
        const totalPrice = (data.price_total / 100).toFixed(2);
        const notes = data.booking_details?.notes || '';

        // Format date in Europe/Rome timezone
        const dateOptions: Intl.DateTimeFormatOptions = {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          timeZone: 'Europe/Rome'
        };
        const formattedDate = appointmentDate.toLocaleDateString('it-IT', dateOptions);
        // Use the appointment_time field directly (e.g., "16:30") as it's the source of truth
        const formattedTime = data.appointment_time;

        let whatsappMessage = `Ciao! Ho appena completato una prenotazione autolavaggio sul vostro sito.\n\n` +
          `*Dettagli Prenotazione*\n` +
          `*ID:* DR7-${bookingId}\n` +
          `*Nome:* ${customerName}\n` +
          `*Email:* ${formData.email}\n` +
          `*Telefono:* ${customerPhone}\n`;

        whatsappMessage += `\n*Servizio:* ${whatsappServiceName}\n` +
          `*Data e Ora:* ${formattedDate} alle ${formattedTime}\n` +
          `*Pagamento:* Credit Wallet\n`;

        if (notes) {
          whatsappMessage += `*Note:* ${notes}\n`;
        }

        if (appliedDiscount) {
          whatsappMessage += `*Sconto:* ${appliedDiscount.code} (-€${birthdayDiscountAmount})\n`;
        }

        whatsappMessage += `*Totale:* €${totalPrice}\n\n` +
          `Grazie!`;

        const officeWhatsAppNumber = '393457905205';
        const whatsappUrl = `https://wa.me/${officeWhatsAppNumber}?text=${encodeURIComponent(whatsappMessage)}`;

        // Open WhatsApp in a new tab after a short delay
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1000);

        // Mark birthday discount code as used
        if (appliedDiscount && data.id) {
          await markDiscountCodeAsUsed(data.id);
        }

        // Navigate to success page
        navigate('/booking-success', { state: { booking: data } });

      } else {
        // Nexi card payment - redirect to Nexi
        console.log('Creating Nexi payment...');

        // Generate Nexi Order ID BEFORE storing pending data
        const timestamp = Date.now().toString().substring(5);
        const random = Math.floor(100 + Math.random() * 900).toString();
        const nexiOrderId = `${timestamp}${random}`;

        console.log('Generated Nexi orderId:', nexiOrderId, 'Length:', nexiOrderId.length);

        // Prepare booking data with Nexi-specific fields
        const nexiBookingData = {
          ...pendingBookingData,
          payment_status: 'pending',
          payment_method: 'nexi',
          booking_details: {
            ...pendingBookingData.booking_details,
            nexi_order_id: nexiOrderId
          }
        };

        // Store in pending_nexi_bookings (NOT in bookings table)
        // The real booking will only be created AFTER payment succeeds via nexi-callback
        console.log('Storing pending booking...');
        const { error: pendingError } = await supabase
          .from('pending_nexi_bookings')
          .insert({
            nexi_order_id: nexiOrderId,
            booking_data: nexiBookingData
          });

        if (pendingError) {
          console.error('Database error:', pendingError);
          clearTimeout(safetyTimer);
          setPaymentError(
            lang === 'it'
              ? `Errore database: ${pendingError.message}`
              : `Database error: ${pendingError.message}`
          );
          isSubmittingRef.current = false;
          setIsProcessing(false);
          return;
        }

        console.log('Pending booking stored with nexiOrderId:', nexiOrderId);

        const nexiServiceName = hasCartItems
          ? cartItems.map(i => i.serviceName).join(', ')
          : (lang === 'it' ? selectedService?.name : selectedService?.nameEn);

        const nexiResponse = await fetch('/.netlify/functions/create-nexi-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(calculateTotal() * 100),
            currency: 'EUR',
            orderId: nexiOrderId,
            description: `Lavaggio ${nexiServiceName}`,
            customerEmail: formData.email,
            customerName: formData.fullName
          })
        });

        const nexiData = await nexiResponse.json();
        console.log('Nexi response:', nexiData);

        if (nexiData.success && nexiData.paymentUrl) {
          console.log('Redirecting to Nexi:', nexiData.paymentUrl);
          isRedirecting = true;
          window.location.href = nexiData.paymentUrl;
          return;
        } else {
          console.error('Nexi payment creation failed:', nexiData);
          setPaymentError(nexiData.error || 'Failed to create Nexi payment');
          isSubmittingRef.current = false;
          setIsProcessing(false);
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
      isSubmittingRef.current = false;
      setIsProcessing(false);
    } finally {
      clearTimeout(safetyTimer);
      // Don't reset isProcessing here — Nexi redirect keeps the page alive briefly
      // and resetting would re-enable the button, allowing double-clicks.
      // Each exit path (success/error) handles its own reset above.
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setPaymentError(null);
    setPendingBookingData(null);
  };

  if (!hasValidBooking) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">{lang === 'it' ? 'Caricamento...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-4xl flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-dr7-gold mx-auto mb-4"></div>
            <p className="text-white text-lg">{lang === 'it' ? 'Caricamento...' : 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Require authentication for booking
  if (!user) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
            <div className="mb-6">
              <svg className="w-20 h-20 mx-auto text-dr7-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              {lang === 'it' ? 'Accesso Richiesto' : 'Login Required'}
            </h2>
            <p className="text-gray-400 mb-8">
              {lang === 'it'
                ? 'Devi essere registrato e aver effettuato l\'accesso per prenotare questo servizio.'
                : 'You must be registered and logged in to book this service.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/signin', { state: { from: location.pathname } })}
                className="px-8 py-3 bg-dr7-gold text-black font-bold rounded hover:bg-dr7-gold/90 transition-colors"
              >
                {lang === 'it' ? 'Accedi' : 'Login'}
              </button>
              <button
                onClick={() => navigate('/signup', { state: { from: location.pathname } })}
                className="px-8 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
              >
                {lang === 'it' ? 'Registrati' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/car-wash-services')}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-4xl font-bold text-white">
              {lang === 'it' ? 'Prenota il Servizio' : 'Book Service'}
            </h1>
          </div>
          {hasCartItems ? (
            <div className="mb-8">
              <p className="text-gray-400 mb-3">{lang === 'it' ? 'Il tuo carrello:' : 'Your cart:'}</p>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 space-y-2">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-white">
                    <span>
                      {item.serviceName}
                      {item.option && <span className="text-gray-400 text-sm ml-2">({item.option})</span>}
                      {item.quantity > 1 && <span className="text-gray-400 text-sm ml-2">x{item.quantity}</span>}
                    </span>
                    <span className="font-bold">€{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between items-center">
                  <span className="text-white font-bold">{lang === 'it' ? 'Totale' : 'Total'}</span>
                  <span className="text-white font-bold text-xl">€{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : selectedService ? (
            <p className="text-gray-400 mb-8">
              {lang === 'it' ? selectedService.name : selectedService.nameEn} - €{selectedService.price}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Info */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {lang === 'it' ? 'Informazioni Cliente' : 'Customer Information'}
              </h2>

              {/* Client search removed - form auto-fills from logged-in user data */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Nome Completo' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                  {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Telefono' : 'Phone'} *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+39 320 1234567"
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                  {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Codice Fiscale' : 'Tax Code'}
                  </label>
                  <input
                    type="text"
                    name="codiceFiscale"
                    value={formData.codiceFiscale}
                    onChange={handleChange}
                    placeholder="RSSMRA80A01H501U"
                    maxLength={16}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white uppercase"
                  />
                  {errors.codiceFiscale && <p className="text-xs text-red-400 mt-1">{errors.codiceFiscale}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Indirizzo' : 'Address'}
                  </label>
                  <input
                    type="text"
                    name="indirizzo"
                    value={formData.indirizzo}
                    onChange={handleChange}
                    placeholder={lang === 'it' ? 'Via Roma' : 'Main Street'}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                  {errors.indirizzo && <p className="text-xs text-red-400 mt-1">{errors.indirizzo}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Numero Civico' : 'Civic Number'}
                  </label>
                  <input
                    type="text"
                    name="numeroCivico"
                    value={formData.numeroCivico}
                    onChange={handleChange}
                    placeholder="123"
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Città di Residenza' : 'City'}
                  </label>
                  <input
                    type="text"
                    name="cittaResidenza"
                    value={formData.cittaResidenza}
                    onChange={handleChange}
                    placeholder={lang === 'it' ? 'Milano' : 'Milan'}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                  {errors.cittaResidenza && <p className="text-xs text-red-400 mt-1">{errors.cittaResidenza}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'CAP' : 'Postal Code'}
                  </label>
                  <input
                    type="text"
                    name="codicePostale"
                    value={formData.codicePostale}
                    onChange={handleChange}
                    placeholder="20100"
                    maxLength={5}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                  {errors.codicePostale && <p className="text-xs text-red-400 mt-1">{errors.codicePostale}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Provincia' : 'Province'}
                  </label>
                  <input
                    type="text"
                    name="provinciaResidenza"
                    value={formData.provinciaResidenza}
                    onChange={handleChange}
                    placeholder="MI"
                    maxLength={2}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white uppercase"
                  />
                  {errors.provinciaResidenza && <p className="text-xs text-red-400 mt-1">{errors.provinciaResidenza}</p>}
                </div>
              </div>
            </div>

            {/* Appointment */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                {lang === 'it' ? 'Data e Ora Appuntamento' : 'Appointment Date & Time'}
              </h2>
              <div className="mb-4 p-3 bg-gray-800/50 rounded-md border border-gray-700">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">
                    {lang === 'it' ? 'Orari di apertura:' : 'Opening hours:'}
                  </span>
                  {' '}
                  {lang === 'it' ? 'Lun-Ven 9:00-13:00 / 15:00-19:00 | Sabato 9:00-17:00 continuato' : 'Mon-Fri 9:00-1:00 PM / 3:00-7:00 PM | Saturday 9:00 AM - 5:00 PM'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {lang === 'it' ? 'Chiusi la domenica' : 'Closed on Sundays'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Data' : 'Date'} *
                  </label>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    onBlur={handleDateBlur}
                    min={minDate}
                    required
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  />
                  {errors.appointmentDate && <p className="text-xs text-red-400 mt-1 font-semibold">{errors.appointmentDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Ora' : 'Time'} *
                  </label>
                  <select
                    name="appointmentTime"
                    value={formData.appointmentTime}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">
                      {lang === 'it' ? 'Seleziona un orario' : 'Select a time'}
                    </option>
                    {getAllTimeSlotsWithAvailability()
                      .filter(slot => slot.available)
                      .map(slot => (
                        <option key={slot.time} value={slot.time}>
                          {slot.time}
                        </option>
                      ))}
                  </select>
                  {errors.appointmentTime && <p className="text-xs text-red-400 mt-1 font-semibold">{errors.appointmentTime}</p>}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {lang === 'it' ? 'Note Aggiuntive' : 'Additional Notes'}
              </h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder={lang === 'it' ? 'Richieste speciali o note...' : 'Special requests or notes...'}
                className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
              />
            </div>

            {/* Codice Sconto - Hidden for scooter wash */}
            {serviceId !== 'scooter-wash' && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {lang === 'it' ? 'Codice Sconto' : 'Discount Code'}
              </h2>
              {appliedDiscount ? (
                <div className="flex items-center justify-between p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <div>
                    <p className="text-green-400 font-bold">{appliedDiscount.code}</p>
                    <p className="text-green-300 text-sm">Sconto di €{appliedDiscount.amount} applicato</p>
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
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="Inserisci codice (es. BDAY-XXXX-XXXX)"
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 uppercase"
                  />
                  <button
                    type="button"
                    onClick={validateDiscountCode}
                    disabled={isValidatingCode || !discountCode.trim()}
                    className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidatingCode ? 'Verifica...' : 'Applica'}
                  </button>
                </div>
              )}
              {discountCodeError && (
                <p className="text-red-400 text-sm mt-3">{discountCodeError}</p>
              )}
            </div>
            )}

            {/* Total & Submit */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <div className="flex justify-between items-center mb-3 text-gray-400">
                <span>Subtotale</span>
                <span>€{getBasePrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-3 text-green-400">
                <span>Sconto Online -5%</span>
                <span>-€{onlineDiscountAmount.toFixed(2)}</span>
              </div>
              {birthdayDiscountAmount > 0 && (
                <div className="flex justify-between items-center mb-3 text-yellow-400">
                  <span>Sconto ({appliedDiscount?.code})</span>
                  <span>-€{birthdayDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-white">
                  {lang === 'it' ? 'Totale' : 'Total'}
                </span>
                <span className="text-4xl font-bold text-white">€{calculateTotal().toFixed(2)}</span>
              </div>

              {errors.form && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-3 mb-4">
                  {errors.form}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black font-bold py-4 px-6 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                {lang === 'it' ? 'PROCEDI AL PAGAMENTO' : 'PROCEED TO PAYMENT'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 md:p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {lang === 'it' ? 'Completa il Pagamento' : 'Complete Payment'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                {hasCartItems ? (
                  <>
                    <div className="text-sm text-gray-300 mb-2">{lang === 'it' ? 'Servizi:' : 'Services:'}</div>
                    <div className="space-y-1 mb-3">
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-white">
                            {item.serviceName}
                            {item.option && <span className="text-gray-400 ml-1">({item.option})</span>}
                            {item.quantity > 1 && <span className="text-gray-400 ml-1">x{item.quantity}</span>}
                          </span>
                          <span className="text-white">€{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>{lang === 'it' ? 'Servizio' : 'Service'}:</span>
                    <span className="text-white font-semibold">
                      {lang === 'it' ? selectedService?.name : selectedService?.nameEn}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-700 my-3"></div>
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Subtotale:</span>
                  <span>€{getBasePrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-400 mb-1">
                  <span>Sconto Online -5%:</span>
                  <span>-€{onlineDiscountAmount.toFixed(2)}</span>
                </div>
                {birthdayDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-yellow-400 mb-1">
                    <span>Sconto ({appliedDiscount?.code}):</span>
                    <span>-€{birthdayDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-white">
                  <span>{lang === 'it' ? 'Totale' : 'Total'}:</span>
                  <span>€{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  {lang === 'it' ? 'Metodo di Pagamento' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`p-4 rounded-lg border-2 transition-all ${paymentMethod === 'credit'
                      ? 'border-white bg-white/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                  >
                    <div className="text-center">
                      <div className="text-sm font-semibold text-white mb-1">
                        {lang === 'it' ? 'Credit Wallet' : 'Credit Wallet'}
                      </div>
                      {!isLoadingBalance && (
                        <div className="text-xs text-gray-400">
                          {lang === 'it' ? 'Saldo: ' : 'Balance: '}€{creditBalance.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nexi')}
                    className={`p-4 rounded-lg border-2 transition-all ${paymentMethod === 'nexi'
                      ? 'border-white bg-white/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                  >
                    <div className="text-center">
                      <div className="text-sm font-semibold text-white mb-1">
                        {lang === 'it' ? 'Carta' : 'Card'}
                      </div>
                      <div className="text-xs text-gray-400">Visa, Mastercard</div>
                    </div>
                  </button>
                </div>
              </div>

              {paymentMethod === 'nexi' ? (
                <>
                  <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="text-white font-semibold mb-1">
                          {lang === 'it' ? 'Pagamento Sicuro con Nexi' : 'Secure Payment with Nexi'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {lang === 'it'
                            ? 'Sarai reindirizzato alla pagina di pagamento sicura di Nexi per completare la prenotazione.'
                            : 'You will be redirected to Nexi\'s secure payment page to complete your booking.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
                      {paymentError}
                    </div>
                  )}

                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60"
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  >
                    {isProcessing
                      ? (lang === 'it' ? 'Reindirizzamento...' : 'Redirecting...')
                      : (lang === 'it' ? `Procedi al Pagamento €${calculateTotal()}` : `Proceed to Payment €${calculateTotal()}`)}
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-4">
                    {lang === 'it'
                      ? 'Pagamento sicuro elaborato da Nexi'
                      : 'Secure payment processed by Nexi'}
                  </p>
                </>
              ) : paymentMethod === 'credit' ? (
                <>
                  <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-300">
                        {lang === 'it' ? 'Saldo Disponibile' : 'Available Balance'}:
                      </span>
                      <span className="text-lg font-bold text-white">€{creditBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">
                        {lang === 'it' ? 'Costo Servizio' : 'Service Cost'}:
                      </span>
                      <span className="text-lg font-bold text-white">€{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-700 my-3"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white font-semibold">
                        {lang === 'it' ? 'Saldo Dopo' : 'Balance After'}:
                      </span>
                      <span className={`text-lg font-bold ${creditBalance >= calculateTotal() ? 'text-green-400' : 'text-red-400'
                        }`}>
                        €{(creditBalance - calculateTotal()).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
                      {paymentError}
                    </div>
                  )}

                  <button
                    onClick={handlePayment}
                    disabled={isProcessing || creditBalance < calculateTotal()}
                    className="w-full bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  >
                    {isProcessing
                      ? (lang === 'it' ? 'Elaborazione...' : 'Processing...')
                      : creditBalance < calculateTotal()
                        ? (lang === 'it' ? 'Credito Insufficiente' : 'Insufficient Credit')
                        : (lang === 'it' ? `Paga con Credit Wallet` : `Pay with Credit Wallet`)}
                  </button>

                  {creditBalance < calculateTotal() && (
                    <p className="text-xs text-gray-400 text-center mt-4">
                      {lang === 'it'
                        ? 'Ricarica il tuo Credit Wallet per completare questa prenotazione'
                        : 'Recharge your Credit Wallet to complete this booking'}
                    </p>
                  )}
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CarWashBookingPage;
