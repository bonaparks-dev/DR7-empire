import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useTranslation } from '../hooks/useTranslation';
import { RENTAL_CATEGORIES } from '../constants';

interface Booking {
  id: string;
  service_type: 'car_rental' | 'car_wash';
  service_name?: string;
  vehicle_name: string;
  vehicle_type?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  appointment_date?: string;
  appointment_time?: string;
  pickup_date?: string;
  dropoff_date?: string;
  price_total: number;
  status: string;
  payment_status: string;
}

const AdminCalendarPage: React.FC = () => {
  const { lang } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Fetch all bookings
  useEffect(() => {
    fetchBookings();

    // Set up real-time subscription
    const subscription = supabase
      .channel('admin-bookings')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('pickup_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique vehicles from bookings
  const vehicles = useMemo(() => {
    const uniqueVehicles = new Set<string>();
    bookings.forEach(booking => {
      if (booking.vehicle_name) {
        uniqueVehicles.add(booking.vehicle_name);
      }
    });
    return Array.from(uniqueVehicles).sort();
  }, [bookings]);

  // Filter bookings by selected vehicle
  const filteredBookings = useMemo(() => {
    if (selectedVehicle === 'all') return bookings;
    return bookings.filter(b => b.vehicle_name === selectedVehicle);
  }, [bookings, selectedVehicle]);

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];

    return filteredBookings.filter(booking => {
      if (booking.service_type === 'car_wash' && booking.appointment_date) {
        const bookingDate = new Date(booking.appointment_date).toISOString().split('T')[0];
        return bookingDate === dateStr;
      }

      if (booking.service_type === 'car_rental' && booking.pickup_date && booking.dropoff_date) {
        const pickupDate = new Date(booking.pickup_date);
        const dropoffDate = new Date(booking.dropoff_date);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        pickupDate.setHours(0, 0, 0, 0);
        dropoffDate.setHours(0, 0, 0, 0);

        return checkDate >= pickupDate && checkDate <= dropoffDate;
      }

      return false;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatBookingTime = (booking: Booking) => {
    if (booking.service_type === 'car_wash') {
      return booking.appointment_time || 'N/A';
    }
    if (booking.pickup_date) {
      return new Date(booking.pickup_date).toLocaleTimeString(lang === 'it' ? 'it-IT' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Rome'
      });
    }
    return 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const calendarDays = getCalendarDays();
  const monthName = currentDate.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>{lang === 'it' ? 'Caricamento calendario...' : 'Loading calendar...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              📅 {lang === 'it' ? 'Calendario Prenotazioni' : 'Bookings Calendar'}
            </h1>
            <p className="text-gray-400">
              {lang === 'it'
                ? 'Visualizza e gestisci tutte le prenotazioni'
                : 'View and manage all bookings'}
            </p>
          </div>

          {/* Filters and Controls */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Vehicle Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {lang === 'it' ? 'Filtra per veicolo' : 'Filter by vehicle'}
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                >
                  <option value="all">
                    {lang === 'it' ? 'Tutti i veicoli' : 'All vehicles'}
                  </option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle} value={vehicle}>
                      {vehicle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Navigation */}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={goToToday}
                  className="flex-1 px-4 py-2 bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition-colors"
                >
                  {lang === 'it' ? 'Oggi' : 'Today'}
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  →
                </button>
              </div>

              {/* Stats */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">
                  {lang === 'it' ? 'Prenotazioni totali' : 'Total bookings'}
                </div>
                <div className="text-2xl font-bold text-white">{filteredBookings.length}</div>
              </div>
            </div>
          </div>

          {/* Calendar Month/Year Display */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white capitalize">{monthName}</h2>
          </div>

          {/* Calendar Grid */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day, idx) => (
                <div key={idx} className="text-center text-sm font-semibold text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const dayBookings = getBookingsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <motion.div
                    key={day.toISOString()}
                    whileHover={{ scale: 1.02 }}
                    className={`
                      aspect-square border rounded-lg p-2 transition-colors
                      ${isToday ? 'border-white bg-white/10' : 'border-gray-700'}
                      ${!isCurrentMonth ? 'opacity-50' : ''}
                      ${dayBookings.length > 0 ? 'bg-gray-800/50' : 'bg-gray-900/30'}
                      hover:bg-gray-800 cursor-pointer
                    `}
                  >
                    <div className="text-sm font-semibold text-white mb-1">
                      {day.getDate()}
                    </div>

                    {/* Booking indicators */}
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map(booking => (
                        <div
                          key={booking.id}
                          className={`
                            text-xs px-1 py-0.5 rounded truncate border
                            ${getStatusColor(booking.status)}
                          `}
                          title={`${booking.vehicle_name} - ${booking.customer_name} - ${formatBookingTime(booking)}`}
                        >
                          {booking.service_type === 'car_wash' ? '🚿' : '🚗'}{' '}
                          {booking.appointment_time || formatBookingTime(booking)}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{dayBookings.length - 3} {lang === 'it' ? 'altro' : 'more'}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bookings List Below Calendar */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4">
              {lang === 'it' ? 'Prossime Prenotazioni' : 'Upcoming Bookings'}
            </h3>
            <div className="space-y-4">
              {filteredBookings
                .filter(b => {
                  const bookingDate = b.pickup_date || b.appointment_date;
                  if (!bookingDate) return false;
                  return new Date(bookingDate) >= new Date();
                })
                .slice(0, 10)
                .map(booking => (
                  <div
                    key={booking.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {booking.service_type === 'car_wash' ? '🚿' : '🚗'}
                          </span>
                          <div>
                            <h4 className="text-lg font-bold text-white">
                              {booking.vehicle_name}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {booking.service_name || booking.service_type}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">{lang === 'it' ? 'Cliente' : 'Customer'}</p>
                            <p className="text-white font-medium">{booking.customer_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">{lang === 'it' ? 'Data' : 'Date'}</p>
                            <p className="text-white font-medium">
                              {booking.appointment_date
                                ? new Date(booking.appointment_date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { timeZone: 'Europe/Rome' })
                                : booking.pickup_date
                                ? new Date(booking.pickup_date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { timeZone: 'Europe/Rome' })
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">{lang === 'it' ? 'Ora' : 'Time'}</p>
                            <p className="text-white font-medium">
                              {formatBookingTime(booking)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">{lang === 'it' ? 'Totale' : 'Total'}</p>
                            <p className="text-white font-medium">
                              €{(booking.price_total / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          ID: {booking.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h4 className="text-sm font-semibold text-white mb-4">
              {lang === 'it' ? 'Legenda' : 'Legend'}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚿</span>
                <span className="text-sm text-gray-300">Car Wash</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🚗</span>
                <span className="text-sm text-gray-300">Car Rental</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
                <span className="text-sm text-gray-300">Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30"></div>
                <span className="text-sm text-gray-300">Pending</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminCalendarPage;
