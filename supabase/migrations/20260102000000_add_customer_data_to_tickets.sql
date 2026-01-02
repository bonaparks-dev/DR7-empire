-- Add customer_data JSONB column to commercial_operation_tickets table
-- This will store all extended customer information (codice fiscale, address, PEC, etc.)
-- that is collected during lottery ticket purchases

ALTER TABLE commercial_operation_tickets
ADD COLUMN IF NOT EXISTS customer_data JSONB DEFAULT NULL;

-- Add index for querying customer data
CREATE INDEX IF NOT EXISTS idx_commercial_tickets_customer_data 
ON commercial_operation_tickets USING gin(customer_data);

-- Add comment
COMMENT ON COLUMN commercial_operation_tickets.customer_data IS 
'Extended customer information stored as JSONB. Includes tipo_cliente, codice_fiscale, partita_iva, address, PEC, and other fields from customers_extended table.';
