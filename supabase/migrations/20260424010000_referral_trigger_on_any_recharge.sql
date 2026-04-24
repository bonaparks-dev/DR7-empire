-- ============================================================
-- Fire referral bonus on ANY wallet recharge >= €100
--
-- Previously only nexi-callback triggered grant_referral_bonus.
-- Now any credit_transactions INSERT representing a real recharge
-- (website Nexi top-up OR admin manual credit in Centralina) will
-- fire the same RPC. The RPC's UNIQUE(referee_user_id) guarantees
-- the bonus is still paid exactly once per invited friend.
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_referral_bonus_on_wallet_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only real recharges count: website wallet purchases + admin manual top-ups.
  -- Explicitly excludes welcome bonus, cashback, club signup bonus, referral
  -- bonus itself, and booking payments.
  IF NEW.transaction_type = 'credit'
     AND NEW.amount >= 100
     AND NEW.reference_type IN ('wallet_purchase', 'admin_manual')
  THEN
    PERFORM grant_referral_bonus(
      NEW.user_id,
      CASE WHEN NEW.reference_type = 'wallet_purchase' THEN NEW.reference_id ELSE NULL END,
      NEW.amount
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_referral_bonus_on_wallet_credit ON credit_transactions;
CREATE TRIGGER trg_referral_bonus_on_wallet_credit
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_referral_bonus_on_wallet_credit();
