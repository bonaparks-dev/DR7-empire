-- Create a sequence for the voucher codes
CREATE SEQUENCE IF NOT EXISTS voucher_code_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Create the vouchers table
CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  stripe_session_id TEXT UNIQUE,
  email TEXT NOT NULL,
  value_cents INTEGER NOT NULL,
  paid_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  valid_from TIMESTAMPTZ NOT NULL,
  expiry TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid', -- 'valid', 'redeemed', 'cancelled', 'expired'
  hmac_hash TEXT NOT NULL,
  pdf_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by TEXT -- e.g., staff member ID or name
);

-- Function to generate the sequential voucher code
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code := 'DR7X-' || LPAD(nextval('voucher_code_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set the voucher code on insert
DROP TRIGGER IF EXISTS set_voucher_code ON public.vouchers;
CREATE TRIGGER set_voucher_code
BEFORE INSERT ON public.vouchers
FOR EACH ROW
EXECUTE FUNCTION generate_voucher_code();

-- Create the private storage bucket for vouchers
-- Note: This part is illustrative. Bucket creation is typically done via the Supabase dashboard or management API.
-- However, including it in documentation is crucial.
-- For the purpose of this script, we will assume the bucket 'vouchers' is created and private.
-- Example of policy for private bucket can be found in Supabase documentation.
-- insert into storage.buckets (id, name, public) values ('vouchers', 'vouchers', false);

-- RLS Policies (example, adjust as needed)
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to vouchers"
ON public.vouchers
FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to create vouchers"
ON public.vouchers
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Comment explaining bucket creation
COMMENT ON TABLE public.vouchers IS 'To store voucher PDFs, a private Supabase Storage bucket named "vouchers" must be created.';