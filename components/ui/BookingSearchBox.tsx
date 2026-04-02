import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationAutocomplete from './LocationAutocomplete';
import { DR7_OFFICE_LOCATION, type SardegnaLocation } from '../../data/sardegnaLocations';

// Auto return time: pickup time minus 1h30, snapped to nearest :00 or :30
function calcAutoReturnTime(pickupTime: string): string {
  const [h, m] = pickupTime.split(':').map(Number);
  let totalMin = h * 60 + m - 90;
  if (totalMin < 0) totalMin = 0;
  // Snap to nearest 30-min slot
  const snapped = Math.round(totalMin / 30) * 30;
  const rh = Math.floor(snapped / 60);
  const rm = snapped % 60;
  return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`;
}

interface BookingSearchBoxProps {
  variant?: 'hero' | 'popup';
  onClose?: () => void;
}

const BookingSearchBox: React.FC<BookingSearchBoxProps> = ({ variant = 'hero', onClose }) => {
  const navigate = useNavigate();
  const [pickupLocation, setPickupLocation] = useState<SardegnaLocation>(DR7_OFFICE_LOCATION);
  const [returnLocation, setReturnLocation] = useState<SardegnaLocation>(DR7_OFFICE_LOCATION);
  const [sameReturn, setSameReturn] = useState(true);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTimeRaw] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState(calcAutoReturnTime('10:00'));
  const [returnTimeManual, setReturnTimeManual] = useState(false);
  const [error, setError] = useState('');

  // When pickup time changes, auto-set return time (unless user manually changed it)
  const setPickupTime = useCallback((time: string) => {
    setPickupTimeRaw(time);
    if (!returnTimeManual) {
      setReturnTime(calcAutoReturnTime(time));
    }
  }, [returnTimeManual]);

  const handleReturnTimeChange = useCallback((time: string) => {
    setReturnTime(time);
    setReturnTimeManual(true);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const days = pickupDate && returnDate
    ? Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleSearch = () => {
    setError('');

    if (!pickupDate) { setError('Seleziona la data di ritiro'); return; }
    if (!returnDate) { setError('Seleziona la data di restituzione'); return; }
    if (returnDate < pickupDate) { setError('La data di restituzione deve essere successiva al ritiro'); return; }
    if (returnDate === pickupDate && returnTime <= pickupTime) {
      setError("L'orario di restituzione deve essere successivo al ritiro");
      return;
    }

    const params = new URLSearchParams({
      pickup: pickupDate,
      pickupTime,
      return: returnDate,
      returnTime,
      pickupLoc: pickupLocation.id,
      pickupLocLabel: pickupLocation.label,
      returnLoc: sameReturn ? pickupLocation.id : returnLocation.id,
      returnLocLabel: sameReturn ? pickupLocation.label : returnLocation.label,
    });

    if (onClose) onClose();
    navigate(`/supercar-luxury?${params.toString()}`);
  };

  const isPopup = variant === 'popup';
  const containerClass = isPopup
    ? ''
    : 'bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl';

  return (
    <div className={containerClass}>
      {!isPopup && (
        <h3 className="text-lg font-semibold text-white text-center mb-4 tracking-wide">
          Prenota il tuo veicolo
        </h3>
      )}

      <div className="space-y-3">
        {/* Pickup location */}
        <LocationAutocomplete
          value={pickupLocation.label}
          onChange={(loc) => {
            setPickupLocation(loc);
            if (sameReturn) setReturnLocation(loc);
          }}
          label="Luogo di ritiro"
          placeholder="Aeroporto, città, indirizzo..."
        />

        {/* Same return toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sameReturn}
            onChange={(e) => {
              setSameReturn(e.target.checked);
              if (e.target.checked) setReturnLocation(pickupLocation);
            }}
            className="w-3.5 h-3.5 rounded bg-[#2c2c2e] border-white/20 accent-white"
          />
          <span className="text-xs text-gray-400">Riconsegna nello stesso luogo</span>
        </label>

        {/* Return location */}
        {!sameReturn && (
          <LocationAutocomplete
            value={returnLocation.label}
            onChange={setReturnLocation}
            label="Luogo di riconsegna"
            placeholder="Aeroporto, città, indirizzo..."
          />
        )}

        {/* Dates row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ritiro</label>
            <input
              type="date"
              value={pickupDate}
              min={today}
              onChange={(e) => {
                setPickupDate(e.target.value);
                if (!returnDate || e.target.value > returnDate) {
                  const next = new Date(e.target.value);
                  next.setDate(next.getDate() + 1);
                  setReturnDate(next.toISOString().split('T')[0]);
                }
              }}
              className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Restituzione</label>
            <input
              type="date"
              value={returnDate}
              min={pickupDate || today}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
        </div>

        {/* Times row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ora ritiro</label>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
            >
              {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]).flat().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ora restituzione</label>
            <select
              value={returnTime}
              onChange={(e) => handleReturnTimeChange(e.target.value)}
              className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
            >
              {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]).flat().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Days badge */}
        {days > 0 && (
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-[#2c2c2e] border border-white/10 rounded-full text-xs text-gray-300">
              {days} {days === 1 ? 'giorno' : 'giorni'}
            </span>
          </div>
        )}

        {/* Tariff warning */}
        <p className="text-xs text-red-400 text-center">La tariffa puo subire variazioni</p>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 text-center font-semibold">{error}</p>
        )}

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={!pickupDate || !returnDate}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            pickupDate && returnDate
              ? 'bg-white text-black hover:bg-gray-100 active:scale-[0.98]'
              : 'bg-[#2c2c2e] text-gray-500 cursor-not-allowed'
          }`}
        >
          Cerca Auto Disponibili
        </button>
      </div>
    </div>
  );
};

export default BookingSearchBox;
