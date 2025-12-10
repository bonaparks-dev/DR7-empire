-- Add metadata column to customers_extended table
ALTER TABLE customers_extended
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create an index on the metadata column for better query performance if needed
CREATE INDEX IF NOT EXISTS idx_customers_metadata ON customers_extended USING gin (metadata);
