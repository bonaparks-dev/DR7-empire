import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../contexts/CurrencyContext';
import { PICKUP_LOCATIONS } from '../../constants';
import { CheckCircleIcon } from '../icons/Icons';

const CarBookingConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getTranslated } = useTranslation();
  const { currency } = useCurrency();
  const { booking } = (location.state || {}) as { booking?: any };

  if (!booking) {
    return <Navigate to="/" replace />;
  }

  const formatPrice = (priceInCents: number) => 
    new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', { 
      style: 'currency', 
      currency: currency.toUpperCase(), 
      minimumFractionDigits: 2 
    }).format(priceInCents / 100);

  const pickupDate = new Date(booking.pickup_date);
  const dropoffDate = new Date(booking.dropoff_date);
  const pickupLocationDetails = PICKUP_LOCATIONS.find(loc => loc.id === booking.pickup_location);
  const customerEmail = booking.booking_details?.customer?.email || 'N/A';

  const getPickupAddress = () => {
    return 'Viale Marconi 229, Cagliari 09131';
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-24 px-4">
      <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800 text-white max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold text-white">PRENOTAZIONE CONFERMATA!</h1>
          <p className="text-gray-300 mt-2">Grazie per la tua prenotazione!</p>
          <p className="text-gray-300 mt-1">
            Abbiamo inviato una conferma via email a: <span className="font-semibold text-white">{customerEmail}</span>
          </p>
          <p className="text-lg mt-4">
            NUMERO PRENOTAZIONE: <span className="font-bold tracking-wider">{`DR7-${booking.id.substring(0, 4).toUpperCase()}-${booking.id.substring(4, 8).toUpperCase()}`}</span>
          </p>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold mb-4">Riepilogo della Prenotazione</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold">{booking.vehicle_name}</p>
              {booking.vehicle_image_url && (
                <img src={booking.vehicle_image_url} alt={booking.vehicle_name} className="rounded-lg mt-2 w-full h-40 object-cover" />
              )}
            </div>
            <div>
              <p><span className="font-semibold">Ritiro:</span> {pickupDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })} alle {pickupDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}</p>
              <p><span className="font-semibold">Riconsegna:</span> {dropoffDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })} alle {dropoffDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}</p>
              <p><span className="font-semibold">Luogo:</span> {pickupLocationDetails ? getTranslated(pickupLocationDetails.label) : booking.pickup_location}</p>
              <p className="text-2xl font-bold mt-4">{formatPrice(booking.price_total)}</p>
              {booking.payment_method === 'agency' && (
                <p className="text-sm text-yellow-400 mt-2">Da pagare in sede</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4">COSA PORTARE AL RITIRO:</h3>
            <ul className="space-y-2 text-gray-300">
              <li>✓ Carta d'identità o passaporto valido</li>
              <li>✓ Patente di guida valida</li>
              <li>✓ Cauzione</li>
              <li>✓ Codice prenotazione: <span className="font-mono">{`DR7-${booking.id.substring(0, 8).toUpperCase()}`}</span></li>
            </ul>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4">INDIRIZZO RITIRO:</h3>
            <p className="text-gray-300">{getPickupAddress()}</p>
            <h3 className="text-xl font-bold mt-6 mb-4">CONTATTI:</h3>
            <div className="flex items-center space-x-4">
              <span>Tel: 3457905205</span>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <span>Email: Dubai.rent7.0spa@gmail.com</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col md:flex-row justify-center items-center gap-4">
          <button
            onClick={() => navigate('/account')}
            className="w-full md:w-auto px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
          >
            Vai al Mio Account
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full md:w-auto px-6 py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarBookingConfirmationPage;
