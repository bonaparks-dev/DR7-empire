import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import type { Booking } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

const BookingConfirmationDetails: React.FC<{ booking: any }> = ({ booking }) => {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  const formatPrice = (priceInCents: number) =>
    new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(priceInCents / 100);

  const totalPrice = booking.price_total;
  const isCarWash = booking.service_type === 'car_wash';
  const isPaid = booking.payment_method !== 'agency';

  // For car wash bookings
  if (isCarWash) {
    return (
      <div className="text-left space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Riepilogo Prenotazione</h2>

        <div className="flex justify-between">
          <span className="text-gray-400">Servizio:</span>
          <span className="font-semibold text-white">{booking.service_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Data:</span>
          <span className="font-semibold text-white">
            {new Date(booking.appointment_date + 'T00:00:00').toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Orario:</span>
          <span className="font-semibold text-white">{booking.appointment_time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Cliente:</span>
          <span className="font-semibold text-white">{booking.customer_name || booking.booking_details?.customer?.fullName || 'Cliente'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Pagamento:</span>
          <span className="font-semibold text-white">Online</span>
        </div>
        <div className="border-t border-gray-700 pt-4 mt-4 flex justify-between text-lg">
          <span className="font-bold text-white">TOTALE PAGATO:</span>
          <span className="font-bold text-white">{formatPrice(totalPrice)}</span>
        </div>
        <p className="text-xs text-gray-400 text-center pt-2">
          Riceverai una conferma via email a {booking.customer_email || booking.booking_details?.customer?.email}
        </p>
      </div>
    );
  }

  // For car rental bookings
  const pickupDate = new Date(booking.pickup_date);
  const dropoffDate = new Date(booking.dropoff_date);

  return (
    <div className="text-left space-y-4">
      <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Riepilogo Prenotazione</h2>

      <div className="flex justify-between">
        <span className="text-gray-400">Veicolo:</span>
        <span className="font-semibold text-white">{booking.vehicle_name}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Ritiro:</span>
        <span className="font-semibold text-white">
          {pickupDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })} alle {pickupDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Riconsegna:</span>
        <span className="font-semibold text-white">
          {dropoffDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })} alle {dropoffDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Luogo:</span>
        <span className="font-semibold text-white capitalize">{booking.pickup_location}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Pagamento:</span>
        <span className="font-semibold text-white capitalize">
          {booking.payment_method === 'agency' ? 'In Sede' : 'Online'}
        </span>
      </div>
      <div className="border-t border-gray-700 pt-4 mt-4 flex justify-between text-lg">
        <span className="font-bold text-white">TOTALE {isPaid ? 'PAGATO' : 'DA PAGARE'}:</span>
        <span className="font-bold text-white">{formatPrice(totalPrice)}</span>
      </div>
      {booking.payment_method === 'agency' && (
        <p className="text-xs text-gray-400 text-center pt-2">
          L'importo totale di {formatPrice(totalPrice)} sarà dovuto al momento del ritiro.
        </p>
      )}
    </div>
  );
};
const ConfirmationSuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();
  const { booking } = (location.state || {}) as { booking?: Booking };

  if (loading) {
    return null; // Render nothing while auth state is resolving to avoid flicker
  }

  // If there's booking data, show the booking confirmation.
  if (booking) {
    const destination = user?.role === 'business' ? '/partner/dashboard' : '/account';
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-white"
      >
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-2xl shadow-black/50 p-8"
          >
            <div className="w-20 h-20 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-6">
              
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('Booking_Confirmed')}</h1>
            <p className="mb-6 text-gray-300">{t('Booking_Confirmation_Sent')}</p>

            <BookingConfirmationDetails booking={booking} />

            <Button as={Link} to={destination} variant="primary" size="lg" className="mt-8 w-full">
              {t('Proceed_to_My_Account')}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Fallback for email confirmation if no booking data is present.
  const destination = user ? (user.role === 'business' ? '/partner/dashboard' : '/account') : '/signin';
  const message = user ? t('Account_Successfully_Created') : 'Il tuo indirizzo email è stato verificato con successo. Accedi per entrare nel tuo account.';
  const buttonText = user ? t('Proceed_to_My_Account') : 'Accedi';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-white"
    >
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-2xl shadow-black/50 p-8"
        >
          <div className="w-20 h-20 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-6">
            
          </div>
          <h1 className="text-3xl font-bold mb-4">{t('Email_Confirmed')}</h1>
          <p className="mb-8 text-gray-300">{message}</p>
          <Button as={Link} to={destination} variant="primary" size="lg">
            {buttonText}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ConfirmationSuccessPage;
