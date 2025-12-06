import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { SERVICES, Service } from './CarWashServicesPage';
import { useCarWashAvailability } from '../hooks/useRealtimeBookings';
import type { Stripe, StripeElements } from '@stripe/stripe-js';
import { getUserCreditBalance, deductCredits, hasSufficientBalance } from '../utils/creditWallet';

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51S3dDjQcprtTyo8tBfBy5mAZj8PQXkxfZ1RCnWskrWFZ2WEnm1u93ZnE2tBi316Gz2CCrvLV98IjSoiXb0vSDpOQ003fNG69Y2';

const CarWashBookingPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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

  // Stripe payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isClientSecretLoading, setIsClientSecretLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);

  // Credit wallet state
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'credit'>('stripe');
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Use the real-time hook for bookings
  const { bookings: existingBookings, loading: bookingsLoading } = useCarWashAvailability(formData.appointmentDate);

  // Helper function to get service duration in hours based on price
  const getServiceDurationInHours = (price: number): number => {
    // Exact price to duration mapping:
    // €25 = 1 hour (LAVAGGIO COMPLETO)
    // €49 = 2 hours (LAVAGGIO TOP)
    // €75 = 3 hours (LAVAGGIO VIP)
    // €99 = 4 hours (LAVAGGIO DR7 LUXURY)
    if (price <= 25) return 1;
    if (price <= 49) return 2;
    if (price <= 75) return 3;
    return 4;
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

  // Initialize Stripe
  useEffect(() => {
    if ((window as any).Stripe) {
      if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('YOUR_')) {
        console.error("Stripe.js has loaded, but the publishable key is not set.");
        setStripeError("Payment service is not configured correctly. Please contact support.");
        return;
      }
      const stripeInstance = (window as any).Stripe(STRIPE_PUBLISHABLE_KEY);
      setStripe(stripeInstance);
      setElements(stripeInstance.elements());
    }
  }, []);

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

  // Create payment intent when modal opens (only for Stripe payment)
  useEffect(() => {
    if (showPaymentModal && paymentMethod === 'stripe' && calculateTotal() > 0) {
      setIsClientSecretLoading(true);
      setStripeError(null);
      setClientSecret(null);

      fetch('/.netlify/functions/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: calculateTotal(), // Amount in euros (backend will convert to cents)
          currency: 'eur',
          email: user?.email,
          purchaseType: 'car-wash',
          metadata: {
            serviceName: lang === 'it' ? selectedService?.name : selectedService?.nameEn,
            appointmentDate: formData.appointmentDate,
            appointmentTime: formData.appointmentTime
          }
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setStripeError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
      })
      .catch(error => {
        console.error('Failed to fetch client secret:', error);
        setStripeError('Could not connect to payment server.');
      })
      .finally(() => {
        setIsClientSecretLoading(false);
      });
    }
  }, [showPaymentModal, paymentMethod, user, selectedService, formData.appointmentDate, formData.appointmentTime, lang]);

  // Mount Stripe card element
  useEffect(() => {
    if (elements && clientSecret && cardElementRef.current && showPaymentModal) {
      // Clear any existing card element first
      const existingCard = elements.getElement('card');
      if (existingCard) {
        existingCard.unmount();
      }

      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (cardElementRef.current) {
          const card = elements.create('card', {
            style: {
              base: {
                color: '#ffffff',
                fontFamily: '"Exo 2", sans-serif',
                fontSize: '16px',
                '::placeholder': { color: '#a0aec0' }
              },
              invalid: { color: '#ef4444', iconColor: '#ef4444' }
            }
          });

          try {
            card.mount(cardElementRef.current);
            console.log('Stripe card element mounted successfully');
            card.on('change', (event) => {
              setStripeError(event.error ? event.error.message : null);
            });
          } catch (error) {
            console.error('Error mounting Stripe card element:', error);
            setStripeError('Failed to load payment form. Please refresh the page.');
          }
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        const card = elements.getElement('card');
        if (card) {
          card.unmount();
        }
      };
    }
  }, [elements, clientSecret, showPaymentModal]);

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
    if (name === 'appointmentDate' && value && value < minDate) {
      setErrors(prev => ({
        ...prev,
        appointmentDate: lang === 'it'
          ? 'Non puoi selezionare date passate. Seleziona da oggi in poi.'
          : 'You cannot select past dates. Select from today onwards.'
      }));
      // Reset to empty instead of keeping invalid date
      setFormData(prev => ({ ...prev, appointmentDate: '' }));
      return;
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

      if (durationHours >= 4) {
        return startMinutes === 9 * 60 || startMinutes === 15 * 60;
      }

      if (durationHours === 1) {
        if (startMinutes >= 9 * 60 && startMinutes <= 12 * 60) return true;
        if (startMinutes >= 15 * 60 && startMinutes <= 18 * 60) return true;
        return false;
      }

      if (durationHours === 2) {
        if (startMinutes >= 9 * 60 && startMinutes <= 11 * 60) return true;
        if (startMinutes >= 15 * 60 && startMinutes <= 17 * 60) return true;
        return false;
      }

      if (durationHours === 3) {
        if (startMinutes >= 9 * 60 && startMinutes <= 10 * 60) return endMinutes <= 13 * 60;
        if (startMinutes >= 15 * 60 && startMinutes <= 16 * 60) return endMinutes <= 19 * 60;
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

  const getAvailableTimeSlots_OLD = () => {
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
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
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

      // For 4-hour services (€99), only allow 9:00 or 15:00
      if (durationHours >= 4) {
        return startMinutes === 9 * 60 || startMinutes === 15 * 60;
      }

      // For 1-hour services (€25 - LAVAGGIO COMPLETO), allow booking up to and including 12:00 and 18:00
      if (durationHours === 1) {
        // Morning: 9:00 to 12:00 (inclusive)
        if (startMinutes >= 9 * 60 && startMinutes <= 12 * 60) {
          return true;
        }
        // Afternoon: 15:00 to 18:00 (inclusive)
        if (startMinutes >= 15 * 60 && startMinutes <= 18 * 60) {
          return true;
        }
        return false;
      }

      // For 2-hour services (€49 - LAVAGGIO TOP), allow booking up to 11:00 morning and 17:00 afternoon
      if (durationHours === 2) {
        // Morning: 9:00 to 11:00 (inclusive)
        if (startMinutes >= 9 * 60 && startMinutes <= 11 * 60) {
          return true;
        }
        // Afternoon: 15:00 to 17:00 (inclusive)
        if (startMinutes >= 15 * 60 && startMinutes <= 17 * 60) {
          return true;
        }
        return false;
      }

      // For 3-hour services (€75), they must complete within the shift
      // Morning: can only start at 9:00, 9:30, or 10:00 to finish by 12:00
      if (durationHours === 3) {
        // Morning: 9:00 to 10:00 (inclusive)
        if (startMinutes >= 9 * 60 && startMinutes <= 10 * 60) {
          return endMinutes <= 13 * 60; // Allow ending at 13:00
        }
        // Afternoon: 15:00 to 16:00 (inclusive)
        if (startMinutes >= 15 * 60 && startMinutes <= 16 * 60) {
          return endMinutes <= 19 * 60; // Allow ending at 19:00
        }
        return false;
      }

      return false;
    };

    return allTimeSlots.filter(slot => {
      // Check if service fits in time range
      if (!canFitInRange(slot, serviceDuration)) {
        return false;
      }

      // Check for past times with 2-hour buffer if today
      if (isToday) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const slotMinutes = timeToMinutes(slot);
        if (slotMinutes < currentMinutes + 120) {
          return false;
        }
      }

      // Check for overlaps with existing bookings
      if (hasOverlap(slot, serviceDuration)) {
        return false;
      }

      return true;
    });
  };

  const isValidAppointmentTime = (date: string, time: string) => {
    if (!date || !time || !selectedService) return false;

    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    const dayOfWeek = appointmentDate.getDay();

    // Sunday = 0 - closed on Sundays
    if (dayOfWeek === 0) return false;

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
    setStripeError(null);

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
          setStripeError(lang === 'it' ? 'Credito insufficiente' : 'Insufficient credit');
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
          setStripeError(deductResult.error || 'Failed to deduct credits');
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
        // Stripe card payment
        if (!stripe || !elements || !clientSecret) {
          console.log('Missing Stripe data:', { stripe: !!stripe, elements: !!elements, clientSecret: !!clientSecret });
          return;
        }

        console.log('Getting card element...');
        const cardElement = elements.getElement('card');
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        console.log('Confirming card payment...');
        const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: formData.fullName,
              email: formData.email,
              phone: formData.phone
            }
          }
        });

        if (paymentError) {
          console.error('Payment error:', paymentError);
          setStripeError(paymentError.message || 'Payment failed');
          setIsProcessing(false);
          return;
        }

        console.log('Payment intent status:', paymentIntent.status);

        if (paymentIntent.status !== 'succeeded') {
          throw new Error('Payment not completed');
        }

        // Create booking data for Stripe payment
        bookingDataWithPayment = {
          ...pendingBookingData,
          payment_status: 'paid',
          stripe_payment_intent_id: paymentIntent.id,
          payment_method: 'online'
        };
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
      try {
        await fetch('/.netlify/functions/send-booking-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: data })
        });
      } catch (emailError) {
        console.error('Email error (non-blocking):', emailError);
      }

      try {
        await fetch('/.netlify/functions/send-whatsapp-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: data })
        });
      } catch (whatsappError) {
        console.error('WhatsApp error (non-blocking):', whatsappError);
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
      setStripeError(error.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setClientSecret(null);
    setStripeError(null);
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

              {/* Existing Client Search - Admin Only */}
              <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {lang === 'it' ? '🔍 Cerca Cliente Esistente' : '🔍 Search Existing Client'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearchQuery}
                    onChange={(e) => {
                      setClientSearchQuery(e.target.value);
                      setShowClientDropdown(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowClientDropdown(clientSearchQuery.length > 0)}
                    placeholder={lang === 'it' ? 'Cerca per nome, email, codice fiscale...' : 'Search by name, email, tax code...'}
                    className="w-full bg-gray-800 border-gray-600 rounded-md p-3 text-white placeholder-gray-500"
                  />

                  {/* Dropdown with filtered clients */}
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      {filteredClients.map((client) => {
                        const displayName = client.tipo_cliente === 'persona_fisica'
                          ? `${client.nome || ''} ${client.cognome || ''}`.trim()
                          : (client.denominazione || client.ragione_sociale || client.ente_ufficio || '');

                        return (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => handleClientSelect(client)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-700 border-b border-gray-700 last:border-b-0 transition-colors"
                          >
                            <div className="text-white font-medium">{displayName}</div>
                            <div className="text-sm text-gray-400">
                              {client.email} • {client.codice_fiscale || client.partita_iva || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {client.tipo_cliente === 'persona_fisica' ? '👤 Persona Fisica' :
                               client.tipo_cliente === 'azienda' ? '🏢 Azienda' : '🏛️ PA'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {showClientDropdown && clientSearchQuery && filteredClients.length === 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 text-center text-gray-400">
                      {lang === 'it' ? 'Nessun cliente trovato' : 'No clients found'}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {lang === 'it'
                    ? 'Seleziona un cliente esistente per compilare automaticamente i campi'
                    : 'Select an existing client to auto-fill the fields'}
                </p>
              </div>

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
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'credit'
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
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'stripe'
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

              {paymentMethod === 'stripe' && isClientSecretLoading ? (
                <div className="text-center py-8 text-gray-400">
                  {lang === 'it' ? 'Caricamento...' : 'Loading...'}
                </div>
              ) : paymentMethod === 'stripe' && clientSecret ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {lang === 'it' ? 'Dettagli Carta' : 'Card Details'}
                    </label>
                    <div
                      ref={cardElementRef}
                      className="bg-gray-800 border border-gray-700 rounded-md p-3 min-h-[44px]"
                      style={{ position: 'relative', zIndex: 1 }}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      {lang === 'it'
                        ? 'Inserisci i dettagli della tua carta qui sopra'
                        : 'Enter your card details above'}
                    </p>
                  </div>

                  {stripeError && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
                      {stripeError}
                    </div>
                  )}

                  <button
                    onClick={handlePayment}
                    disabled={isProcessing || !stripe}
                    className="w-full bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60"
                  >
                    {isProcessing
                      ? (lang === 'it' ? 'Elaborazione...' : 'Processing...')
                      : (lang === 'it' ? `Paga €${calculateTotal()}` : `Pay €${calculateTotal()}`)}
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-4">
                    {lang === 'it'
                      ? 'Pagamento sicuro elaborato da Stripe'
                      : 'Secure payment processed by Stripe'}
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
                      <span className={`text-lg font-bold ${
                        creditBalance >= calculateTotal() ? 'text-green-400' : 'text-red-400'
                      }`}>
                        €{(creditBalance - calculateTotal()).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {stripeError && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
                      {stripeError}
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
              ) : paymentMethod === 'stripe' && stripeError ? (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
                  {stripeError}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CarWashBookingPage;
