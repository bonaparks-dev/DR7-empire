import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import type { Booking } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { getConfirmationSuccessCopy, type ConfirmationSuccessCopy } from '../utils/siteCopy';

const BookingConfirmationDetails: React.FC<{ booking: any; copy: ConfirmationSuccessCopy }> = ({ booking, copy }) => {
  const { lang } = useTranslation();
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
  const tx = (it: keyof ConfirmationSuccessCopy, en: keyof ConfirmationSuccessCopy): string =>
    (copy as Record<string, string>)[(lang === 'it' ? it : en) as string];

  if (isCarWash) {
    return (
      <div className="text-left space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">
          {tx('booking_summary_heading_it', 'booking_summary_heading_en')}
        </h2>

        <div className="flex justify-between">
          <span className="text-gray-400">{tx('carwash_row_servizio_it', 'carwash_row_servizio_en')}</span>
          <span className="font-semibold text-white">{booking.service_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">{tx('carwash_row_data_it', 'carwash_row_data_en')}</span>
          <span className="font-semibold text-white">
            {new Date(booking.appointment_date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', { timeZone: 'Europe/Rome' })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">{tx('carwash_row_orario_it', 'carwash_row_orario_en')}</span>
          <span className="font-semibold text-white">{booking.appointment_time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">{tx('carwash_row_cliente_it', 'carwash_row_cliente_en')}</span>
          <span className="font-semibold text-white">{booking.customer_name || booking.booking_details?.customer?.fullName || tx('carwash_default_customer_it', 'carwash_default_customer_en')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">{tx('carwash_row_pagamento_it', 'carwash_row_pagamento_en')}</span>
          <span className="font-semibold text-white">{tx('carwash_payment_online_it', 'carwash_payment_online_en')}</span>
        </div>
        <div className="border-t border-gray-700 pt-4 mt-4 flex justify-between text-lg">
          <span className="font-bold text-white">{tx('carwash_totale_pagato_it', 'carwash_totale_pagato_en')}</span>
          <span className="font-bold text-white">{formatPrice(totalPrice)}</span>
        </div>
        <p className="text-xs text-gray-400 text-center pt-2">
          {tx('carwash_whatsapp_note_it', 'carwash_whatsapp_note_en')}
        </p>
      </div>
    );
  }

  // Rental
  const pickupDate = new Date(booking.pickup_date);
  const dropoffDate = new Date(booking.dropoff_date);
  const dateLocale = lang === 'it' ? 'it-IT' : 'en-GB';
  const timeConnector = tx('rental_time_connector_it', 'rental_time_connector_en');
  const agencyFootnote = (lang === 'it' ? copy.rental_agency_footnote_it : copy.rental_agency_footnote_en)
    .split('{total}').join(formatPrice(totalPrice));

  return (
    <div className="text-left space-y-4">
      <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">
        {tx('booking_summary_heading_it', 'booking_summary_heading_en')}
      </h2>

      <div className="flex justify-between">
        <span className="text-gray-400">{tx('rental_row_veicolo_it', 'rental_row_veicolo_en')}</span>
        <span className="font-semibold text-white">{booking.vehicle_name}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">{tx('rental_row_ritiro_it', 'rental_row_ritiro_en')}</span>
        <span className="font-semibold text-white">
          {pickupDate.toLocaleDateString(dateLocale, { timeZone: 'Europe/Rome' })} {timeConnector} {pickupDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">{tx('rental_row_riconsegna_it', 'rental_row_riconsegna_en')}</span>
        <span className="font-semibold text-white">
          {dropoffDate.toLocaleDateString(dateLocale, { timeZone: 'Europe/Rome' })} {timeConnector} {dropoffDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">{tx('rental_row_luogo_it', 'rental_row_luogo_en')}</span>
        <span className="font-semibold text-white capitalize">{booking.pickup_location}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">{tx('rental_row_pagamento_it', 'rental_row_pagamento_en')}</span>
        <span className="font-semibold text-white capitalize">
          {booking.payment_method === 'agency'
            ? tx('rental_payment_in_sede_it', 'rental_payment_in_sede_en')
            : tx('rental_payment_online_it', 'rental_payment_online_en')}
        </span>
      </div>
      <div className="border-t border-gray-700 pt-4 mt-4 flex justify-between text-lg">
        <span className="font-bold text-white">
          {isPaid
            ? tx('rental_totale_pagato_it', 'rental_totale_pagato_en')
            : tx('rental_totale_da_pagare_it', 'rental_totale_da_pagare_en')}
        </span>
        <span className="font-bold text-white">{formatPrice(totalPrice)}</span>
      </div>
      {booking.payment_method === 'agency' && (
        <p className="text-xs text-gray-400 text-center pt-2">
          {agencyFootnote}
        </p>
      )}
    </div>
  );
};

const ConfirmationSuccessPage: React.FC = () => {
  const { lang } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();
  const { booking } = (location.state || {}) as { booking?: Booking };
  const [copy, setCopy] = useState<ConfirmationSuccessCopy | null>(null);

  useEffect(() => {
    let cancelled = false;
    getConfirmationSuccessCopy().then((c) => { if (!cancelled) setCopy(c); });
    return () => { cancelled = true; };
  }, []);

  if (loading || !copy) return null;

  const tx = (it: keyof ConfirmationSuccessCopy, en: keyof ConfirmationSuccessCopy): string =>
    (copy as Record<string, string>)[(lang === 'it' ? it : en) as string];

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
            <div className="w-20 h-20 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-6"></div>
            <h1 className="text-3xl font-bold mb-2">{tx('booking_title_it', 'booking_title_en')}</h1>
            <p className="mb-6 text-gray-300">{tx('booking_subtitle_it', 'booking_subtitle_en')}</p>

            <BookingConfirmationDetails booking={booking} copy={copy} />

            <Button as={Link} to={destination} variant="primary" size="lg" className="mt-8 w-full">
              {tx('booking_cta_account_it', 'booking_cta_account_en')}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Email-confirmed fallback
  const destination = user ? (user.role === 'business' ? '/partner/dashboard' : '/account') : '/signin';
  const message = user
    ? tx('email_body_logged_in_it', 'email_body_logged_in_en')
    : tx('email_body_logged_out_it', 'email_body_logged_out_en');
  const buttonText = user
    ? tx('email_cta_logged_in_it', 'email_cta_logged_in_en')
    : tx('email_cta_logged_out_it', 'email_cta_logged_out_en');

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
          <div className="w-20 h-20 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-6"></div>
          <h1 className="text-3xl font-bold mb-4">{tx('email_title_it', 'email_title_en')}</h1>
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
