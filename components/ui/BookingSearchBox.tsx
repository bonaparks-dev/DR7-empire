import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationAutocomplete from './LocationAutocomplete';
import { DR7_OFFICE_LOCATION, type SardegnaLocation } from '../../data/sardegnaLocations';

// Pickup: Mon-Fri 10:30-12:30 / 16:30-18:30, Sat 10:30-12:30 / 15:30-17:30
function getPickupTimes(dateStr: string): string[] {
  if (!dateStr) return [];
  const day = new Date(dateStr + 'T12:00:00').getDay();
  if (day === 0) return [];
  const times: string[] = [];
  const add = (startMin: number, endMin: number) => {
    for (let m = startMin; m <= endMin; m += 30) {
      times.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
  };
  if (day >= 1 && day <= 5) {
    add(10 * 60 + 30, 12 * 60 + 30);
    add(16 * 60 + 30, 18 * 60 + 30);
  } else if (day === 6) {
    add(10 * 60 + 30, 12 * 60 + 30);
    add(15 * 60 + 30, 17 * 60 + 30);
  }
  return times;
}

// Return: Mon-Fri 9:00-11:00 / 15:00-17:00, Sat 9:00-11:00 / 14:00-16:00
function getReturnTimes(dateStr: string): string[] {
  if (!dateStr) return [];
  const day = new Date(dateStr + 'T12:00:00').getDay();
  if (day === 0) return [];
  const times: string[] = [];
  const add = (startMin: number, endMin: number) => {
    for (let m = startMin; m <= endMin; m += 30) {
      times.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
  };
  if (day >= 1 && day <= 5) {
    add(9 * 60, 11 * 60);
    add(15 * 60, 17 * 60);
  } else if (day === 6) {
    add(9 * 60, 11 * 60);
    add(14 * 60, 16 * 60);
  }
  return times;
}

function calcAutoReturnTime(pickupTime: string, returnDateStr: string): string {
  const validTimes = getReturnTimes(returnDateStr);
  if (validTimes.length === 0) return '09:00';
  const [h, m] = pickupTime.split(':').map(Number);
  const idealMin = h * 60 + m - 90;
  let best = validTimes[0];
  for (const t of validTimes) {
    const [th, tm] = t.split(':').map(Number);
    if (th * 60 + tm <= idealMin) best = t;
  }
  return best;
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const dayName = d.toLocaleDateString('it-IT', { weekday: 'short' });
  const dayNum = d.getDate();
  const month = d.toLocaleDateString('it-IT', { month: 'short' });
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
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
  const [pickupTime, setPickupTimeRaw] = useState('10:30');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('09:00');
  const [returnTimeManual, setReturnTimeManual] = useState(false);
  const [error, setError] = useState('');

  // Delivery fee calculation
  const [deliveryFee, setDeliveryFee] = useState<{ pickupFee: number; returnFee: number; pickupKm: number; returnKm: number; pricePerKm: number } | null>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const deliveryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOffice = (loc: SardegnaLocation) => loc.id === 'dr7_cagliari';

  // Calculate delivery fee when location changes
  useEffect(() => {
    if (deliveryDebounceRef.current) clearTimeout(deliveryDebounceRef.current);

    const pickupNeedsDelivery = !isOffice(pickupLocation);
    const returnNeedsDelivery = !sameReturn && !isOffice(returnLocation);

    if (!pickupNeedsDelivery && !returnNeedsDelivery) {
      setDeliveryFee(null);
      setIsCalculatingDelivery(false);
      return;
    }

    setIsCalculatingDelivery(true);

    deliveryDebounceRef.current = setTimeout(async () => {
      try {
        let pickupFee = 0, returnFee = 0, pickupKm = 0, returnKm = 0;

        const calcDistance = async (loc: SardegnaLocation) => {
          const body: any = {};
          if (loc.lat && loc.lon) {
            body.lat = loc.lat;
            body.lon = loc.lon;
          } else {
            body.address = loc.label;
          }
          const res = await fetch('/.netlify/functions/calculate-delivery-distance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!res.ok) return null;
          return res.json();
        };

        let pricePerKm = 3;

        if (pickupNeedsDelivery) {
          const data = await calcDistance(pickupLocation);
          if (data) { pickupFee = data.deliveryFee; pickupKm = data.distanceKm; pricePerKm = data.pricePerKm; }
        }

        if (returnNeedsDelivery) {
          const data = await calcDistance(returnLocation);
          if (data) { returnFee = data.deliveryFee; returnKm = data.distanceKm; pricePerKm = data.pricePerKm; }
        }

        // If same return, the driver does one round trip (not two)
        if (sameReturn && pickupNeedsDelivery) {
          setDeliveryFee({ pickupFee, returnFee: 0, pickupKm, returnKm: 0, pricePerKm });
        } else {
          setDeliveryFee({ pickupFee, returnFee, pickupKm, returnKm, pricePerKm });
        }
      } catch {
        setDeliveryFee(null);
      } finally {
        setIsCalculatingDelivery(false);
      }
    }, 800);

    return () => { if (deliveryDebounceRef.current) clearTimeout(deliveryDebounceRef.current); };
  }, [pickupLocation, returnLocation, sameReturn]);

  const totalDeliveryFee = deliveryFee ? deliveryFee.pickupFee + deliveryFee.returnFee : 0;

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
    if ((pH * 60 + pM) - (rH * 60 + rM) < 90) return baseDays + 1;
    return baseDays;
  })();

  const isSunday = (d: string) => d && new Date(d + 'T12:00:00').getDay() === 0;

  const handleSearch = () => {
    setError('');
    if (!pickupDate) { setError('Seleziona la data di ritiro'); return; }
    if (!returnDate) { setError('Seleziona la data di restituzione'); return; }
    if (isSunday(pickupDate)) { setError('Chiusi la domenica'); return; }
    if (isSunday(returnDate)) { setError('Chiusi la domenica'); return; }
    if (returnDate < pickupDate) { setError('Data restituzione deve essere dopo il ritiro'); return; }
    if (returnDate === pickupDate && returnTime <= pickupTime) {
      setError('Orario restituzione deve essere dopo il ritiro');
      return;
    }

    const params = new URLSearchParams({
      pickup: pickupDate, pickupTime,
      return: returnDate, returnTime,
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
        <h3 className="text-[17px] font-semibold text-white text-center mb-5">Prenota il tuo veicolo</h3>
      )}

      <div className="space-y-4">
        {/* Location */}
        <LocationAutocomplete
          value={pickupLocation.label}
          onChange={(loc) => { setPickupLocation(loc); if (sameReturn) setReturnLocation(loc); }}
          label="Luogo di ritiro"
          placeholder="Aeroporto, citta, indirizzo..."
        />

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div className={`w-[22px] h-[22px] rounded-[7px] flex items-center justify-center transition-colors ${sameReturn ? 'bg-white' : 'bg-white/10 border border-white/20'}`}>
            {sameReturn && <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </div>
          <input type="checkbox" checked={sameReturn} onChange={(e) => { setSameReturn(e.target.checked); if (e.target.checked) setReturnLocation(pickupLocation); }} className="sr-only" />
          <span className="text-[13px] text-white/50">Riconsegna nella sede principale Viale Marconi 229, Cagliari 09131</span>
        </label>

        {!sameReturn && (
          <LocationAutocomplete value={returnLocation.label} onChange={setReturnLocation} label="Luogo di riconsegna" placeholder="Aeroporto, citta, indirizzo..." />
        )}

        {/* ── PICKUP ── */}
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Ritiro</p>
          <div className="flex gap-2">
            <input
              type="date"
              value={pickupDate}
              min={today}
              onChange={(e) => {
                const val = e.target.value;
                setPickupDate(val);
                const times = getPickupTimes(val);
                if (times.length > 0 && !times.includes(pickupTime)) setPickupTimeRaw(times[0]);
                if (!returnDate || val >= returnDate) {
                  const next = new Date(val); next.setDate(next.getDate() + 1);
                  const nextStr = next.toISOString().split('T')[0];
                  setReturnDate(nextStr);
                  if (!returnTimeManual) setReturnTime(calcAutoReturnTime(pickupTime, nextStr));
                }
              }}
              style={{ colorScheme: 'dark' }}
              className="flex-1 bg-white/[0.06] text-white text-[15px] font-medium rounded-xl px-4 py-3.5 min-h-[50px] border-0 outline-none cursor-pointer"
            />
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              style={{ colorScheme: 'dark', WebkitAppearance: 'none', appearance: 'none' }}
              className="bg-[#2c2c2e] text-white text-[15px] font-semibold rounded-xl px-3 py-3.5 min-h-[50px] border border-white/10 outline-none cursor-pointer w-[85px] text-center appearance-none"
            >
              {pickupTimes.length > 0
                ? pickupTimes.map(t => <option key={t} value={t} className="bg-[#2c2c2e] text-white">{t}</option>)
                : <option value={pickupTime} className="bg-[#2c2c2e] text-white">{pickupTime}</option>}
            </select>
          </div>
          {isSunday(pickupDate) && <p className="text-xs text-red-400 mt-1.5">Chiusi la domenica</p>}
        </div>

        {/* ── RETURN ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Restituzione</p>
            {days > 0 && (
              <span className="text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-full">
                {days} {days === 1 ? 'giorno' : 'giorni'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={returnDate}
              min={pickupDate || today}
              onChange={(e) => {
                setReturnDate(e.target.value);
                const times = getReturnTimes(e.target.value);
                if (times.length > 0 && !times.includes(returnTime)) {
                  if (!returnTimeManual) setReturnTime(calcAutoReturnTime(pickupTime, e.target.value));
                  else setReturnTime(times[0]);
                }
              }}
              style={{ colorScheme: 'dark' }}
              className="flex-1 bg-white/[0.06] text-white text-[15px] font-medium rounded-xl px-4 py-3.5 min-h-[50px] border-0 outline-none cursor-pointer"
            />
            <select
              value={returnTime}
              onChange={(e) => handleReturnTimeChange(e.target.value)}
              style={{ colorScheme: 'dark', WebkitAppearance: 'none', appearance: 'none' }}
              className="bg-[#2c2c2e] text-white text-[15px] font-semibold rounded-xl px-3 py-3.5 min-h-[50px] border border-white/10 outline-none cursor-pointer w-[85px] text-center appearance-none"
            >
              {returnTimes.length > 0
                ? returnTimes.map(t => <option key={t} value={t} className="bg-[#2c2c2e] text-white">{t}</option>)
                : <option value={returnTime} className="bg-[#2c2c2e] text-white">{returnTime}</option>}
            </select>
          </div>
          {isSunday(returnDate) && <p className="text-xs text-red-400 mt-1.5">Chiusi la domenica</p>}
        </div>

        {error && <p className="text-xs text-red-400 text-center font-medium">{error}</p>}
        {/* Show tariff warning only when return time is 30+ min after default (pickupTime - 1h30) */}
        {(() => {
          if (!pickupTime || !returnTime || !returnDate) return null;
          const [pH, pM] = pickupTime.split(':').map(Number);
          const [rH, rM] = returnTime.split(':').map(Number);
          const defaultReturnMin = pH * 60 + pM - 90;
          const returnMin = rH * 60 + rM;
          if (returnMin < defaultReturnMin + 30) return null;
          return (
            <div className="text-center space-y-0.5">
              <p className="text-[12px] text-red-400 font-semibold">La tariffa può subire variazioni</p>
              <p className="text-[10px] text-red-400/60">La restituzione del veicolo è prevista entro 1 ora e 30 minuti prima dell'orario di uscita, al fine di evitare eventuali variazioni.</p>
            </div>
          );
        })()}

        {/* Delivery fee display */}
        {isCalculatingDelivery && (
          <p className="text-[12px] text-white/40 text-center">Calcolo costo consegna...</p>
        )}
        {!isCalculatingDelivery && totalDeliveryFee > 0 && (
          <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">Consegna a domicilio</span>
              <span className="text-white font-semibold">+€{totalDeliveryFee.toFixed(0)}</span>
            </div>
            {deliveryFee && (
              <p className="text-[11px] text-white/30 mt-1">
                {deliveryFee.pickupKm > 0 && `Consegna: ${deliveryFee.pickupKm} km × €${deliveryFee.pricePerKm}/km`}
                {deliveryFee.returnKm > 0 && deliveryFee.pickupKm > 0 && ' + '}
                {deliveryFee.returnKm > 0 && `Riconsegna: ${deliveryFee.returnKm} km × €${deliveryFee.pricePerKm}/km`}
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={!pickupDate || !returnDate}
          className={`w-full py-4 rounded-2xl font-bold text-[16px] transition-all ${
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
