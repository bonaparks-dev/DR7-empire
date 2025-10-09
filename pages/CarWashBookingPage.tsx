import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { SERVICES, ADDITIONAL_SERVICES, Service } from '../constants/carWash.constants'; // <-- move constants here to avoid circular imports
import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51S3dDjQcprtTyo8tBfBy5mAZj8PQXkxfZ1RCnWskrWFZ2WEnm1u93ZnE2tBi316Gz2CCrvLV98IjSoiXb0vSDpOQ003fNG69Y2';

const CarWashBookingPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ serviceId?: string }>();
  const { user } = useAuth();

  // Resolve serviceId from: state -> route param -> querystring
  const stateServiceId = (location.state as any)?.serviceId;
  const queryServiceId = useMemo(() => new URLSearchParams(location.search).get('serviceId'), [location.search]);
  const serviceId = stateServiceId || params.serviceId || queryServiceId || null;

  const selectedService = useMemo(() => {
    return SERVICES.find(s => s.id === serviceId);
  }, [serviceId]);

  // Today (YYYY-MM-DD)
  const minDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

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
  const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isClientSecretLoading, setIsClientSecretLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);

  // Ensure Stripe.js is loaded (remember to include <script src="https://js.stripe.com/v3"></script> in index.html)
  useEffect(() => {
    if ((window as any).Stripe) {
      if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('YOUR_')) {
        console.error("Stripe.js loaded but publishable key is not set.");
        setStripeError("Payment service is not configured correctly. Please contact support.");
        return;
      }
      const stripeInstance = (window as any).Stripe(STRIPE_PUBLISHABLE_KEY);
      setStripe(stripeInstance);
      setElements(stripeInstance.elements());
    } else {
      console.warn('Stripe.js not found on window. Did you add <script src="https://js.stripe.com/v3"></script>?');
    }
  }, []);

  // If service missing, redirect with a visible fallback (avoid returning null/blank)
  useEffect(() => {
    if (!serviceId || !selectedService) {
      navigate('/car-wash-services', { replace: true });
    }
  }, [serviceId, selectedService, navigate]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: (user as any).fullName || user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: (user as any).phone || ''
      }));
    }
  }, [user]);

  // Clear time when date changes if it becomes invalid
  useEffect(() => {
    if (formData.appointmentDate && formData.appointmentTime) {
      const available = getAvailableTimeSlots();
      if (!available.includes(formData.appointmentTime)) {
        setFormData(prev => ({ ...prev, appointmentTime: '' }));
      }
    }
  }, [formData.appointmentDate]);

  // Create payment intent when modal opens
  useEffect(() => {
    if (!showPaymentModal || calculateTotal() <= 0 || !selectedService) return;

    setIsClientSecretLoading(true);
    setStripeError(null);
    setClientSecret(null);

    fetch('/.netlify/functions/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: calculateTotal(), // euros, backend converts to cents
        currency: 'eur',
        email: user?.email,
        purchaseType: 'car-wash',
        metadata: {
          serviceName: lang === 'it' ? selectedService.name : selectedService.nameEn,
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime
        }
      })
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || `Payment intent failed (${res.status})`);
        }
        return data;
      })
      .then(data => setClientSecret(data.clientSecret))
      .catch(err => {
        console.error('Failed to fetch client secret:', err);
        setStripeError(err.message || 'Could not connect to payment server.');
      })
      .finally(() => setIsClientSecretLoading(false));
  }, [showPaymentModal, user, selectedService, formData.appointmentDate, formData.appointmentTime, lang]);

  // Mount Stripe Card Element and keep a stable reference
  useEffect(() => {
    if (!elements || !clientSecret || !cardElementRef.current) return;

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
    setCardElement(card);

    const onChange = (event: any) => setStripeError(event.error ? event.error.message : null);
    card.on('change', onChange);

    return () => {
      card.off('change', onChange);
      card.unmount();
      setCardElement(null);
    };
  }, [elements, clientSecret]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const getAvailableTimeSlots = () => {
    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      '18:00', '18:30', '19:00'
    ];
    if (!formData.appointmentDate) return timeSlots;

    const selectedDate = new Date(formData.appointmentDate);
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    if (!isToday) return timeSlots;

    const currentTimeInMinutes = today.getHours() * 60 + today.getMinutes();
    const minTime = currentTimeInMinutes + 120;
    return timeSlots.filter(slot => {
      const [h, m] = slot.split(':').map(Number);
      return h * 60 + m >= minTime;
    });
  };

  const isValidAppointmentTime = (date: string, time: string) => {
    if (!date || !time) return false;
    const d = new Date(date);
    const dow = d.getDay();
    if (dow === 0) return false; // Sunday closed
    const [h, m] = time.split(':').map(Number);
    const mins = h * 60 + m;
    if (mins < 9 * 60 || mins > 19 * 60) return false;
    if (m !== 0 && m !== 30) return false;

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      const minWithBuffer = now.getHours() * 60 + now.getMinutes() + 120;
      if (mins < minWithBuffer) return false;
    }
    return true;
    };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = lang === 'it' ? 'Il nome è obbligatorio' : 'Name is required';
    if (!formData.email) newErrors.email = lang === 'it' ? "L'email è obbligatoria" : 'Email is required';
    if (!formData.phone) newErrors.phone = lang === 'it' ? 'Il telefono è obbligatorio' : 'Phone is required';
    if (!formData.appointmentDate) newErrors.appointmentDate = lang === 'it' ? 'La data è obbligatoria' : 'Date is required';
    if (!formData.appointmentTime) newErrors.appointmentTime = lang === 'it' ? "L'ora è obbligatoria" : 'Time is required';

    if (formData.appointmentDate && formData.appointmentDate < minDate) {
      newErrors.appointmentDate = lang === 'it'
        ? 'La data non può essere nel passato. Seleziona da oggi in poi.'
        : 'Date cannot be in the past. Select from today onwards.';
    }

    if (formData.appointmentDate && formData.appointmentTime && !newErrors.appointmentDate) {
      if (!isValidAppointmentTime(formData.appointmentDate, formData.appointmentTime)) {
        const dow = new Date(formData.appointmentDate).getDay();
        if (dow === 0) {
          newErrors.appointmentDate = lang === 'it' ? 'Siamo chiusi la domenica' : 'We are closed on Sundays';
        } else {
          newErrors.appointmentTime = lang === 'it'
            ? 'Orario disponibile: Lunedì-Sabato 9:00-19:00 (minimo 2 ore in anticipo)'
            : 'Available hours: Monday-Saturday 9:00-19:00 (minimum 2 hours in advance)';
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
      if (priceOption) total += priceOption.price;
    }
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return; // safety
    if (!validate()) return;

    const bookingData = {
      user_id: user?.id || null,
      vehicle_type: 'car',
      vehicle_name: 'Car Wash Service',
      service_type: 'car_wash',
      service_name: lang === 'it' ? selectedService.name : selectedService.nameEn,
      service_id: selectedService.id,
      price_total: Math.round(calculateTotal() * 100),
      currency: 'EUR',
      customer_name: formData.fullName,
      customer_email: formData.email,
      customer_phone: formData.phone,
      appointment_date: new Date(`${formData.appointmentDate}T${formData.appointmentTime}`).toISOString(),
      booking_details: {
        additionalService: formData.additionalService,
        additionalServiceHours: formData.additionalServiceHours,
        notes: formData.notes
      },
      status: 'confirmed',
      payment_status: 'pending',
      booked_at: new Date().toISOString()
    };

    setPendingBookingData(bookingData);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!stripe || !cardElement || !clientSecret || !pendingBookingData) return;
    setIsProcessing(true);
    setStripeError(null);

    try {
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

      if (paymentIntent?.status === 'succeeded') {
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

        if (error) throw error;

        // Fire-and-forget notifications
        fetch('/.netlify/functions/send-booking-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: data })
        }).catch(console.error);

        fetch('/.netlify/functions/send-whatsapp-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: data })
        }).catch(console.error);

        navigate('/booking-success', { state: { booking: data } });
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setStripeError(err.message || 'Payment processing failed');
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

  // Fallback UI while redirecting if service not found
  if (!serviceId || !selectedService) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
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
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                         className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white" />
                  {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                         className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white" />
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Telefono' : 'Phone'} *
                  </label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                         className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white" />
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
                  </span>{' '}
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
                  <input type="date" name="appointmentDate" value={formData.appointmentDate}
                         onChange={handleChange} min={minDate}
                         className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white" />
                  {errors.appointmentDate && <p className="text-xs text-red-400 mt-1">{errors.appointmentDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Ora' : 'Time'} *
                  </label>
                  <select name="appointmentTime" value={formData.appointmentTime} onChange={handleChange}
                          className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white">
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
                  <select name="additionalService" value={formData.additionalService} onChange={handleChange}
                          className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white">
                    <option value="">{lang === 'it' ? 'Nessuno' : 'None'}</option>
                    {ADDITIONAL_SERVICES.map(s => (
                      <option key={s.id} value={s.id}>
                        {lang === 'it' ? s.name : s.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                {!!formData.additionalService && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {lang === 'it' ? 'Durata' : 'Duration'}
                    </label>
                    <select name="additionalServiceHours" value={formData.additionalServiceHours} onChange={handleChange}
                            className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white">
                      <option value={0}>{lang === 'it' ? 'Seleziona durata' : 'Select duration'}</option>
                      {ADDITIONAL_SERVICES.find(s => s.id === formData.additionalService)?.prices.map(p => (
                        <option key={p.hours} value={p.hours}>
                          {p.duration} - €{p.price}
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
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4}
                        placeholder={lang === 'it' ? 'Richieste speciali o note...' : 'Special requests or notes...'}
                        className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white" />
            </div>

            {/* Total & Submit */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-white">{lang === 'it' ? 'Totale' : 'Total'}</span>
                <span className="text-4xl font-bold text-white">€{calculateTotal()}</span>
              </div>

              {errors.form && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-3 mb-4">
                  {errors.form}
                </p>
              )}

              <button type="submit" disabled={isSubmitting}
                      className="w-full bg-white text-black font-bold py-4 px-6 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60">
                {lang === 'it' ? 'PROCEDI AL PAGAMENTO' : 'PROCEED TO PAYMENT'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                      onClick={handleCloseModal}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-gray-900 border border-gray-700 rounded-lg p-6 md:p-8 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {lang === 'it' ? 'Completa il Pagamento' : 'Complete Payment'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
              </div>

              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>{lang === 'it' ? 'Servizio' : 'Service'}:</span>
                  <span className="text-white font-semibold">
                    {lang === 'it' ? selectedService?.name : selectedService?.nameEn}
                  </span>
                </div>
                {!!formData.additionalService && (
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
                    <div ref={cardElementRef} className="bg-gray-800 border border-gray-700 rounded-md p-3" />
                  </div>

                  {stripeError && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
                      {stripeError}
                    </div>
                  )}

                  <button onClick={handlePayment} disabled={isProcessing || !stripe || !cardElement}
                          className="w-full bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60">
                    {isProcessing
                      ? (lang === 'it' ? 'Elaborazione...' : 'Processing...')
                      : (lang === 'it' ? `Paga €${calculateTotal()}` : `Pay €${calculateTotal()}`)}
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-4">
                    {lang === 'it' ? 'Pagamento sicuro elaborato da Stripe' : 'Secure payment processed by Stripe'}
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
