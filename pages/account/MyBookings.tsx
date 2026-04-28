import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';
import { getMembershipTierName } from '../../utils/membershipDiscounts';
import { useCentralinaProOverlay } from '../../hooks/useCentralinaProConfig';
import { addCredits, deductCredits, getUserCreditBalance } from '../../utils/creditWallet';
import { PICKUP_LOCATIONS, RETURN_LOCATIONS } from '../../constants';

interface Booking {
  id: string;
  service_type: 'car_rental' | 'car_wash';
  service_name: string;
  vehicle_name?: string;
  vehicle_id?: string;
  vehicle_plate?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  appointment_date?: string;
  appointment_time?: string;
  pickup_date?: string;
  dropoff_date?: string;
  pickup_location?: string;
  dropoff_location?: string;
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
  // DR7 Flex rules (refund %, price, tier) come from Centralina Pro.
  const { overlay: proOverlay } = useCentralinaProOverlay();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  // Modify state (car wash + car rental)
  const [modifyingBooking, setModifyingBooking] = useState<Booking | null>(null);
  const [modifyDate, setModifyDate] = useState('');
  const [modifyTime, setModifyTime] = useState('');
  const [modifySaving, setModifySaving] = useState(false);
  const [modifyError, setModifyError] = useState<string | null>(null);

  // Rental-specific modify state
  const [rentalPickupDate, setRentalPickupDate] = useState('');
  const [rentalPickupTime, setRentalPickupTime] = useState('');
  const [rentalPickupLocation, setRentalPickupLocation] = useState('');
  const [rentalDropoffDate, setRentalDropoffDate] = useState('');
  const [rentalDropoffTime, setRentalDropoffTime] = useState('');
  const [rentalDropoffLocation, setRentalDropoffLocation] = useState('');
  const [rentalRecalcTotal, setRentalRecalcTotal] = useState<number | null>(null); // euros
  const [rentalRecalcing, setRentalRecalcing] = useState(false);
  const [rentalWalletBalance, setRentalWalletBalance] = useState<number>(0);
  const [rentalAvailabilityOk, setRentalAvailabilityOk] = useState<boolean | null>(null);

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
    const isPaid = paymentStatus === 'paid' || paymentStatus === 'succeeded' || paymentStatus === 'completed';
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      paid: 'bg-green-500/20 text-green-400',
      succeeded: 'bg-green-500/20 text-green-400',
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colors[paymentStatus] || 'bg-gray-500/20 text-gray-400'}`}>
        {isPaid ? 'Pagato' : paymentStatus === 'pending' ? 'In attesa' : paymentStatus}
      </span>
    );
  };

  const canCancel = (booking: Booking): boolean => {
    if (booking.status === 'cancelled' || booking.status === 'annullata' || booking.status === 'completed' || booking.status === 'completata') return false;
    if (!booking.pickup_date && !booking.appointment_date) return false;
    return getCancelPolicy(booking).canCancel;
  };

  const getCancelPolicy = (booking: Booking): { canCancel: boolean; hasFlex: boolean; refundPercent: number; penaltyPercent: number; message: string } => {
    const bd = booking.booking_details || {};
    const hasDr7Flex = bd.dr7Flex === true || bd.dr7Flex === 'true' || bd.dr7_flex === true || bd.dr7_flex === 'true' || bd.extras?.dr7_flex === true || bd.extras?.dr7_flex === 'true';
    const hasPrimeFlex = booking.booking_details?.prime_flex === true || booking.booking_details?.prime_flex === 'true';
    const isElite = !!getMembershipTierName(user);
    // Elite members get the same cancellation rights as DR7 Flex — same condition
    // applied to both modify and cancel flows.
    const hasFlex = hasDr7Flex || hasPrimeFlex || isElite;
    const dateStr = booking.service_type === 'car_wash'
      ? (booking.appointment_date || booking.pickup_date || '')
      : (booking.pickup_date || booking.appointment_date || '');
    const pickup = new Date(dateStr);
    const now = new Date();
    const daysUntilPickup = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    // DR7 Flex conditions from Centralina Pro (servizi.dr7_flex.refund_percent).
    // If Pro hasn't set it, fall back to the baseline 90 that matches the documented policy.
    const flexRefundPercent = proOverlay?.dr7Flex?.refundPercent ?? 90;

    if (hasFlex) {
      // DR7 Flex / Prime Flex / Elite: refund as DR7 Wallet credit, ANY time before pickup/appointment
      // (waives the 5-day cutoff that applies to regular bookings).
      const penalty = Math.max(0, 100 - flexRefundPercent);
      const label = hasPrimeFlex
        ? 'Prime Flex'
        : hasDr7Flex
          ? 'DR7 Flex'
          : 'DR7 Club';
      return {
        canCancel: true,
        hasFlex: true,
        refundPercent: flexRefundPercent,
        penaltyPercent: penalty,
        message: `Con ${label}: rimborso del ${flexRefundPercent}% come credito DR7 Wallet.`,
      };
    }
    if (daysUntilPickup >= 5) {
      // Standard policy (no Flex): >= 5 days out → 90% wallet credit, 10% penalty
      return { canCancel: true, hasFlex: false, refundPercent: 90, penaltyPercent: 10, message: 'Cancellazione con penale del 10% — rimborso del 90% come credito DR7 Wallet.' };
    }
    if (daysUntilPickup > 0) {
      // < 5 days: cannot cancel unless Flex (handled above)
      return { canCancel: false, hasFlex: false, refundPercent: 0, penaltyPercent: 0, message: 'Meno di 5 giorni dal servizio: cancellazione non disponibile senza DR7 Flex.' };
    }
    return { canCancel: false, hasFlex: false, refundPercent: 0, penaltyPercent: 0, message: 'Non è più possibile cancellare questa prenotazione.' };
  };

  // Recalc rental total whenever the user changes pickup/dropoff while the modal is open
  useEffect(() => {
    if (!modifyingBooking || modifyingBooking.service_type !== 'car_rental') return;
    if (!rentalPickupDate || !rentalPickupTime || !rentalDropoffDate || !rentalDropoffTime) return;
    const timeZoneName = new Intl.DateTimeFormat('it-IT', { timeZoneName: 'short', timeZone: 'Europe/Rome' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';
    const isDST = timeZoneName.includes('CEST') || timeZoneName.includes('+2');
    const offset = isDST ? '+02:00' : '+01:00';
    const pickupIso = new Date(`${rentalPickupDate}T${rentalPickupTime}:00${offset}`).toISOString();
    const dropoffIso = new Date(`${rentalDropoffDate}T${rentalDropoffTime}:00${offset}`).toISOString();
    if (new Date(dropoffIso) <= new Date(pickupIso)) { setRentalRecalcTotal(null); return; }
    let cancelled = false;
    setRentalRecalcing(true);
    recalculateRentalTotal(modifyingBooking, pickupIso, dropoffIso).then(total => {
      if (!cancelled) setRentalRecalcTotal(total);
    }).finally(() => { if (!cancelled) setRentalRecalcing(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modifyingBooking?.id, rentalPickupDate, rentalPickupTime, rentalDropoffDate, rentalDropoffTime]);

  // Load wallet balance when opening a rental modify modal
  useEffect(() => {
    if (!modifyingBooking || modifyingBooking.service_type !== 'car_rental' || !user?.id) return;
    getUserCreditBalance(user.id).then(setRentalWalletBalance).catch(() => setRentalWalletBalance(0));
  }, [modifyingBooking?.id, user?.id]);

  const canModify = (booking: Booking): boolean => {
    if (booking.status === 'cancelled' || booking.status === 'annullata' || booking.status === 'completed' || booking.status === 'completata') return false;

    // Customer is eligible to modify if any of:
    //   - booking has Prime Flex (car wash)
    //   - booking has DR7 Flex (any service)
    //   - customer has an active DR7 Club membership (Argento/Oro/Platino/DR7 Club — treated as "Elite" here)
    const bd = booking.booking_details || {};
    const hasPrimeFlex = bd.prime_flex === true || bd.prime_flex === 'true';
    const hasDr7Flex = bd.dr7Flex === true || bd.dr7Flex === 'true' || bd.dr7_flex === true || bd.dr7_flex === 'true' || bd.extras?.dr7_flex === true || bd.extras?.dr7_flex === 'true';
    const isElite = !!getMembershipTierName(user);
    if (!hasPrimeFlex && !hasDr7Flex && !isElite) return false;

    // Must still be in the future
    const dateStr = booking.service_type === 'car_wash'
      ? (booking.appointment_date || booking.pickup_date || '')
      : (booking.pickup_date || booking.appointment_date || '');
    const when = new Date(dateStr);
    return !isNaN(when.getTime()) && when > new Date();
  };

  // Recalculate rental total when the customer changes dates/locations.
  // Formula mirrors admin preventivo (listSubtotal × combinedCoeff) — see CarBookingWizard.
  // Per-day line items (rental, insurance, km unlimited, second driver, DR7 flex, no_cauzione)
  // are scaled by new_days; flat items (lavaggio) are left unchanged.
  const recalculateRentalTotal = async (
    booking: Booking,
    newPickupIso: string,
    newDropoffIso: string,
  ): Promise<number | null> => {
    const bd = booking.booking_details || {};
    const oldPickup = new Date(booking.pickup_date || '').getTime();
    const oldDropoff = new Date(booking.dropoff_date || '').getTime();
    if (!oldPickup || !oldDropoff) return null;
    const oldDays = Math.max(1, Math.ceil((oldDropoff - oldPickup) / 86_400_000));

    const newPickupMs = new Date(newPickupIso).getTime();
    const newDropoffMs = new Date(newDropoffIso).getTime();
    if (!newPickupMs || !newDropoffMs || newDropoffMs <= newPickupMs) return null;
    const newDays = Math.max(1, Math.ceil((newDropoffMs - newPickupMs) / 86_400_000));

    // Extract stored line items (cents where applicable). price_total is in cents.
    const paidCents = booking.price_total || 0;
    const paidEur = paidCents / 100;
    // Per-day components derived from booking_details if present; else proportional from paid total.
    const perDay = (field: string): number => {
      const v = Number(bd[field]);
      return Number.isFinite(v) && v > 0 ? v : 0;
    };
    const rentalDaily = perDay('base_daily_rate') || perDay('effectivePricePerDay') || (Number(bd.rental_cost || 0) / oldDays);
    const insDaily = perDay('insurance_daily_price') || (Number(bd.insurance_total || bd.insurance_cost || 0) / oldDays);
    const kmDaily = perDay('unlimited_km_daily') || (bd.unlimited_km ? Number(bd.km_cost || 0) / oldDays : 0);
    const kmIncludedCostDaily = bd.unlimited_km ? 0 : Number(bd.km_cost || 0) / oldDays;
    const secondDriverDaily = perDay('second_driver_daily') || (Number(bd.second_driver_total || bd.secondDriverFee || 0) / oldDays);
    const flexDaily = perDay('flex_daily') || (Number(bd.flex_cost || 0) / oldDays);
    const noCauzioneDaily = perDay('no_cauzione_daily') || (Number(bd.noDepositSurcharge || 0) / oldDays);
    const lavaggioFlat = Number(bd.lavaggio_fee || 0);
    const experienceFlat = Number(bd.experience_cost || 0); // treat as flat for simplicity
    const deliveryFlat = Number(bd.delivery_fee || 0);

    const listRental = rentalDaily * newDays;
    const listInsurance = insDaily * newDays;
    const listKm = (kmDaily + kmIncludedCostDaily) * newDays;
    const listSecondDriver = secondDriverDaily * newDays;
    const listFlex = flexDaily * newDays;
    const listNoCauzione = noCauzioneDaily * newDays;
    const listSubtotal = listRental + listInsurance + listKm + listSecondDriver + listFlex + listNoCauzione + lavaggioFlat + experienceFlat + deliveryFlat;

    // Fetch new combined coefficient for the updated dates (same endpoint as wizard).
    let combinedCoeff = 1;
    try {
      const vehicleId = booking.vehicle_id || bd.vehicle_id || bd.vehicleId;
      if (vehicleId) {
        const res = await fetch('/.netlify/functions/calculate-dynamic-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicle_id: vehicleId, pickup_date: newPickupIso, dropoff_date: newDropoffIso }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.enabled && Array.isArray(data.breakdown)) {
            combinedCoeff = data.breakdown.reduce((a: number, b: { coeff: number }) => a * b.coeff, 1);
          }
        }
      }
    } catch { /* fallback: no coefficient adjustment */ }

    // If we have no usable line items, return paidEur as the best available fallback.
    if (listSubtotal <= 0) return paidEur;
    return Math.round(listSubtotal * combinedCoeff * 100) / 100;
  };

  const handleModify = async () => {
    if (!modifyingBooking) return;
    if (modifyingBooking.service_type === 'car_rental') {
      await handleRentalModify();
    } else {
      await handleCarWashModify();
    }
  };

  const handleCarWashModify = async () => {
    if (!modifyingBooking || !modifyDate || !modifyTime) return;
    setModifySaving(true);
    setModifyError(null);
    try {
      const timeZoneName = new Intl.DateTimeFormat('it-IT', { timeZoneName: 'short', timeZone: 'Europe/Rome' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';
      const isDST = timeZoneName.includes('CEST') || timeZoneName.includes('+2');
      const offset = isDST ? '+02:00' : '+01:00';
      const newAppointment = new Date(`${modifyDate}T${modifyTime}:00${offset}`);

      const { error } = await supabase
        .from('bookings')
        .update({
          appointment_date: newAppointment.toISOString(),
          appointment_time: modifyTime,
          booking_details: {
            ...modifyingBooking.booking_details,
            modified_at: new Date().toISOString(),
            original_appointment: modifyingBooking.appointment_date,
          }
        })
        .eq('id', modifyingBooking.id);

      if (error) throw error;

      // "Modifica prime Wash" via pro_modifica_lavaggio slot
      try {
        const updatedBooking = {
          ...modifyingBooking,
          appointment_date: newAppointment.toISOString(),
          appointment_time: modifyTime,
          isEdit: true,
        };
        await fetch('/.netlify/functions/send-whatsapp-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking: updatedBooking,
            customPhone: modifyingBooking.customer_phone,
          }),
        });
      } catch (waErr) {
        console.warn('[MyBookings] modify WhatsApp send failed:', waErr);
      }

      setBookings(prev => prev.map(b =>
        b.id === modifyingBooking.id
          ? { ...b, appointment_date: newAppointment.toISOString(), appointment_time: modifyTime }
          : b
      ));
      setModifyingBooking(null);
      setCancelSuccess('Appuntamento modificato con successo!');
    } catch (err: any) {
      setModifyError(err.message || 'Errore durante la modifica');
    } finally {
      setModifySaving(false);
    }
  };

  const handleRentalModify = async () => {
    if (!modifyingBooking) return;
    if (!rentalPickupDate || !rentalPickupTime || !rentalDropoffDate || !rentalDropoffTime || !rentalPickupLocation || !rentalDropoffLocation) {
      setModifyError('Compila tutti i campi.');
      return;
    }
    setModifySaving(true);
    setModifyError(null);
    try {
      // Build Rome-timezone ISO strings for new pickup/dropoff
      const timeZoneName = new Intl.DateTimeFormat('it-IT', { timeZoneName: 'short', timeZone: 'Europe/Rome' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';
      const isDST = timeZoneName.includes('CEST') || timeZoneName.includes('+2');
      const offset = isDST ? '+02:00' : '+01:00';
      const newPickupIso = new Date(`${rentalPickupDate}T${rentalPickupTime}:00${offset}`).toISOString();
      const newDropoffIso = new Date(`${rentalDropoffDate}T${rentalDropoffTime}:00${offset}`).toISOString();

      if (new Date(newDropoffIso) <= new Date(newPickupIso)) {
        throw new Error('La riconsegna deve essere successiva al ritiro.');
      }

      // Availability check (skip self)
      const vehicleName = modifyingBooking.vehicle_name || '';
      const vehicleId = modifyingBooking.vehicle_id || modifyingBooking.booking_details?.vehicle_id;
      if (vehicleName) {
        const availRes = await fetch('/.netlify/functions/checkVehicleAvailability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleName,
            pickupDate: newPickupIso,
            dropoffDate: newDropoffIso,
            targetVehicleId: vehicleId,
            excludeBookingId: modifyingBooking.id,
          }),
        });
        if (availRes.ok) {
          const data = await availRes.json();
          if (Array.isArray(data.conflicts) && data.conflicts.length > 0 && !data.availableFrom) {
            throw new Error('Il veicolo non è disponibile per le date selezionate.');
          }
        }
      }

      // Recalculate total with new dates
      const newTotalEur = rentalRecalcTotal ?? await recalculateRentalTotal(modifyingBooking, newPickupIso, newDropoffIso);
      if (newTotalEur == null) throw new Error('Impossibile ricalcolare il prezzo.');

      const paidEur = (modifyingBooking.price_total || 0) / 100;
      const diffEur = Math.round((newTotalEur - paidEur) * 100) / 100;

      // Price policy:
      //   newTotal <= paid → keep paid price, no refund, just update dates/locations
      //   newTotal >  paid → charge difference (wallet first, fallback to card → fattura)
      let paymentMethodUsed: 'none' | 'wallet' | 'card' = 'none';

      if (diffEur > 0) {
        const balance = await getUserCreditBalance(user!.id);
        if (balance >= diffEur) {
          const ded = await deductCredits(user!.id, diffEur, `Modifica prenotazione — ${modifyingBooking.service_name}`, modifyingBooking.id, 'booking_modify');
          if (!ded.success) throw new Error(ded.error || 'Errore addebito wallet.');
          paymentMethodUsed = 'wallet';
        } else {
          // Card: create Nexi payment link for the difference
          const nexiRes = await fetch('/.netlify/functions/create-nexi-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: `MODIFY-${modifyingBooking.id.substring(0, 8)}-${Date.now()}`,
              amount: Math.round(diffEur * 100),
              currency: 'EUR',
              description: `Differenza modifica prenotazione ${modifyingBooking.id.substring(0, 8)}`,
              customerEmail: modifyingBooking.customer_email,
            }),
          });
          if (!nexiRes.ok) throw new Error('Impossibile creare il link di pagamento.');
          const nexiData = await nexiRes.json();
          const payUrl = nexiData.hostedPageUrl || nexiData.url || nexiData.paymentUrl;
          if (!payUrl) throw new Error('Nessun link di pagamento ricevuto.');
          // Hand off to Nexi; booking will be updated by the callback + fattura generated there.
          window.location.href = payUrl;
          return;
        }
      }

      // Update booking (dates, locations, and price_total if diff > 0)
      const updatePayload: Record<string, unknown> = {
        pickup_date: newPickupIso,
        dropoff_date: newDropoffIso,
        pickup_location: rentalPickupLocation,
        dropoff_location: rentalDropoffLocation,
        booking_details: {
          ...modifyingBooking.booking_details,
          modified_at: new Date().toISOString(),
          original_pickup_date: modifyingBooking.pickup_date,
          original_dropoff_date: modifyingBooking.dropoff_date,
          original_pickup_location: modifyingBooking.pickup_location,
          original_dropoff_location: modifyingBooking.dropoff_location,
          modification_payment_method: paymentMethodUsed,
          modification_diff_eur: diffEur,
          modification_new_total_eur: newTotalEur,
          // Flag for admin: contract must be regenerated after this modification.
          // Admin-side generate-contract endpoint can watch this flag + reset it once fired.
          needs_contract_regen: true,
          contract_regen_reason: 'rental_modified',
          contract_regen_requested_at: new Date().toISOString(),
        },
      };
      if (paymentMethodUsed === 'wallet' && diffEur > 0) {
        updatePayload.price_total = Math.round(newTotalEur * 100);
      }

      const { error } = await supabase.from('bookings').update(updatePayload).eq('id', modifyingBooking.id);
      if (error) throw error;

      // Send "Modifica Noleggio" via pro_modifica_noleggio slot (or custom label fallback)
      try {
        const firstName = (modifyingBooking.customer_name || user?.fullName || 'Cliente').split(' ')[0];
        const pickup = new Date(newPickupIso);
        const dropoff = new Date(newDropoffIso);
        const dateOnly = (d: Date) => d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' });
        const timeOnly = (d: Date) => d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
        const locLabel = (id: string) => PICKUP_LOCATIONS.find(l => l.id === id)?.label?.it || id;

        // Derived fields for the template
        const bd = modifyingBooking.booking_details || {};
        const insuranceRaw = String(bd.insuranceOption || bd.insurance_option || '').trim();
        // Read the display name from Centralina Pro (configOverlay insurance arrays).
        // Pro config is the single source of truth — no hardcoded fallbacks.
        const insuranceLabel = (() => {
          if (!insuranceRaw || !proOverlay) return insuranceRaw;
          const pools = [
            proOverlay.insuranceTier1, proOverlay.insuranceTier2,
            proOverlay.urbanInsurance, proOverlay.utilitaireInsurance, proOverlay.furgoneInsurance,
          ].filter(Array.isArray) as Array<Array<{ id?: string; name?: string }>>;
          for (const pool of pools) {
            const hit = pool.find(o => o?.id === insuranceRaw);
            if (hit?.name) return hit.name;
          }
          return insuranceRaw;
        })();
        const depositLabel = bd.depositOption === 'no_deposit'
          ? 'No Cauzione'
          : bd.depositOption === 'vehicle_deposit'
            ? 'Cauzione con Veicolo'
            : (bd.cauzione || bd.deposit_amount ? `€${bd.cauzione || bd.deposit_amount}` : 'Standard');
        // Derive km_info from ORIGINAL booking. Scan every known storage
        // location (website/admin flows shape it differently) and treat
        // any value >= 9999 as the sentinel for Illimitati.
        const bdKmPkg = (bd as any).kmPackage || {}
        const toValidKm = (v: unknown): number | null => {
          const n = typeof v === 'string' ? parseInt(v, 10) : Number(v)
          return Number.isFinite(n) && n > 0 && n < 9999 ? n : null
        }
        const anyExceeds9999 = (v: unknown): boolean => {
          const n = typeof v === 'string' ? parseInt(v, 10) : Number(v)
          return Number.isFinite(n) && n >= 9999
        }
        const isUnlimited =
          bd.unlimited_km === true || bd.unlimited_km === 'true' ||
          bdKmPkg.type === 'unlimited' ||
          bdKmPkg.distance === 'unlimited' ||
          String(bd.km_limit).toLowerCase() === 'illimitati' ||
          anyExceeds9999(bdKmPkg.includedKm) ||
          anyExceeds9999(bd.km_limit) ||
          anyExceeds9999(bd.includedKm) ||
          anyExceeds9999((modifyingBooking as any).km_limit)
        const kmNumber =
          toValidKm(bdKmPkg.includedKm) ??
          toValidKm(bd.includedKm) ??
          toValidKm(bd.km_limit) ??
          toValidKm((modifyingBooking as any).km_limit) ??
          null
        const kmInfo = isUnlimited
          ? 'Illimitati'
          : (kmNumber ? `${kmNumber} km inclusi` : 'Km inclusi')
        const paymentStatusLabel = (() => {
          const ps = (modifyingBooking.payment_status || '').toLowerCase();
          if (ps === 'paid' || ps === 'succeeded' || ps === 'completed') return 'Pagato';
          if (ps === 'pending') return 'In attesa';
          if (ps === 'failed') return 'Fallito';
          return modifyingBooking.payment_status || '-';
        })();

        const templateVars: Record<string, string> = {
          '{nome}': firstName,
          '{custName}': modifyingBooking.customer_name || firstName,
          '{customer_name}': modifyingBooking.customer_name || firstName,
          '{booking_id}': modifyingBooking.id.substring(0, 8).toUpperCase(),
          '{bookingRef}': modifyingBooking.id.substring(0, 8).toUpperCase(),
          '{service_name}': modifyingBooking.service_name || modifyingBooking.vehicle_name || 'Noleggio',
          '{vehicle_name}': modifyingBooking.vehicle_name || '',
          '{plate}': modifyingBooking.vehicle_plate || '',
          '{pickup_date}': dateOnly(pickup),
          '{pickup_time}': timeOnly(pickup),
          '{dropoff_date}': dateOnly(dropoff),
          '{dropoff_time}': timeOnly(dropoff),
          '{pickup_location}': locLabel(rentalPickupLocation),
          '{dropoff_location}': locLabel(rentalDropoffLocation),
          '{insurance}': insuranceLabel,
          '{deposit}': depositLabel,
          '{km_info}': kmInfo,
          '{payment_status}': paymentStatusLabel,
          // When the new price is LOWER than paid, we keep the paid amount (no refund,
          // and no confusing "less" total shown to the customer). Only show a higher
          // total if the customer actually paid a difference.
          '{total}': (diffEur > 0 ? newTotalEur : paidEur).toFixed(2),
          '{payment_info}': paymentMethodUsed === 'wallet' ? 'Differenza addebitata dal DR7 Wallet' : (paymentMethodUsed === 'card' ? 'Differenza pagata con carta' : 'Nessuna differenza da pagare'),
          '{notes}': '',
        };
        await fetch('/.netlify/functions/send-whatsapp-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateKey: 'rental_modified',
            templateVars,
            customPhone: modifyingBooking.customer_phone,
          }),
        });
      } catch (waErr) {
        console.warn('[MyBookings] rental modify WhatsApp send failed:', waErr);
      }

      // Regenerate the contract + send a fresh signing link (same pipeline the
      // Nexi callback uses for new bookings). Best-effort: if it fails the
      // `needs_contract_regen` flag is still set so admin can retry.
      try {
        const sess = await supabase.auth.getSession();
        const jwt = sess.data?.session?.access_token;
        if (jwt) {
          await fetch('/.netlify/functions/regenerate-contract-after-modify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify({ bookingId: modifyingBooking.id }),
          });
        }
      } catch (ctrErr) {
        console.warn('[MyBookings] contract regeneration request failed:', ctrErr);
      }

      // Local state
      setBookings(prev => prev.map(b =>
        b.id === modifyingBooking.id
          ? {
              ...b,
              pickup_date: newPickupIso,
              dropoff_date: newDropoffIso,
              pickup_location: rentalPickupLocation,
              dropoff_location: rentalDropoffLocation,
              price_total: paymentMethodUsed === 'wallet' && diffEur > 0 ? Math.round(newTotalEur * 100) : b.price_total,
            }
          : b
      ));
      setModifyingBooking(null);
      setCancelSuccess(diffEur > 0
        ? `Prenotazione modificata. Differenza di €${diffEur.toFixed(2)} addebitata dal wallet.`
        : 'Prenotazione modificata con successo.');
    } catch (err: any) {
      setModifyError(err.message || 'Errore durante la modifica.');
    } finally {
      setModifySaving(false);
    }
  };

  const handleCancel = async (booking: Booking) => {
    setCancellingId(booking.id);
    setCancelError(null);
    setCancelSuccess(null);
    try {
      const policy = getCancelPolicy(booking);

      // Update booking status to cancelled
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);
      if (error) throw error;

      // Delete the linked cauzione row(s) via server-side Netlify function
      // (service_role bypasses RLS). The function only acts when the
      // booking is already in 'cancelled' status, which we just set above.
      // Best-effort: a failure here does NOT block the booking cancellation.
      try {
        const res = await fetch('/.netlify/functions/release-cauzione-on-cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id }),
        });
        const out = await res.json().catch(() => ({} as { deleted?: number; error?: string; note?: string }));
        if (!res.ok) {
          console.warn('[MyBookings] release-cauzione-on-cancel non-ok:', res.status, out);
        } else {
          console.log('[MyBookings] cauzione release result:', out);
        }
      } catch (cauzErr) {
        console.warn('[MyBookings] cauzione release failed:', cauzErr);
      }

      // Auto-refund to DR7 Wallet via the add_credits RPC (atomic: updates
      // user_credit_balance AND logs a credit_transactions row with
      // transaction_type='credit' + balance_after). Amount in EUROS
      // (price_total is stored in cents).
      if (policy.refundPercent > 0 && booking.price_total > 0) {
        // price_total(cents) × % / 100 = refund cents → /100 → euros rounded to 2 decimals
        const refundEuros = Math.round((booking.price_total * policy.refundPercent) / 100) / 100;
        const description = policy.hasFlex
          ? `Rimborso DR7 Flex (${policy.refundPercent}%) — ${booking.service_name}`
          : `Rimborso cancellazione (${policy.refundPercent}%) — ${booking.service_name}`;
        const result = await addCredits(user!.id, refundEuros, description, booking.id, 'refund');
        if (!result.success) {
          console.error('[MyBookings] refund credit failed:', result.error);
        }
      }

      // Send "Prenotazione Annullata da sito" from Messaggi di Sistema Pro.
      // Legacy key `website_booking_cancelled_customer` maps to the pro_custom_* slot.
      try {
        const templateVars: Record<string, string> = {
          '{custName}': booking.customer_name || user?.fullName || 'Cliente',
          '{customer_name}': booking.customer_name || user?.fullName || 'Cliente',
          '{nome}': (booking.customer_name || user?.fullName || 'Cliente').split(' ')[0],
          '{bookingRef}': booking.id.substring(0, 8).toUpperCase(),
          '{booking_id}': booking.id.substring(0, 8).toUpperCase(),
        };
        await fetch('/.netlify/functions/send-whatsapp-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateKey: 'website_booking_cancelled_customer',
            templateVars,
            customPhone: booking.customer_phone,
          }),
        });
      } catch (waErr) {
        console.warn('[MyBookings] cancel WhatsApp send failed:', waErr);
      }

      // Update local state
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'cancelled' } : b));
      setCancelSuccess(policy.refundPercent > 0
        ? `Prenotazione cancellata. Rimborso del ${policy.refundPercent}% accreditato sul tuo DR7 Wallet.`
        : 'Prenotazione cancellata.');
    } catch (err: any) {
      setCancelError(err.message || 'Errore durante la cancellazione');
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
      <div className="p-4 md:p-6 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-1">

          <h2 className="text-xl font-bold text-white">{t('My_Bookings')}</h2>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {lang === 'it' ? 'Visualizza tutte le tue prenotazioni' : 'View all your bookings'}
        </p>
      </div>

      <div className="p-4 md:p-6">
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
                          {booking.service_type === 'car_wash' ? '' : ''}
                          {booking.service_name}
                        </h3>
                        {booking.vehicle_name && (
                          <p className="text-sm text-gray-400">{booking.vehicle_name}</p>
                        )}
                      </div>
                      <div className="flex flex-col flex-wrap gap-2 items-end">
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

                      {booking.pickup_date && (
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

                      {/* Insurance and Deposit Info */}
                      {booking.pickup_date && (
                        <>
                          <div>
                            <p className="text-gray-400">
                              {lang === 'it' ? 'Assicurazione' : 'Insurance'}:
                            </p>
                            <p className="text-white">
                              {(() => {
                                const bd = booking.booking_details || {};
                                // 1) Prefer the label stored at booking time
                                if (bd.insuranceLabel) return bd.insuranceLabel;
                                const raw = String(bd.insuranceOption || booking.insurance_option || '').trim();
                                if (!raw) return 'N/A';
                                // 2) Look up the name in Centralina Pro insurance pools
                                if (proOverlay) {
                                  const pools = [
                                    proOverlay.insuranceTier1, proOverlay.insuranceTier2,
                                    proOverlay.urbanInsurance, proOverlay.utilitaireInsurance, proOverlay.furgoneInsurance,
                                  ].filter(Array.isArray) as Array<Array<{ id?: string; name?: string }>>;
                                  for (const pool of pools) {
                                    const hit = pool.find(o => o?.id === raw);
                                    if (hit?.name) return hit.name;
                                  }
                                }
                                // 3) Humanize the raw id
                                return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">
                              {lang === 'it' ? 'Cauzione' : 'Deposit'}:
                            </p>
                            <p className="text-white">
                              {(() => {
                                const bd = booking.booking_details || {};
                                const dep = bd.depositOption;
                                // The real cauzione amount was stored on the booking at booking time.
                                // Prefer booking.deposit_amount (top-level column, canonical), then legacy booking_details fields.
                                const amount = (booking as any).deposit_amount ?? bd.deposit_amount ?? bd.cauzione;
                                if (!dep && amount == null) return 'N/A';
                                // Label from Centralina Pro (single source of truth for labels)
                                let label: string | undefined;
                                if (dep && proOverlay?.depositOptions) {
                                  const pools = [
                                    proOverlay.depositOptions.TIER_1_RESIDENT,
                                    proOverlay.depositOptions.TIER_2_RESIDENT,
                                    proOverlay.depositOptions.TIER_1_NON_RESIDENT,
                                    proOverlay.depositOptions.TIER_2_NON_RESIDENT,
                                  ].filter(Array.isArray) as Array<Array<{ id?: string; label?: string }>>;
                                  for (const pool of pools) {
                                    const hit = pool.find(o => o?.id === dep);
                                    if (hit?.label) { label = hit.label; break; }
                                  }
                                }
                                if (!label && dep) label = dep.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                const amountStr = typeof amount === 'number' && amount > 0
                                  ? `€${amount.toLocaleString('it-IT')}`
                                  : '';
                                if (!label) return amountStr || 'N/A';
                                return amountStr ? `${label} — ${amountStr}` : label;
                              })()}
                            </p>
                          </div>
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

                    {/* Modify button — branches by service type */}
                    {canModify(booking) && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <button
                          onClick={() => {
                            setModifyingBooking(booking);
                            setModifyError(null);
                            if (booking.service_type === 'car_rental') {
                              // Pre-fill with current rental dates/locations
                              const p = new Date(booking.pickup_date || '');
                              const d = new Date(booking.dropoff_date || '');
                              setRentalPickupDate(p.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' }));
                              setRentalPickupTime(p.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }));
                              setRentalDropoffDate(d.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' }));
                              setRentalDropoffTime(d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }));
                              setRentalPickupLocation(booking.pickup_location || 'dr7_cagliari');
                              setRentalDropoffLocation(booking.dropoff_location || booking.pickup_location || 'dr7_cagliari');
                              setRentalRecalcTotal((booking.price_total || 0) / 100);
                              setRentalAvailabilityOk(null);
                            } else {
                              const appt = new Date(booking.appointment_date || '');
                              setModifyDate(appt.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' }));
                              setModifyTime(booking.appointment_time || appt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }));
                            }
                          }}
                          className="px-4 py-2 bg-transparent border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-sm font-medium rounded-lg transition-colors"
                        >
                          {booking.service_type === 'car_rental' ? 'Modifica prenotazione' : 'Modifica appuntamento'}
                        </button>
                      </div>
                    )}

                    {/* Cancel button */}
                    {canCancel(booking) && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        {confirmCancelId === booking.id ? (
                          <div className="space-y-3">
                            <div className="p-3 bg-amber-900/30 border border-amber-500/50 rounded-lg">
                              <p className="text-amber-300 text-sm font-semibold">
                                {getCancelPolicy(booking).message}
                              </p>
                              <p className="text-amber-200/70 text-xs mt-1">
                                Sei sicuro di voler cancellare questa prenotazione?
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleCancel(booking)}
                                disabled={cancellingId === booking.id}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                              >
                                {cancellingId === booking.id ? 'Cancellazione...' : 'Conferma cancellazione'}
                              </button>
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                              >
                                Annulla
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setConfirmCancelId(booking.id); setCancelError(null); setCancelSuccess(null); }}
                            className="px-4 py-2 bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/10 text-sm font-medium rounded-lg transition-colors"
                          >
                            Cancella prenotazione
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Success/Error messages */}
            {cancelSuccess && (
              <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                <p className="text-green-300 text-sm font-semibold">{cancelSuccess}</p>
              </div>
            )}
            {cancelError && (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm font-semibold">{cancelError}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">

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
                to="/prime-wash"
                className="inline-block px-5 py-2.5 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors text-sm"
              >
                {lang === 'it' ? 'Autolavaggio' : 'Car Wash'}
              </Link>
            </div>
          </div>
        )}

        {/* Modify modal — branches by service type */}
        {modifyingBooking && modifyingBooking.service_type === 'car_rental' && (() => {
          const paidEur = (modifyingBooking.price_total || 0) / 100;
          const newTotal = rentalRecalcTotal;
          const diff = newTotal != null ? Math.round((newTotal - paidEur) * 100) / 100 : 0;
          const willPayByCard = diff > 0 && rentalWalletBalance < diff;
          const willPayByWallet = diff > 0 && rentalWalletBalance >= diff;
          return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModifyingBooking(null)}>
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-2">Modifica Prenotazione</h3>
                <p className="text-gray-400 text-sm mb-4">
                  {modifyingBooking.vehicle_name || modifyingBooking.service_name}
                </p>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Ritiro — Data</label>
                      <input type="date" value={rentalPickupDate} min={new Date().toISOString().split('T')[0]} onChange={e => setRentalPickupDate(e.target.value)} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Ritiro — Orario</label>
                      <input type="time" value={rentalPickupTime} onChange={e => setRentalPickupTime(e.target.value)} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Luogo di ritiro</label>
                    <select value={rentalPickupLocation} onChange={e => setRentalPickupLocation(e.target.value)} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white">
                      {PICKUP_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label.it}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Riconsegna — Data</label>
                      <input type="date" value={rentalDropoffDate} min={rentalPickupDate || new Date().toISOString().split('T')[0]} onChange={e => setRentalDropoffDate(e.target.value)} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Riconsegna — Orario</label>
                      <input type="time" value={rentalDropoffTime} onChange={e => setRentalDropoffTime(e.target.value)} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Luogo di riconsegna</label>
                    <select value={rentalDropoffLocation} onChange={e => setRentalDropoffLocation(e.target.value)} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white">
                      {RETURN_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label.it}</option>)}
                    </select>
                  </div>
                </div>

                {/* Price summary — only shows diff when new total > paid; otherwise keeps paid amount silently */}
                <div className="p-4 rounded-lg bg-gray-800/60 border border-gray-700 mb-4 text-sm space-y-1">
                  {rentalRecalcing ? (
                    <div className="text-gray-500 text-xs">Ricalcolo in corso…</div>
                  ) : diff > 0 ? (
                    <>
                      <div className="flex justify-between"><span className="text-gray-400">Prezzo pagato</span><span className="text-white">€{paidEur.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Nuovo totale</span><span className="text-white">€{(newTotal as number).toFixed(2)}</span></div>
                      <div className="flex justify-between text-amber-400"><span>Differenza da pagare</span><span>+€{diff.toFixed(2)}</span></div>
                      {willPayByWallet && <div className="text-green-400 text-xs mt-1">Addebito dal DR7 Wallet (saldo: €{rentalWalletBalance.toFixed(2)}). Nessuna fattura.</div>}
                      {willPayByCard && <div className="text-blue-400 text-xs mt-1">Saldo wallet insufficiente → pagamento con carta. Verrà generata fattura.</div>}
                    </>
                  ) : (
                    <div className="flex justify-between font-semibold"><span className="text-gray-300">Totale</span><span className="text-white">€{paidEur.toFixed(2)}</span></div>
                  )}
                </div>

                {modifyError && <p className="text-red-400 text-sm mb-4">{modifyError}</p>}

                <div className="flex gap-3">
                  <button onClick={() => setModifyingBooking(null)} className="flex-1 py-3 border border-gray-600 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors">Annulla</button>
                  <button onClick={handleModify} disabled={modifySaving || !rentalPickupDate || !rentalPickupTime || !rentalDropoffDate || !rentalDropoffTime || rentalRecalcing} className="flex-1 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50">
                    {modifySaving ? 'Salvataggio…' : willPayByCard ? 'Paga differenza con carta' : diff > 0 ? 'Conferma e paga dal wallet' : 'Conferma modifica'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {modifyingBooking && modifyingBooking.service_type !== 'car_rental' && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModifyingBooking(null)}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-2">Modifica Appuntamento</h3>
              <p className="text-gray-400 text-sm mb-4">
                {modifyingBooking.service_name} — Prime Flex attivo
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nuova data</label>
                  <input
                    type="date"
                    value={modifyDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setModifyDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nuovo orario</label>
                  <select
                    value={modifyTime}
                    onChange={e => setModifyTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  >
                    {Array.from({ length: 20 }, (_, i) => {
                      const h = Math.floor(i / 2) + 9;
                      const m = i % 2 === 0 ? '00' : '30';
                      const t = `${String(h).padStart(2, '0')}:${m}`;
                      return <option key={t} value={t}>{t}</option>;
                    })}
                  </select>
                </div>
              </div>

              {modifyError && <p className="text-red-400 text-sm mb-4">{modifyError}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setModifyingBooking(null)}
                  className="flex-1 py-3 border border-gray-600 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleModify}
                  disabled={modifySaving || !modifyDate || !modifyTime}
                  className="flex-1 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {modifySaving ? 'Salvataggio...' : 'Conferma modifica'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
