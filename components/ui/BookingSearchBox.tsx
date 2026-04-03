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

  const isSunday = (d: string) => d && new Date(d + 'T12:00:00').getDay() === 0;

  const handleSearch = () => {
    setError('');

    if (!pickupDate) { setError('Seleziona la data di ritiro'); return; }
    if (!returnDate) { setError('Seleziona la data di restituzione'); return; }
    if (isSunday(pickupDate)) { setError('Siamo chiusi la domenica. Seleziona un altro giorno per il ritiro.'); return; }
    if (isSunday(returnDate)) { setError('Siamo chiusi la domenica. Seleziona un altro giorno per la restituzione.'); return; }
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

  const inputStyle = 'w-full bg-[#1c1c1e] text-white text-[15px] font-normal rounded-[14px] px-4 py-[13px] border-0 outline-none appearance-none focus:ring-1 focus:ring-white/20 transition-all placeholder-white/30';
  const labelStyle = 'block text-[11px] font-semibold text-white/40 uppercase tracking-[0.08em] mb-[6px]';

  return (
    <div className={isPopup ? '' : 'bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-[20px] p-6 max-w-[420px] w-full'}>
      {!isPopup && (
        <h3 className="text-[17px] font-semibold text-white text-center mb-5 tracking-tight">
          Prenota il tuo veicolo
        </h3>
      )}

      <div className="space-y-[14px]">
        {/* Pickup location */}
        <LocationAutocomplete
          value={pickupLocation.label}
          onChange={(loc) => {
            setPickupLocation(loc);
            if (sameReturn) setReturnLocation(loc);
          }}
          label="Luogo di ritiro"
          placeholder="Aeroporto, citta, indirizzo..."
        />

        {/* Same return toggle */}
        <label className="flex items-center gap-[10px] cursor-pointer select-none py-[2px]">
          <div className={`w-[22px] h-[22px] rounded-[7px] flex items-center justify-center transition-colors ${sameReturn ? 'bg-white' : 'bg-white/10 border border-white/20'}`}>
            {sameReturn && (
              <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <input type="checkbox" checked={sameReturn} onChange={(e) => { setSameReturn(e.target.checked); if (e.target.checked) setReturnLocation(pickupLocation); }} className="sr-only" />
          <span className="text-[13px] text-white/50">Riconsegna nello stesso luogo</span>
        </label>

        {/* Return location */}
        {!sameReturn && (
          <LocationAutocomplete
            value={returnLocation.label}
            onChange={setReturnLocation}
            label="Luogo di riconsegna"
            placeholder="Aeroporto, citta, indirizzo..."
          />
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-[10px]">
          <div>
            <label className={labelStyle}>Ritiro</label>
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
              className={inputStyle}
            />
            {isSunday(pickupDate) && <p className="text-[11px] text-red-400 mt-1">Chiusi la domenica</p>}
          </div>
          <div>
            <label className={labelStyle}>Restituzione</label>
            <input
              type="date"
              value={returnDate}
              min={pickupDate || today}
              onChange={(e) => setReturnDate(e.target.value)}
              className={inputStyle}
            />
            {isSunday(returnDate) && <p className="text-[11px] text-red-400 mt-1">Chiusi la domenica</p>}
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-[10px]">
          <div>
            <label className={labelStyle}>Ora ritiro</label>
            <select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className={inputStyle}>
              {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]).flat().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelStyle}>Ora restituzione</label>
            <select value={returnTime} onChange={(e) => handleReturnTimeChange(e.target.value)} className={inputStyle}>
              {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]).flat().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Days badge */}
        {days > 0 && (
          <div className="text-center pt-[2px]">
            <span className="inline-block px-4 py-[6px] bg-white/[0.06] rounded-full text-[12px] font-medium text-white/60 tracking-wide">
              {days} {days === 1 ? 'giorno' : 'giorni'}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-[12px] text-red-400 text-center font-medium">{error}</p>
        )}

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={!pickupDate || !returnDate}
          className={`w-full py-[14px] rounded-[14px] font-semibold text-[15px] tracking-tight transition-all duration-200 ${
            pickupDate && returnDate
              ? 'bg-white text-black hover:bg-white/90 active:scale-[0.97] active:bg-white/80'
              : 'bg-white/[0.06] text-white/20 cursor-not-allowed'
          }`}
        >
          Cerca Auto Disponibili
        </button>
      </div>
    </div>
  );
};

export default BookingSearchBox;
