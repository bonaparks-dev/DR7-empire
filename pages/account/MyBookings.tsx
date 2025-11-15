import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../supabaseClient';
import { CalendarIcon } from '../../components/icons/Icons';
import { Link } from 'react-router-dom';

interface Booking {
  id: string;
  service_type: 'car_rental' | 'car_wash';
  service_name: string;
  vehicle_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  appointment_date?: string;
  appointment_time?: string;
  pickup_date?: string;
  dropoff_date?: string;
  pickup_location?: string;
  price_total: number;
  currency: string;
  payment_status: string;
  status: string;
  booked_at: string;
  booking_details?: any;
}

const MyBookings = () => {
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('booked_at', { ascending: false });

        if (error) throw error;

        setBookings(data || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      confirmed: 'bg-green-500/20 text-green-400',
      completed: 'bg-blue-500/20 text-blue-400',
      cancelled: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColors[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      paid: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colors[paymentStatus] || 'bg-gray-500/20 text-gray-400'}`}>
        {paymentStatus === 'paid' ? '✓ Paid' : paymentStatus === 'pending' ? '⏳ Pending' : paymentStatus}
      </span>
    );
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-1">
          <CalendarIcon className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">{t('My_Bookings')}</h2>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {lang === 'it' ? 'Visualizza tutte le tue prenotazioni' : 'View all your bookings'}
        </p>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            {lang === 'it' ? 'Caricamento...' : 'Loading...'}
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 md:p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">
                          {booking.service_type === 'car_wash' ? '🚗 ' : '🚘 '}
                          {booking.service_name}
                        </h3>
                        {booking.vehicle_name && booking.service_type === 'car_rental' && (
                          <p className="text-sm text-gray-400">{booking.vehicle_name}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(booking.status)}
                        {getPaymentBadge(booking.payment_status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">
                          {lang === 'it' ? 'ID Prenotazione' : 'Booking ID'}:
                        </p>
                        <p className="text-white font-mono">
                          DR7-{booking.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>

                      {booking.service_type === 'car_wash' && booking.appointment_date && (
                        <div>
                          <p className="text-gray-400">
                            {lang === 'it' ? 'Data Appuntamento' : 'Appointment'}:
                          </p>
                          <p className="text-white">
                            {new Date(booking.appointment_date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              timeZone: 'Europe/Rome'
                            })}
                            {booking.appointment_time && ` ${lang === 'it' ? 'alle' : 'at'} ${booking.appointment_time}`}
                          </p>
                        </div>
                      )}

                      {booking.service_type === 'car_rental' && booking.pickup_date && (
                        <>
                          <div>
                            <p className="text-gray-400">
                              {lang === 'it' ? 'Ritiro' : 'Pick-up'}:
                            </p>
                            <p className="text-white">{formatDate(booking.pickup_date)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">
                              {lang === 'it' ? 'Riconsegna' : 'Drop-off'}:
                            </p>
                            <p className="text-white">
                              {booking.dropoff_date ? formatDate(booking.dropoff_date) : 'N/A'}
                            </p>
                          </div>
                          {booking.pickup_location && (
                            <div className="md:col-span-2">
                              <p className="text-gray-400">
                                {lang === 'it' ? 'Luogo Ritiro' : 'Pickup Location'}:
                              </p>
                              <p className="text-white">{booking.pickup_location}</p>
                            </div>
                          )}
                        </>
                      )}

                      <div>
                        <p className="text-gray-400">
                          {lang === 'it' ? 'Totale' : 'Total'}:
                        </p>
                        <p className="text-white font-bold text-lg">
                          {formatPrice(booking.price_total, booking.currency)}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400">
                          {lang === 'it' ? 'Prenotato il' : 'Booked on'}:
                        </p>
                        <p className="text-white">{formatDate(booking.booked_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white">
              {lang === 'it'
                ? 'Nessuna prenotazione ancora'
                : 'No bookings yet'}
            </h3>
            <p className="text-gray-400 mt-1">
              {lang === 'it'
                ? 'Le tue prenotazioni appariranno qui'
                : 'Your bookings will appear here'}
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/car-rentals"
                className="inline-block px-5 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm"
              >
                {lang === 'it' ? 'Noleggio Auto' : 'Rent a Car'}
              </Link>
              <Link
                to="/car-wash-services"
                className="inline-block px-5 py-2.5 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors text-sm"
              >
                {lang === 'it' ? 'Autolavaggio' : 'Car Wash'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
