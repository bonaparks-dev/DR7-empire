-- Cauzione lifecycle mirrors booking lifecycle.
--
-- A booking has a cauzione associated (created by sync-booking-cauzione at
-- booking insert). When the booking transitions to a cancelled state — from
-- the website (MyBookings handleCancel), from admin, from a refund flow, or
-- anywhere — the cauzione row should disappear too. Otherwise admin's
-- Cauzioni → "Da incassare" tab keeps showing a deposit that no longer
-- applies (the customer never picked up the vehicle).
--
-- We run this at the database level so:
--   • RLS, JWT, Netlify function deploys cannot break the flow.
--   • Any path that flips bookings.status to cancelled/annullata triggers
--     the same cleanup automatically.
--   • Already-finalized cauzioni (real money moved: stato Restituita /
--     Incassata, or data_incasso set) are PRESERVED for audit.

CREATE OR REPLACE FUNCTION public.delete_cauzione_on_booking_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act on a transition INTO cancelled (not on no-op updates).
  IF NEW.status IN ('cancelled', 'annullata')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('cancelled', 'annullata'))
  THEN
    DELETE FROM public.cauzioni
    WHERE riferimento_contratto_id = NEW.id
      AND COALESCE(stato, '') NOT IN ('Restituita', 'Incassata')
      AND data_incasso IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_delete_cauzione_on_booking_cancel ON public.bookings;

CREATE TRIGGER trigger_delete_cauzione_on_booking_cancel
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.delete_cauzione_on_booking_cancel();

COMMENT ON FUNCTION public.delete_cauzione_on_booking_cancel() IS
  'When a booking is cancelled, automatically delete its non-finalized cauzione row(s). Preserves rows where the cauzione was already collected (Incassata / data_incasso set) or already returned (Restituita) for audit.';
