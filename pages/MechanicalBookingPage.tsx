import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { MECHANICAL_SERVICES } from './MechanicalServicesPage';
import type { Stripe, StripeElements } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51S3dDjQcprtTyo8tBfBy5mAZj8PQXkxfZ1RCnWskrWFZ2WEnm1u93ZnE2tBi316Gz2CCrvLV98IjSoiXb0vSDpOQ003fNG69Y2';

const MechanicalBookingPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const serviceId = (location.state as any)?.serviceId;
  const selectedService = MECHANICAL_SERVICES.find(s => s.id === serviceId);

  // Get today's date in YYYY-MM-DD format
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
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlate: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

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

  // Load existing bookings when date changes
  useEffect(() => {
    if (formData.appointmentDate) {
      loadBookingsForDate(formData.appointmentDate);
    }
  }, [formData.appointmentDate]);

  async function loadBookingsForDate(date: string) {
    setBookingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('service_type', 'mechanical_service')
        .eq('appointment_date', date);

      if (error) throw error;
      setExistingBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setExistingBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }

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
      navigate('/mechanical-services');
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

  // Create payment intent when modal opens
  useEffect(() => {
    if (showPaymentModal && selectedService) {
      setIsClientSecretLoading(true);
      setStripeError(null);
      setClientSecret(null);

      fetch('/.netlify/functions/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedService.price,
          currency: 'eur',
          email: user?.email,
          purchaseType: 'mechanical-service',
          metadata: {
            serviceName: lang === 'it' ? selectedService.name : selectedService.nameEn,
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
    if (elements && clientSecret && cardElementRef.current && showPaymentModal) {
      const existingCard = elements.getElement('card');
      if (existingCard) {
        existingCard.unmount();
      }

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'appointmentDate' && value && value < minDate) {
      setErrors(prev => ({
        ...prev,
        appointmentDate: lang === 'it'
          ? 'Non puoi selezionare date passate. Seleziona da oggi in poi.'
          : 'You cannot select past dates. Select from today onwards.'
      }));
      setFormData(prev => ({ ...prev, appointmentDate: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getAllTimeSlotsWithAvailability = () => {
    if (!formData.appointmentDate) return [];

    // All mechanical services take 30 minutes
    const allTimeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
    ];

    const [year, month, day] = formData.appointmentDate.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.toDateString() === today.toDateString();

    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const hasOverlap = (startTime: string) => {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + 30; // 30 minute slots

      return existingBookings.some(booking => {
        if (!booking.appointment_time) return false;
        const bookingStart = timeToMinutes(booking.appointment_time);
        const bookingEnd = bookingStart + 30;
        return (startMinutes < bookingEnd && endMinutes > bookingStart);
      });
    };

    return allTimeSlots.map(slot => {
      let reason = '';
      let available = true;

      if (isToday) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const slotMinutes = timeToMinutes(slot);
        if (slotMinutes < currentMinutes + 120) {
          reason = 'Too soon';
          available = false;
        }
      }

      if (available && hasOverlap(slot)) {
        reason = 'Already booked';
        available = false;
      }

      return { time: slot, available, reason };
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = lang === 'it' ? 'Il nome è obbligatorio' : 'Name is required';
    if (!formData.email) newErrors.email = lang === 'it' ? 'L\'email è obbligatoria' : 'Email is required';
    if (!formData.phone) newErrors.phone = lang === 'it' ? 'Il telefono è obbligatorio' : 'Phone is required';
    if (!formData.vehicleMake) newErrors.vehicleMake = lang === 'it' ? 'La marca è obbligatoria' : 'Make is required';
    if (!formData.vehicleModel) newErrors.vehicleModel = lang === 'it' ? 'Il modello è obbligatorio' : 'Model is required';
    if (!formData.appointmentDate) newErrors.appointmentDate = lang === 'it' ? 'La data è obbligatoria' : 'Date is required';
    if (!formData.appointmentTime) newErrors.appointmentTime = lang === 'it' ? 'L\'ora è obbligatoria' : 'Time is required';

    if (formData.appointmentDate && formData.appointmentDate < minDate) {
      newErrors.appointmentDate = lang === 'it' ? 'La data non può essere nel passato' : 'Date cannot be in the past';
    }

    // Check if selected date is Sunday
    if (formData.appointmentDate) {
      const [year, month, day] = formData.appointmentDate.split('-').map(Number);
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      if (dayOfWeek === 0) {
        newErrors.appointmentDate = lang === 'it' ? 'Siamo chiusi la domenica' : 'We are closed on Sundays';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !selectedService) {
      return;
    }

    const vehicleInfo = `${formData.vehicleMake} ${formData.vehicleModel}${formData.vehicleYear ? ' (' + formData.vehicleYear + ')' : ''}${formData.vehiclePlate ? ' - ' + formData.vehiclePlate : ''}`;

    const bookingData = {
      user_id: user?.id || null,
      guest_name: formData.fullName,
      vehicle_type: 'service',
      vehicle_name: vehicleInfo,
      service_type: 'mechanical_service',
      service_name: lang === 'it' ? selectedService.name : selectedService.nameEn,
      service_id: selectedService.id,
      price_total: Math.round(selectedService.price * 100), // in cents
      currency: 'EUR',
      customer_name: formData.fullName,
      customer_email: formData.email,
      customer_phone: formData.phone,
      appointment_date: formData.appointmentDate,
      appointment_time: formData.appointmentTime,
      booking_details: {
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        vehicleYear: formData.vehicleYear,
        vehiclePlate: formData.vehiclePlate,
        notes: formData.notes
      },
      status: 'confirmed',
      payment_status: 'pending',
      payment_method: 'online',
      booked_at: new Date().toISOString()
    };

    setPendingBookingData(bookingData);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret || !pendingBookingData) {
      return;
    }

    setIsProcessing(true);
    setStripeError(null);

    try {
      const cardElement = elements.getElement('card');
      if (!cardElement) {
        throw new Error('Card element not found');
      }

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
        setStripeError(paymentError.message || 'Payment failed');
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        const bookingDataWithPayment = {
          ...pendingBookingData,
          payment_status: 'paid',
          stripe_payment_intent_id: paymentIntent.id
        };

        const { data, error } = await supabase
          .from('bookings')
          .insert(bookingDataWithPayment)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        // Create Google Calendar event
        try {
          const [hours, minutes] = formData.appointmentTime.split(':').map(Number);
          const endHours = hours;
          const endMinutes = minutes + 30;
          const endTime = `${String(endHours + Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

          await fetch('/.netlify/functions/create-calendar-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicleName: `🔧 ${pendingBookingData.service_name}`,
              customerName: formData.fullName,
              customerEmail: formData.email,
              customerPhone: formData.phone,
              pickupDate: formData.appointmentDate,
              pickupTime: formData.appointmentTime,
              returnDate: formData.appointmentDate,
              returnTime: endTime,
              pickupLocation: `DR7 Rapid Service - ${pendingBookingData.vehicle_name}`,
              returnLocation: 'DR7 Rapid Service',
              totalPrice: selectedService?.price || 0,
              bookingId: data.id.substring(0, 8)
            })
          });
        } catch (calendarError) {
          console.error('Calendar error (non-blocking):', calendarError);
        }

        // Send notifications
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
        const dateOptions: Intl.DateTimeFormatOptions = {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          timeZone: 'Europe/Rome'
        };
        const formattedDate = appointmentDate.toLocaleDateString('it-IT', dateOptions);
        const totalPrice = (data.price_total / 100).toFixed(2);

        let whatsappMessage = `Ciao! Ho appena prenotato un servizio meccanico sul vostro sito.\n\n` +
          `📋 *Dettagli Prenotazione*\n` +
          `*ID:* DR7-${bookingId}\n` +
          `*Nome:* ${formData.fullName}\n` +
          `*Telefono:* ${formData.phone}\n` +
          `*Servizio:* ${serviceName}\n` +
          `*Veicolo:* ${pendingBookingData.vehicle_name}\n` +
          `*Data e Ora:* ${formattedDate} alle ${formData.appointmentTime}\n`;

        if (formData.notes) {
          whatsappMessage += `*Note:* ${formData.notes}\n`;
        }

        whatsappMessage += `*Totale:* €${totalPrice}\n\n` +
          `Grazie!`;

        const officeWhatsAppNumber = '393457905205';
        const whatsappUrl = `https://wa.me/${officeWhatsAppNumber}?text=${encodeURIComponent(whatsappMessage)}`;

        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1000);

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
                <div className="md:col-span-2">
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

            {/* Vehicle Info */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {lang === 'it' ? 'Informazioni Veicolo' : 'Vehicle Information'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Marca' : 'Make'} *
                  </label>
                  <input
                    type="text"
                    name="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={handleChange}
                    placeholder={lang === 'it' ? 'es. Fiat' : 'e.g. Fiat'}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                  {errors.vehicleMake && <p className="text-xs text-red-400 mt-1">{errors.vehicleMake}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Modello' : 'Model'} *
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    placeholder={lang === 'it' ? 'es. Panda' : 'e.g. Panda'}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                  {errors.vehicleModel && <p className="text-xs text-red-400 mt-1">{errors.vehicleModel}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Anno' : 'Year'}
                  </label>
                  <input
                    type="text"
                    name="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={handleChange}
                    placeholder="2020"
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Targa' : 'License Plate'}
                  </label>
                  <input
                    type="text"
                    name="vehiclePlate"
                    value={formData.vehiclePlate}
                    onChange={handleChange}
                    placeholder={lang === 'it' ? 'es. AB123CD' : 'e.g. AB123CD'}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white uppercase"
                  />
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Ora' : 'Time'} *
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                    {getAllTimeSlotsWithAvailability().map(slot => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setFormData(prev => ({ ...prev, appointmentTime: slot.time }))}
                        className={`
                          px-3 py-2 rounded-lg font-semibold text-sm transition-all
                          ${formData.appointmentTime === slot.time
                            ? 'bg-white text-black ring-2 ring-white'
                            : slot.available
                            ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                            : 'bg-gray-900 text-gray-500 border-2 border-red-500 cursor-not-allowed opacity-60'
                          }
                        `}
                        title={!slot.available ? (lang === 'it' ? `Non disponibile` : `Unavailable`) : ''}
                      >
                        {slot.time}
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
                <span className="text-4xl font-bold text-white">€{selectedService.price}</span>
              </div>

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
                  <span>€{selectedService?.price}</span>
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
                      className="bg-gray-800 border border-gray-700 rounded-md p-3 min-h-[44px]"
                      style={{ position: 'relative', zIndex: 1 }}
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
                      : (lang === 'it' ? `Paga €${selectedService?.price}` : `Pay €${selectedService?.price}`)}
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

export default MechanicalBookingPage;
