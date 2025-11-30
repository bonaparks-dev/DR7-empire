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

interface EditingBooking extends Booking {
  isEditing: true;
}

const AdminCalendarPage: React.FC = () => {
  const { lang } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showVehicleCalendar, setShowVehicleCalendar] = useState<string | null>(null);

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

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
  };

  const handleSaveBooking = async (updatedBooking: Booking) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          customer_name: updatedBooking.customer_name,
          customer_email: updatedBooking.customer_email,
          customer_phone: updatedBooking.customer_phone,
          appointment_date: updatedBooking.appointment_date,
          appointment_time: updatedBooking.appointment_time,
          pickup_date: updatedBooking.pickup_date,
          dropoff_date: updatedBooking.dropoff_date,
          status: updatedBooking.status,
          payment_status: updatedBooking.payment_status,
          price_total: updatedBooking.price_total,
        })
        .eq('id', updatedBooking.id);

      if (error) throw error;

      setEditingBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Errore durante l\'aggiornamento della prenotazione');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm(lang === 'it' ? 'Sei sicuro di voler eliminare questa prenotazione?' : 'Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Errore durante l\'eliminazione della prenotazione');
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
      <div className="container mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              {lang === 'it' ? 'Calendario Prenotazioni' : 'Bookings Calendar'}
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
                    className="bg-gray-800/50 rounded-lg p-4"
                  >
                    <div className="flex flex-col lg:flex-row items-start gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-3">
                          <div>
                            <h4
                              className="text-lg font-bold text-white cursor-pointer hover:text-gray-300 transition-colors"
                              onClick={() => booking.service_type === 'car_rental' && setShowVehicleCalendar(booking.vehicle_name)}
                              title={booking.service_type === 'car_rental' ? (lang === 'it' ? 'Clicca per vedere il calendario del veicolo' : 'Click to see vehicle calendar') : ''}
                            >
                              {booking.vehicle_name}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {booking.service_name || booking.service_type}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
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

                      <div className="flex flex-row lg:flex-col gap-2 items-center lg:items-end w-full lg:w-auto">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          ID: {booking.id.substring(0, 8)}
                        </span>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors whitespace-nowrap"
                          >
                            ✏️ {lang === 'it' ? 'Modifica' : 'Edit'}
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors whitespace-nowrap"
                          >
                            🗑️ {lang === 'it' ? 'Elimina' : 'Delete'}
                          </button>
                        </div>
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
                <span className="text-sm text-gray-300">Car Wash</span>
              </div>
              <div className="flex items-center gap-2">
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

          {/* Edit Booking Modal */}
          {editingBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-2xl font-bold text-white mb-4">
                  {lang === 'it' ? 'Modifica Prenotazione' : 'Edit Booking'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {lang === 'it' ? 'Nome Cliente' : 'Customer Name'}
                    </label>
                    <input
                      type="text"
                      value={editingBooking.customer_name}
                      onChange={(e) => setEditingBooking({ ...editingBooking, customer_name: e.target.value })}
                      className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={editingBooking.customer_email}
                      onChange={(e) => setEditingBooking({ ...editingBooking, customer_email: e.target.value })}
                      className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {lang === 'it' ? 'Telefono' : 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={editingBooking.customer_phone}
                      onChange={(e) => setEditingBooking({ ...editingBooking, customer_phone: e.target.value })}
                      className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                    />
                  </div>
                  {editingBooking.service_type === 'car_wash' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {lang === 'it' ? 'Data Appuntamento' : 'Appointment Date'}
                        </label>
                        <input
                          type="date"
                          value={editingBooking.appointment_date || ''}
                          onChange={(e) => setEditingBooking({ ...editingBooking, appointment_date: e.target.value })}
                          className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {lang === 'it' ? 'Ora Appuntamento' : 'Appointment Time'}
                        </label>
                        <input
                          type="time"
                          value={editingBooking.appointment_time || ''}
                          onChange={(e) => setEditingBooking({ ...editingBooking, appointment_time: e.target.value })}
                          className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {lang === 'it' ? 'Data Ritiro' : 'Pickup Date'}
                        </label>
                        <input
                          type="date"
                          value={editingBooking.pickup_date || ''}
                          onChange={(e) => setEditingBooking({ ...editingBooking, pickup_date: e.target.value })}
                          className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {lang === 'it' ? 'Data Riconsegna' : 'Dropoff Date'}
                        </label>
                        <input
                          type="date"
                          value={editingBooking.dropoff_date || ''}
                          onChange={(e) => setEditingBooking({ ...editingBooking, dropoff_date: e.target.value })}
                          className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={editingBooking.status}
                      onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value })}
                      className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {lang === 'it' ? 'Stato Pagamento' : 'Payment Status'}
                    </label>
                    <select
                      value={editingBooking.payment_status}
                      onChange={(e) => setEditingBooking({ ...editingBooking, payment_status: e.target.value })}
                      className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {lang === 'it' ? 'Totale (centesimi)' : 'Total (cents)'}
                    </label>
                    <input
                      type="number"
                      value={editingBooking.price_total}
                      onChange={(e) => setEditingBooking({ ...editingBooking, price_total: parseInt(e.target.value) })}
                      className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => handleSaveBooking(editingBooking)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    {lang === 'it' ? 'Salva' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingBooking(null)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    {lang === 'it' ? 'Annulla' : 'Cancel'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Vehicle Calendar Modal */}
          {showVehicleCalendar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-white">
                    {lang === 'it' ? 'Calendario Disponibilità' : 'Availability Calendar'}: {showVehicleCalendar}
                  </h3>
                  <button
                    onClick={() => setShowVehicleCalendar(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day, idx) => (
                      <div key={idx} className="text-center text-sm font-semibold text-gray-400 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="aspect-square" />;
                      }

                      const vehicleBookings = bookings.filter(
                        b => b.vehicle_name === showVehicleCalendar &&
                        b.pickup_date && b.dropoff_date &&
                        new Date(day) >= new Date(b.pickup_date) &&
                        new Date(day) <= new Date(b.dropoff_date)
                      );

                      const isToday = day.toDateString() === new Date().toDateString();

                      return (
                        <div
                          key={day.toISOString()}
                          className={`
                            aspect-square border rounded-lg p-2 transition-colors
                            ${isToday ? 'border-white bg-white/10' : 'border-gray-700'}
                            ${vehicleBookings.length > 0 ? 'bg-red-900/30' : 'bg-green-900/20'}
                          `}
                        >
                          <div className="text-sm font-semibold text-white mb-1">
                            {day.getDate()}
                          </div>
                          {vehicleBookings.length > 0 ? (
                            <div className="text-xs text-red-400">
                              {lang === 'it' ? 'Occupato' : 'Booked'}
                            </div>
                          ) : (
                            <div className="text-xs text-green-400">
                              {lang === 'it' ? 'Libero' : 'Available'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-3">
                      {lang === 'it' ? 'Prenotazioni per questo veicolo' : 'Bookings for this vehicle'}
                    </h4>
                    <div className="space-y-2">
                      {bookings
                        .filter(b => b.vehicle_name === showVehicleCalendar && b.service_type === 'car_rental')
                        .sort((a, b) => new Date(a.pickup_date || '').getTime() - new Date(b.pickup_date || '').getTime())
                        .map(booking => (
                          <div key={booking.id} className="bg-gray-800/50 p-3 rounded border border-gray-700">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-white font-medium">{booking.customer_name}</p>
                                <p className="text-sm text-gray-400">
                                  {booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US') : ''}
                                  {' → '}
                                  {booking.dropoff_date ? new Date(booking.dropoff_date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US') : ''}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminCalendarPage;
