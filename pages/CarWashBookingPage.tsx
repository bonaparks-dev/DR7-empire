import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { SERVICES, Service } from './CarWashServicesPage';
import { useCarWashAvailability } from '../hooks/useRealtimeBookings';
import { getUserCreditBalance, deductCredits, hasSufficientBalance } from '../utils/creditWallet';

const CarWashBookingPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  // Existing clients state
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const serviceId = (location.state as any)?.serviceId;
  const selectedService = SERVICES.find(s => s.id === serviceId);

  // Debug logging
  useEffect(() => {
    console.log('CarWashBookingPage - serviceId:', serviceId);
    console.log('CarWashBookingPage - selectedService:', selectedService);
    console.log('CarWashBookingPage - SERVICES:', SERVICES);
  }, [serviceId, selectedService]);

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
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);

  // Credit wallet state
  const [paymentMethod, setPaymentMethod] = useState<'nexi' | 'credit'>('nexi');
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Use the real-time hook for bookings
  const { bookings: existingBookings, loading: bookingsLoading } = useCarWashAvailability(formData.appointmentDate);

  // Helper function to get service duration in hours based on price
  const getServiceDurationInHours = (price: number): number => {
    // Exact price to duration mapping:
    // €10 = 15 minutes (LAVAGGIO SCOOTER)
    // €15 = 15 minutes (LAVAGGIO SOLO ESTERNO)
    // €20 = 30 minutes (LAVAGGIO SOLO INTERNO)
    // €25 = 45 minutes (LAVAGGIO COMPLETO)
    // €49 = 1.5 hours (LAVAGGIO TOP)
    // €75 = 2 hours (LAVAGGIO VIP)
    // €99 = 2.5 hours (LAVAGGIO DR7 LUXURY) - dalle 9:00 alle 10:30 o dalle 15:00 alle 16:30
    if (price <= 10) return 0.25; // 15 minutes
    if (price <= 15) return 0.25; // 15 minutes
    if (price <= 20) return 0.5;  // 30 minutes
    if (price <= 25) return 0.75; // 45 minutes
    if (price <= 49) return 1.5;
    if (price <= 75) return 2;
    return 2.5;
  };

  // Log bookings for debugging
  useEffect(() => {
    console.log('🔍 Existing bookings from hook:', existingBookings);
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
    if (!selectedService) {
      navigate('/car-wash-services');
    }
  }, [selectedService, navigate]);

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
    if (!selectedService || !formData.appointmentDate) return [];

    const serviceDuration = getServiceDurationInHours(selectedService.price);

    // Define valid time slots based on time ranges
    // Morning: 9:00-12:00, Afternoon: 15:00-18:00
    const allTimeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
    ];

    // Parse selected date as local date to avoid timezone issues
    const [year, month, day] = formData.appointmentDate.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.toDateString() === today.toDateString();

    // Helper to convert time string to minutes
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    // Helper to check if a time range overlaps with existing booking
    const hasOverlap = (startTime: string, durationHours: number) => {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + (durationHours * 60);

      const hasConflict = existingBookings.some(booking => {
        if (!booking.appointment_time) {
          console.warn('Booking missing appointment_time:', booking);
          return false;
        }
        const bookingStart = timeToMinutes(booking.appointment_time);
        const bookingDuration = getServiceDurationInHours(booking.price_total / 100);
        const bookingEnd = bookingStart + (bookingDuration * 60);

        const overlap = (startMinutes < bookingEnd && endMinutes > bookingStart);
        if (overlap) {
          console.log(`Time slot ${startTime} conflicts with existing booking at ${booking.appointment_time}`);
        }
        return overlap;
      });

      return hasConflict;
    };

    // Helper to check if service can fit in time range
    const canFitInRange = (startTime: string, durationHours: number) => {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + (durationHours * 60);

      // For 2.5-hour services (€99 - LAVAGGIO DR7 LUXURY), only allow specific time slots
      // dalle 9:00 alle 10:30 or dalle 15:00 alle 16:30
      if (durationHours >= 2.5) {
        return startMinutes === 9 * 60 || startMinutes === 15 * 60;
      }

      // For 0.75-hour services (45 min - €25 LAVAGGIO COMPLETO), allow booking throughout the day
      if (durationHours <= 0.75) {
        if (startMinutes >= 9 * 60 && startMinutes <= 12 * 60) return true;
        if (startMinutes >= 15 * 60 && startMinutes <= 18 * 60) return true;
        return false;
      }

      // For 1.5-hour services (€49 - LAVAGGIO TOP)
      if (durationHours === 1.5) {
        // Morning: 9:00 to 10:30 (ends by 12:00)
        if (startMinutes >= 9 * 60 && startMinutes <= 10 * 60 + 30) return true;
        // Afternoon: 15:00 to 16:30 (ends by 18:00)
        if (startMinutes >= 15 * 60 && startMinutes <= 16 * 60 + 30) return true;
        return false;
      }

      // For 2-hour services (€75 - LAVAGGIO VIP)
      if (durationHours === 2) {
        // Morning: 9:00 to 10:00 (ends by 12:00)
        if (startMinutes >= 9 * 60 && startMinutes <= 10 * 60) return true;
        // Afternoon: 15:00 to 16:00 (ends by 18:00)
        if (startMinutes >= 15 * 60 && startMinutes <= 16 * 60) return true;
        return false;
      }

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
    if (!date || !time || !selectedService) return false;

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
    if (!formData.fullName) newErrors.fullName = lang === 'it' ? 'Il nome è obbligatorio' : 'Name is required';
    if (!formData.email) newErrors.email = lang === 'it' ? 'L\'email è obbligatoria' : 'Email is required';
    if (!formData.phone) {
      newErrors.phone = lang === 'it' ? 'Il telefono è obbligatorio' : 'Phone is required';
    } else if (!validateItalianPhone(formData.phone)) {
      newErrors.phone = lang === 'it' ? 'Formato telefono non valido' : 'Invalid phone format';
    }
    if (!formData.codiceFiscale) {
      newErrors.codiceFiscale = lang === 'it' ? 'Codice Fiscale è obbligatorio' : 'Tax code is required';
    } else if (!validateCodiceFiscale(formData.codiceFiscale)) {
      newErrors.codiceFiscale = lang === 'it' ? 'Codice Fiscale non valido (16 caratteri)' : 'Invalid tax code (16 characters)';
    }
    if (!formData.indirizzo) newErrors.indirizzo = lang === 'it' ? 'Indirizzo è obbligatorio' : 'Address is required';
    if (!formData.cittaResidenza) newErrors.cittaResidenza = lang === 'it' ? 'Città è obbligatoria' : 'City is required';
    if (!formData.codicePostale) newErrors.codicePostale = lang === 'it' ? 'CAP è obbligatorio' : 'Postal code is required';
    if (!formData.provinciaResidenza) newErrors.provinciaResidenza = lang === 'it' ? 'Provincia è obbligatoria' : 'Province is required';
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
          newErrors.appointmentTime = lang === 'it' ? 'Orario disponibile: Lunedì-Sabato 9:00-19:00 (minimo 2 ore in anticipo)' : 'Available hours: Monday-Saturday 9:00-19:00 (minimum 2 hours in advance)';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    return selectedService?.price || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called');
    console.log('selectedService:', selectedService);
    console.log('validation result:', validate());

    if (!validate() || !selectedService) {
      console.log('Validation failed or no selected service');
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

    const bookingData = {
      user_id: user?.id || null,
      vehicle_type: 'car',
      vehicle_name: 'Car Wash Service',
      service_type: 'car_wash',
      service_name: lang === 'it' ? selectedService.name : selectedService.nameEn,
      service_id: selectedService.id,
      price_total: Math.round(calculateTotal() * 100), // in cents
      currency: 'EUR',
      customer_name: formData.fullName,
      customer_email: formData.email,
      customer_phone: formData.phone,
      customer_codice_fiscale: formData.codiceFiscale,
      customer_indirizzo: formData.indirizzo,
      customer_numero_civico: formData.numeroCivico,
      customer_citta: formData.cittaResidenza,
      customer_cap: formData.codicePostale,
      customer_provincia: formData.provinciaResidenza,
      appointment_date: adjustedDateTime.toISOString(),
      appointment_time: formData.appointmentTime,
      booking_details: {
        notes: formData.notes
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

    setIsProcessing(true);
    setPaymentError(null);

    try {
      let bookingDataWithPayment;

      if (paymentMethod === 'credit') {
        // Credit wallet payment
        if (!user?.id) {
          throw new Error('User not logged in');
        }

        const totalAmount = calculateTotal();

        // Check sufficient balance
        const hasBalance = await hasSufficientBalance(user.id, totalAmount);
        if (!hasBalance) {
          setPaymentError(lang === 'it' ? 'Credito insufficiente' : 'Insufficient credit');
          setIsProcessing(false);
          return;
        }

        // Deduct credits
        const deductResult = await deductCredits(
          user.id,
          totalAmount,
          `Lavaggio ${lang === 'it' ? selectedService?.name : selectedService?.nameEn}`,
          undefined,
          'car_wash_booking'
        );

        if (!deductResult.success) {
          setPaymentError(deductResult.error || 'Failed to deduct credits');
          setIsProcessing(false);
          return;
        }

        // Create booking data for credit payment
        bookingDataWithPayment = {
          ...pendingBookingData,
          payment_status: 'paid',
          payment_method: 'credit_wallet'
        };

      } else {
        // Nexi card payment - redirect to Nexi
        console.log('Creating Nexi payment...');

        // First, save booking as pending
        const pendingBooking = {
          ...pendingBookingData,
          payment_status: 'pending',
          payment_method: 'nexi'
        };

        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .insert(pendingBooking)
          .select()
          .single();

        if (bookingError) {
          console.error('Database error:', bookingError);
          throw bookingError;
        }

        // Create Nexi payment
        const nexiResponse = await fetch('/.netlify/functions/create-nexi-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: calculateTotal() * 100, // Convert to cents
            currency: 'EUR',
            orderId: `CARWASH-${bookingData.id}`,
            description: `Lavaggio ${lang === 'it' ? selectedService?.name : selectedService?.nameEn}`,
            customerEmail: formData.email,
            metadata: {
              type: 'car-wash',
              bookingId: bookingData.id,
              serviceName: lang === 'it' ? selectedService?.name : selectedService?.nameEn
            }
          })
        });

        const nexiData = await nexiResponse.json();

        if (nexiData.success && nexiData.paymentUrl) {
          // Redirect to Nexi payment page
          window.location.href = nexiData.paymentUrl;
          return; // Stop execution as we're redirecting
        } else {
          throw new Error(nexiData.error || 'Failed to create Nexi payment');
        }
      }

      // Create booking in database (common for both payment methods)
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingDataWithPayment)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
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
          console.log('✅ Email confirmation sent successfully');
        }
      } catch (emailError) {
        console.error('❌ Email error (non-blocking):', emailError);
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
          console.log('✅ WhatsApp notification sent successfully');
        }
      } catch (whatsappError) {
        console.error('❌ WhatsApp error (non-blocking):', whatsappError);
      }

      // Log notification status for debugging
      console.log('Notification status:', { emailSent, whatsappSent, bookingId: data.id });

      // Show warning if emails failed (but don't block the success flow)
      if (!emailSent) {
        console.warn('⚠️ Booking saved but email notification failed. Webhook backup will send notifications.');
      }

      // Generate WhatsApp prefilled message for customer
      const bookingId = data.id.substring(0, 8).toUpperCase();
      const serviceName = data.service_name;
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
        `📋 *Dettagli Prenotazione*\n` +
        `*ID:* DR7-${bookingId}\n` +
        `*Nome:* ${customerName}\n` +
        `*Telefono:* ${customerPhone}\n` +
        `*Servizio:* ${serviceName}\n` +
        `*Data e Ora:* ${formattedDate} alle ${formattedTime}\n`;

      if (notes) {
        whatsappMessage += `*Note:* ${notes}\n`;
      }

      whatsappMessage += `*Totale:* €${totalPrice}\n\n` +
        `Grazie!`;

      const officeWhatsAppNumber = '393457905205';
      const whatsappUrl = `https://wa.me/${officeWhatsAppNumber}?text=${encodeURIComponent(whatsappMessage)}`;

      // Open WhatsApp in a new tab after a short delay
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1000);

      // Navigate to success page
      navigate('/booking-success', { state: { booking: data } });
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setClientSecret(null);
    setPaymentError(null);
    setPendingBookingData(null);
  };

  if (!selectedService) {
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
          <h1 className="text-4xl font-bold text-white mb-2">
            {lang === 'it' ? 'Prenota il Servizio' : 'Book Service'}
          </h1>
          <p className="text-gray-400 mb-8">
            {lang === 'it' ? selectedService.name : selectedService.nameEn} - €{selectedService.price}
          </p>

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
                    {lang === 'it' ? 'Codice Fiscale' : 'Tax Code'} *
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
                    {lang === 'it' ? 'Indirizzo' : 'Address'} *
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
                    {lang === 'it' ? 'Città di Residenza' : 'City'} *
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
                    {lang === 'it' ? 'CAP' : 'Postal Code'} *
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
                    {lang === 'it' ? 'Provincia' : 'Province'} *
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
                  {lang === 'it' ? 'Lunedì - Sabato, 9:00 - 19:00' : 'Monday - Saturday, 9:00 AM - 7:00 PM'}
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
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {getAllTimeSlotsWithAvailability().map(slot => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setFormData(prev => ({ ...prev, appointmentTime: slot.time }))}
                        className={`
                          px-4 py-3 rounded-lg font-semibold text-sm transition-all
                          ${formData.appointmentTime === slot.time
                            ? 'bg-white text-black ring-2 ring-white'
                            : slot.available
                              ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                              : 'bg-gray-900 text-gray-500 border-2 border-red-500 cursor-not-allowed opacity-60'
                          }
                        `}
                        title={!slot.available ? (lang === 'it' ? `Non disponibile: ${slot.reason}` : `Unavailable: ${slot.reason}`) : ''}
                      >
                        {slot.time}
                        {!slot.available && slot.reason === 'Already booked' && (
                          <span className="block text-xs mt-1 text-red-400">
                            {lang === 'it' ? 'Occupato' : 'Booked'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.appointmentTime && <p className="text-xs text-red-400 mt-1">{errors.appointmentTime}</p>}
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

            {/* Total & Submit */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-white">
                  {lang === 'it' ? 'Totale' : 'Total'}
                </span>
                <span className="text-4xl font-bold text-white">€{calculateTotal()}</span>
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
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>{lang === 'it' ? 'Servizio' : 'Service'}:</span>
                  <span className="text-white font-semibold">
                    {lang === 'it' ? selectedService?.name : selectedService?.nameEn}
                  </span>
                </div>
                <div className="border-t border-gray-700 my-3"></div>
                <div className="flex justify-between text-lg font-bold text-white">
                  <span>{lang === 'it' ? 'Totale' : 'Total'}:</span>
                  <span>€{calculateTotal()}</span>
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
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 rounded-lg border-2 transition-all ${paymentMethod === 'stripe'
                      ? 'border-white bg-white/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                  >
                    <div className="text-center">
                      <div className="text-sm font-semibold text-white mb-1">
                        {lang === 'it' ? 'Carta di Credito' : 'Credit Card'}
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
