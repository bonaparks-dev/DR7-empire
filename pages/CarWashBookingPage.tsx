import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { SERVICES, ADDITIONAL_SERVICES, Service } from './CarWashServicesPage';

const CarWashBookingPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const serviceId = (location.state as any)?.serviceId;
  const selectedService = SERVICES.find(s => s.id === serviceId);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const isValidAppointmentTime = (date: string, time: string) => {
    if (!date || !time) return false;

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    // Sunday = 0, Monday = 1, Saturday = 6
    if (dayOfWeek === 0) return false;

    // Check time is between 9:00 and 20:00
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    const minTime = 9 * 60; // 9:00 AM
    const maxTime = 20 * 60; // 8:00 PM

    return timeInMinutes >= minTime && timeInMinutes <= maxTime;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = lang === 'it' ? 'Il nome è obbligatorio' : 'Name is required';
    if (!formData.email) newErrors.email = lang === 'it' ? 'L\'email è obbligatoria' : 'Email is required';
    if (!formData.phone) newErrors.phone = lang === 'it' ? 'Il telefono è obbligatorio' : 'Phone is required';
    if (!formData.appointmentDate) newErrors.appointmentDate = lang === 'it' ? 'La data è obbligatoria' : 'Date is required';
    if (!formData.appointmentTime) newErrors.appointmentTime = lang === 'it' ? 'L\'ora è obbligatoria' : 'Time is required';

    // Validate working hours
    if (formData.appointmentDate && formData.appointmentTime) {
      if (!isValidAppointmentTime(formData.appointmentDate, formData.appointmentTime)) {
        const dayOfWeek = new Date(formData.appointmentDate).getDay();
        if (dayOfWeek === 0) {
          newErrors.appointmentDate = lang === 'it' ? 'Siamo chiusi la domenica' : 'We are closed on Sundays';
        } else {
          newErrors.appointmentTime = lang === 'it' ? 'Orario disponibile: Lunedì-Sabato 9:00-20:00' : 'Available hours: Monday-Saturday 9:00-20:00';
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
      const priceOption = addService?.prices.find(p => p.hours === formData.additionalServiceHours);
      if (priceOption) {
        total += priceOption.price;
      }
    }

    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedService) return;

    setIsSubmitting(true);

    try {
      const bookingData = {
        user_id: user?.id || null,
        service_type: 'car_wash',
        service_name: lang === 'it' ? selectedService.name : selectedService.nameEn,
        service_id: selectedService.id,
        price_total: Math.round(calculateTotal() * 100), // in cents
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
        status: 'pending',
        payment_status: 'pending',
        booked_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      navigate('/booking-success', { state: { booking: data } });
    } catch (error: any) {
      console.error('Booking error:', error);
      setErrors({ form: error.message || 'Booking failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedService) return null;

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
                  {lang === 'it' ? 'Lunedì - Sabato, 9:00 - 20:00' : 'Monday - Saturday, 9:00 AM - 8:00 PM'}
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
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                  {errors.appointmentDate && <p className="text-xs text-red-400 mt-1">{errors.appointmentDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {lang === 'it' ? 'Ora' : 'Time'} *
                  </label>
                  <input
                    type="time"
                    name="appointmentTime"
                    value={formData.appointmentTime}
                    onChange={handleChange}
                    min="09:00"
                    max="20:00"
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"
                  />
                  {errors.appointmentTime && <p className="text-xs text-red-400 mt-1">{errors.appointmentTime}</p>}
                  {!errors.appointmentTime && formData.appointmentTime && (
                    <p className="text-xs text-gray-400 mt-1">
                      {lang === 'it' ? 'Orario selezionato: ' : 'Selected time: '}{formData.appointmentTime}
                    </p>
                  )}
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
                {isSubmitting
                  ? (lang === 'it' ? 'Prenotazione in corso...' : 'Booking...')
                  : (lang === 'it' ? 'CONFERMA PRENOTAZIONE' : 'CONFIRM BOOKING')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CarWashBookingPage;
