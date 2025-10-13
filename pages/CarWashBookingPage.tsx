import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { SERVICES, ADDITIONAL_SERVICES, Service } from './CarWashServicesPage';
import type { Stripe, StripeElements } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51S3dDjQcprtTyo8tBfBy5mAZj8PQXkxfZ1RCnWskrWFZ2WEnm1u93ZnE2tBi316Gz2CCrvLV98IjSoiXb0vSDpOQ003fNG69Y2';

const CarWashBookingPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const serviceId = (location.state as any)?.serviceId;
  const selectedService = SERVICES.find(s => s.id === serviceId);

  // Debug logging
  useEffect(() => {
    console.log('CarWashBookingPage - serviceId:', serviceId);
    console.log('CarWashBookingPage - selectedService:', selectedService);
    console.log('CarWashBookingPage - SERVICES:', SERVICES);
  }, [serviceId, selectedService]);

  // Get today's date in YYYY-MM-DD format - memoized to always reflect current date
  const minDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []); // Empty dependency array, but will re-evaluate on every render

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    appointmentDate: '',
    appointmentTime: '',
    additionalService: '',
    additionalServiceHours: 0,
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
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  // Helper function to get service duration in hours based on price
  const getServiceDurationInHours = (price: number): number => {
    // Each 25€ = 1 hour
    return Math.ceil(price / 25);
  };

  // Fetch existing bookings for selected date
  useEffect(() => {
    if (formData.appointmentDate) {
      supabase
        .from('bookings')
        .select('*')
        .eq('service_type', 'car_wash')
        .eq('payment_status', 'succeeded')
        .then(({ data, error }) => {
          if (!error && data) {
            // Filter by date in code since appointment_date comparison needs special handling
            const filtered = data.filter(booking => {
              if (!booking.appointment_date) return false;
              const bookingDate = new Date(booking.appointment_date).toISOString().split('T')[0];
              return bookingDate === formData.appointmentDate;
            });
            setExistingBookings(filtered);
          }
        });
    }
  }, [formData.appointmentDate]);

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

  // Create payment intent when modal opens
  useEffect(() => {
    if (showPaymentModal && calculateTotal() > 0) {
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
  }, [showPaymentModal, user, selectedService, formData.appointmentDate, formData.appointmentTime, lang]);

  // Mount Stripe card element
  useEffect(() => {
    if (elements && clientSecret && cardElementRef.current) {
      // Check if card element already exists
      const existingCard = elements.getElement('card');

      if (!existingCard) {
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
        card.mount(cardElementRef.current);
        card.on('change', (event) => {
          setStripeError(event.error ? event.error.message : null);
        });

        return () => {
          card.unmount();
        };
      }
    }
  }, [elements, clientSecret]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Block past dates immediately when date field changes
    if (name === 'appointmentDate' && value && value < minDate) {
      setErrors(prev => ({
        ...prev,
        appointmentDate: lang === 'it'
          ? 'Non puoi selezionare date passate. Seleziona da oggi in poi.'
          : 'You cannot select past dates. Select from today onwards.'
      }));
      return; // Don't update the form data
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getAvailableTimeSlots = () => {
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

      return existingBookings.some(booking => {
        const bookingStart = timeToMinutes(booking.appointment_time);
        const bookingDuration = getServiceDurationInHours(booking.price_total / 100);
        const bookingEnd = bookingStart + (bookingDuration * 60);

        // Check if there's any overlap
        return (startMinutes < bookingEnd && endMinutes > bookingStart);
      });
    };

    // Helper to check if service can fit in time range
    const canFitInRange = (startTime: string, durationHours: number) => {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + (durationHours * 60);

      // For 4-hour services (€99), only allow 9:00 or 15:00
      if (durationHours >= 4) {
        return startMinutes === 9 * 60 || startMinutes === 15 * 60;
      }

      // Check if fits in morning range (9:00-12:00)
      if (startMinutes >= 9 * 60 && startMinutes < 12 * 60) {
        return endMinutes <= 12 * 60;
      }

      // Check if fits in afternoon range (15:00-18:00)
      if (startMinutes >= 15 * 60 && startMinutes < 18 * 60) {
        return endMinutes <= 18 * 60;
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
    if (!formData.phone) newErrors.phone = lang === 'it' ? 'Il telefono è obbligatorio' : 'Phone is required';
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
    let total = selectedService?.price || 0;

    if (formData.additionalService && formData.additionalServiceHours > 0) {
      const addService = ADDITIONAL_SERVICES.find(s => s.id === formData.additionalService);
      const priceOption = addService?.prices.find(p => p.hours === Number(formData.additionalServiceHours));
      if (priceOption) {
        total += priceOption.price;
      }
    }

    return total;
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
      appointment_date: formData.appointmentDate,
      appointment_time: formData.appointmentTime,
      booking_details: {
        additionalService: formData.additionalService,
        additionalServiceHours: formData.additionalServiceHours,
        notes: formData.notes
      },
      status: 'confirmed',
      payment_status: 'pending',
      booked_at: new Date().toISOString()
    };

    console.log('Setting pending booking data and opening modal');
    setPendingBookingData(bookingData);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    console.log('handlePayment called');
    if (!stripe || !elements || !clientSecret || !pendingBookingData) {
      console.log('Missing required data:', { stripe: !!stripe, elements: !!elements, clientSecret: !!clientSecret, pendingBookingData: !!pendingBookingData });
      return;
    }

    setIsProcessing(true);
    setStripeError(null);

    try {
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
        return;
      }

      console.log('Payment intent status:', paymentIntent.status);

      if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded! Creating booking...');
        // Payment successful, create booking with paid status
        const bookingDataWithPayment = {
          ...pendingBookingData,
          payment_status: 'paid',
          stripe_payment_intent_id: paymentIntent.id
        };

        console.log('Inserting booking into database:', bookingDataWithPayment);
        const { data, error } = await supabase
          .from('bookings')
          .insert(bookingDataWithPayment)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          console.error('Booking data that failed:', JSON.stringify(bookingDataWithPayment, null, 2));
          throw error;
        }

        console.log('Booking created successfully:', data);

        // Send confirmation email and WhatsApp notification (don't block on failure)
        try {
          console.log('Sending confirmation email...');
          await fetch('/.netlify/functions/send-booking-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: data })
          });
        } catch (emailError) {
          console.error('Email error (non-blocking):', emailError);
        }

        try {
          console.log('Sending WhatsApp notification...');
          await fetch('/.netlify/functions/send-whatsapp-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: data })
          });
        } catch (whatsappError) {
          console.error('WhatsApp error (non-blocking):', whatsappError);
        }

        // Navigate to success page
        console.log('Navigating to success page with booking:', data);
        navigate('/booking-success', { state: { booking: data } });
      }
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
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                  {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
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
                    min={minDate}
                    required
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  />
                  {errors.appointmentDate && <p className="text-xs text-red-400 mt-1 font-semibold">{errors.appointmentDate}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === 'it' ? '⚠️ Solo date da oggi in poi sono selezionabili' : '⚠️ Only dates from today onwards are selectable'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Ora' : 'Time'} *
                  </label>
                  <select
                    name="appointmentTime"
                    value={formData.appointmentTime}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  >
                    <option value="">{lang === 'it' ? 'Seleziona orario' : 'Select time'}</option>
                    {getAvailableTimeSlots().map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  {errors.appointmentTime && <p className="text-xs text-red-400 mt-1">{errors.appointmentTime}</p>}
                </div>
              </div>
            </div>

            {/* Additional Services */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {lang === 'it' ? 'Servizio Aggiuntivo (Opzionale)' : 'Additional Service (Optional)'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Tipo Servizio' : 'Service Type'}
                  </label>
                  <select
                    name="additionalService"
                    value={formData.additionalService}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  >
                    <option value="">{lang === 'it' ? 'Nessuno' : 'None'}</option>
                    {ADDITIONAL_SERVICES.map(service => (
                      <option key={service.id} value={service.id}>
                        {lang === 'it' ? service.name : service.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.additionalService && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {lang === 'it' ? 'Durata' : 'Duration'}
                    </label>
                    <select
                      name="additionalServiceHours"
                      value={formData.additionalServiceHours}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                    >
                      <option value={0}>{lang === 'it' ? 'Seleziona durata' : 'Select duration'}</option>
                      {ADDITIONAL_SERVICES.find(s => s.id === formData.additionalService)?.prices.map(price => (
                        <option key={price.hours} value={price.hours}>
                          {price.duration} - €{price.price}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                {formData.additionalService && (
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>{lang === 'it' ? 'Servizio Aggiuntivo' : 'Additional Service'}:</span>
                    <span className="text-white">
                      {ADDITIONAL_SERVICES.find(s => s.id === formData.additionalService)?.name}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-700 my-3"></div>
                <div className="flex justify-between text-lg font-bold text-white">
                  <span>{lang === 'it' ? 'Totale' : 'Total'}:</span>
                  <span>€{calculateTotal()}</span>
                </div>
              </div>

              {isClientSecretLoading ? (
                <div className="text-center py-8 text-gray-400">
                  {lang === 'it' ? 'Caricamento...' : 'Loading...'}
                </div>
              ) : clientSecret ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {lang === 'it' ? 'Dettagli Carta' : 'Card Details'}
                    </label>
                    <div
                      ref={cardElementRef}
                      className="bg-gray-800 border border-gray-700 rounded-md p-3"
                    />
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
              ) : stripeError ? (
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
