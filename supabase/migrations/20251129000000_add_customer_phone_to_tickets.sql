-- Add customer_phone column to commercial_operation_tickets table
ALTER TABLE commercial_operation_tickets
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_commercial_tickets_phone ON commercial_operation_tickets(customer_phone);

-- Comment on column
COMMENT ON COLUMN commercial_operation_tickets.customer_phone IS 'Customer phone number for ticket holder';
