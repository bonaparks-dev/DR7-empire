-- ============================================================
-- Store Nexi card token on wallet purchases.
-- Filled by nexi-callback when the recharge is created with
-- recurrence.contractType='MIT_UNSCHEDULED'. Same value is also
-- mirrored to customers_extended.metadata.nexi_contract_id for
-- quick admin lookup.
-- ============================================================

ALTER TABLE credit_wallet_purchases
  ADD COLUMN IF NOT EXISTS nexi_contract_id TEXT;

CREATE INDEX IF NOT EXISTS idx_credit_wallet_purchases_contract_id
  ON credit_wallet_purchases(nexi_contract_id);
