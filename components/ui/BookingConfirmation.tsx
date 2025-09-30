import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Booking } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { PICKUP_LOCATIONS } from '../../constants';

interface BookingConfirmationProps {
  booking: Booking;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ booking }) => {
  const navigate = useNavigate();
  const { getTranslated } = useTranslation();

  const pickupLocationDetails = PICKUP_LOCATIONS.find(loc => loc.id === booking.pickupLocation);

  const getPickupAddress = () => {
    if (booking.pickupLocation === 'cagliari_airport') {
      return 'Cagliari Elmas Airport, Via dei Trasvolatori, 09030 Elmas CA, Italia';
    }
    if (booking.pickupLocation === 'dr7_office') {
      return 'DR7 Office, Via Roma, 123, 09123 Cagliari CA, Italia'; // Placeholder address
    }
    return 'Indirizzo non specificato';
  };

  return (
    <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800 text-white max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white">PRENOTAZIONE CONFERMATA!</h1>
        <p className="text-gray-300 mt-2">Grazie per la tua prenotazione!</p>
        <p className="text-gray-300 mt-1">
          Abbiamo inviato una conferma via email a: <span className="font-semibold text-white">{booking.customer.email}</span>
        </p>
        <p className="text-lg mt-4">
          NUMERO PRENOTAZIONE: <span className="font-bold tracking-wider">{`DR7-${booking.bookingId.substring(0, 4).toUpperCase()}-${booking.bookingId.substring(4, 8).toUpperCase()}`}</span>
        </p>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold mb-4">Riepilogo della Prenotazione</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="font-semibold">{booking.itemName}</p>
            <img src={booking.image} alt={booking.itemName} className="rounded-lg mt-2 w-full h-40 object-cover" />
          </div>
          <div>
            <p><span className="font-semibold">Ritiro:</span> {new Date(booking.pickupDate).toLocaleDateString('it-IT')} alle {booking.pickupTime}</p>
            <p><span className="font-semibold">Riconsegna:</span> {new Date(booking.returnDate).toLocaleDateString('it-IT')} alle {booking.returnTime}</p>
            <p><span className="font-semibold">Durata:</span> {booking.duration}</p>
            <p className="text-2xl font-bold mt-4">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: booking.currency }).format(booking.totalPrice)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold mb-4">COSA PORTARE AL RITIRO:</h3>
          <ul className="space-y-2 text-gray-300">
            <li>Carta d'identità o passaporto valido</li>
            <li>Patente di guida valida</li>
            <li>Carta di credito al nome del conducente</li>
            <li>Codice prenotazione: <span className="font-mono">{`DR7-${booking.bookingId.substring(0, 8).toUpperCase()}`}</span></li>
          </ul>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold mb-4">INDIRIZZO RITIRO:</h3>
          <p className="font-semibold">{pickupLocationDetails ? getTranslated(pickupLocationDetails.label) : 'N/A'}</p>
          <p className="text-gray-300">{getPickupAddress()}</p>
          <h3 className="text-xl font-bold mt-6 mb-4">CONTATTI:</h3>
          <div className="flex items-center space-x-4">
            <span>Tel: +39 123 456 7890</span>
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <span>Email: info@dr7empire.com</span>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col md:flex-row justify-center items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="w-full md:w-auto px-6 py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors"
        >
          Torna alla home
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;