import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationAutocomplete from './LocationAutocomplete';
import { DR7_OFFICE_LOCATION, type SardegnaLocation } from '../../data/sardegnaLocations';

// Office hours for NOLEGGIO: Mon-Fri 9-13 & 16-19, Sat 9-14
function getPickupTimes(dateStr: string): string[] {
  if (!dateStr) return [];
  const day = new Date(dateStr + 'T12:00:00').getDay();
  if (day === 0) return []; // Sunday closed
  const times: string[] = [];
  const add = (startH: number, startM: number, endH: number, endM: number) => {
    for (let m = startH * 60 + startM; m <= endH * 60 + endM; m += 30) {
      times.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
  };
  if (day >= 1 && day <= 5) {
    add(9, 0, 13, 0);
    add(16, 0, 19, 0);
  } else if (day === 6) {
    add(9, 0, 14, 0);
  }
  return times;
}

function getReturnTimes(dateStr: string): string[] {
  if (!dateStr) return [];
  const day = new Date(dateStr + 'T12:00:00').getDay();
  if (day === 0) return []; // Sunday closed
  const times: string[] = [];
  const add = (startH: number, startM: number, endH: number, endM: number) => {
    for (let m = startH * 60 + startM; m <= endH * 60 + endM; m += 30) {
      times.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
  };
  if (day >= 1 && day <= 5) {
    add(9, 0, 13, 0);
    add(16, 0, 19, 0);
  } else if (day === 6) {
    add(9, 0, 14, 0);
  }
  return times;
}

// Find the closest valid return time: pickupTime - 1h30, snapped to valid slot
function calcAutoReturnTime(pickupTime: string, returnDateStr: string): string {
  const validTimes = getReturnTimes(returnDateStr);
  if (validTimes.length === 0) return '10:00';
  const [h, m] = pickupTime.split(':').map(Number);
  const idealMin = h * 60 + m - 90;
  // Find closest valid time <= ideal
  let best = validTimes[0];
  for (const t of validTimes) {
    const [th, tm] = t.split(':').map(Number);
    const tMin = th * 60 + tm;
    if (tMin <= idealMin) best = t;
  }
  return best;
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const dayName = d.toLocaleDateString('it-IT', { weekday: 'short' });
  const dayNum = d.getDate();
  const month = d.toLocaleDateString('it-IT', { month: 'long' });
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNum} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
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
  const [returnTime, setReturnTime] = useState('09:00');
  const [returnTimeManual, setReturnTimeManual] = useState(false);
  const [error, setError] = useState('');

  const setPickupTime = useCallback((time: string) => {
    setPickupTimeRaw(time);
    if (!returnTimeManual && returnDate) {
      setReturnTime(calcAutoReturnTime(time, returnDate));
    }
  }, [returnTimeManual, returnDate]);

  const handleReturnTimeChange = useCallback((time: string) => {
    setReturnTime(time);
    setReturnTimeManual(true);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const pickupTimes = useMemo(() => getPickupTimes(pickupDate), [pickupDate]);
  const returnTimes = useMemo(() => getReturnTimes(returnDate), [returnDate]);

  const days = (() => {
    if (!pickupDate || !returnDate) return 0;
    const baseDays = Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24)));
    const [pH, pM] = pickupTime.split(':').map(Number);
    const [rH, rM] = returnTime.split(':').map(Number);
    const pickupMin = pH * 60 + pM;
    const returnMin = rH * 60 + rM;
    const diff = pickupMin - returnMin;
    if (diff < 90) return baseDays + 1;
    return baseDays;
  })();

  const isSunday = (d: string) => d && new Date(d + 'T12:00:00').getDay() === 0;

  const handleSearch = () => {
    setError('');
    if (!pickupDate) { setError('Seleziona la data di ritiro'); return; }
    if (!returnDate) { setError('Seleziona la data di restituzione'); return; }
    if (isSunday(pickupDate)) { setError('Siamo chiusi la domenica.'); return; }
    if (isSunday(returnDate)) { setError('Siamo chiusi la domenica.'); return; }
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

  return (
    <div className={isPopup ? '' : 'bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-[20px] p-6 max-w-[420px] w-full'}>
      {!isPopup && (
        <h3 className="text-[17px] font-semibold text-white text-center mb-5 tracking-tight">
          Prenota il tuo veicolo
        </h3>
      )}

      <div className="space-y-4">
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

        {!sameReturn && (
          <LocationAutocomplete
            value={returnLocation.label}
            onChange={setReturnLocation}
            label="Luogo di riconsegna"
            placeholder="Aeroporto, citta, indirizzo..."
          />
        )}

        {/* ── PICKUP: Date + Time row ── */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Data di ritiro</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="date"
                value={pickupDate}
                min={today}
                onChange={(e) => {
                  const val = e.target.value;
                  setPickupDate(val);
                  if (!returnDate || val > returnDate) {
                    const next = new Date(val);
                    next.setDate(next.getDate() + 1);
                    const nextStr = next.toISOString().split('T')[0];
                    setReturnDate(nextStr);
                    if (!returnTimeManual) {
                      setReturnTime(calcAutoReturnTime(pickupTime, nextStr));
                    }
                  }
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
              <div className="flex items-center gap-2 bg-white/[0.06] rounded-xl px-4 py-3 min-h-[48px]">
                <svg className="w-5 h-5 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className={`text-[15px] font-medium ${pickupDate ? 'text-white' : 'text-white/30'}`}>
                  {pickupDate ? formatDateLabel(pickupDate) : 'Seleziona data'}
                </span>
              </div>
            </div>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="bg-white/[0.06] text-white text-[15px] font-semibold rounded-xl px-3 py-3 min-h-[48px] border-0 outline-none appearance-none cursor-pointer min-w-[80px] text-center"
            >
              {pickupTimes.length > 0
                ? pickupTimes.map(t => <option key={t} value={t}>{t}</option>)
                : <option value={pickupTime}>{pickupTime}</option>
              }
            </select>
          </div>
          {isSunday(pickupDate) && <p className="text-[11px] text-red-400 mt-2">Chiusi la domenica</p>}
        </div>

        {/* ── RETURN: Date + Time row ── */}
        <div className="relative">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Data di restituzione</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="date"
                  value={returnDate}
                  min={pickupDate || today}
                  onChange={(e) => {
                    setReturnDate(e.target.value);
                    if (!returnTimeManual) {
                      setReturnTime(calcAutoReturnTime(pickupTime, e.target.value));
                    }
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div className="flex items-center gap-2 bg-white/[0.06] rounded-xl px-4 py-3 min-h-[48px]">
                  <svg className="w-5 h-5 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span className={`text-[15px] font-medium ${returnDate ? 'text-white' : 'text-white/30'}`}>
                    {returnDate ? formatDateLabel(returnDate) : 'Seleziona data'}
                  </span>
                </div>
              </div>
              <select
                value={returnTime}
                onChange={(e) => handleReturnTimeChange(e.target.value)}
                className="bg-white/[0.06] text-white text-[15px] font-semibold rounded-xl px-3 py-3 min-h-[48px] border-0 outline-none appearance-none cursor-pointer min-w-[80px] text-center"
              >
                {returnTimes.length > 0
                  ? returnTimes.map(t => <option key={t} value={t}>{t}</option>)
                  : <option value={returnTime}>{returnTime}</option>
                }
              </select>
            </div>
            {isSunday(returnDate) && <p className="text-[11px] text-red-400 mt-2">Chiusi la domenica</p>}
          </div>

          {/* Days badge */}
          {days > 0 && (
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full">
              <div className="bg-white/[0.08] border border-white/[0.12] rounded-full w-[52px] h-[52px] flex flex-col items-center justify-center">
                <span className="text-white font-bold text-[16px] leading-none">{days}</span>
                <span className="text-white/50 text-[9px] leading-none mt-0.5">{days === 1 ? 'giorno' : 'giorni'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-[12px] text-red-400 text-center font-medium">{error}</p>
        )}

        {/* Tariff warning */}
        <p className="text-[11px] text-red-400/70 text-center">La tariffa può subire variazioni</p>

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={!pickupDate || !returnDate}
          className={`w-full py-[15px] rounded-2xl font-bold text-[16px] tracking-tight transition-all duration-200 ${
            pickupDate && returnDate
              ? 'bg-white text-black hover:bg-white/90 active:scale-[0.97]'
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
