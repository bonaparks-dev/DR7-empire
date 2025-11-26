-- Fix ticket numbers and add unique constraint to prevent duplicates

-- First, check if there are any tickets with numbers outside the valid range (1-2000)
-- and log them for manual review
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM commercial_operation_tickets
    WHERE ticket_number < 1 OR ticket_number > 2000;

    IF invalid_count > 0 THEN
        RAISE NOTICE 'Found % tickets with invalid numbers (outside 1-2000 range)', invalid_count;
    END IF;
END $$;

-- Add unique constraint on ticket_number to prevent duplicate assignments
-- This will ensure no two customers can have the same ticket number
ALTER TABLE commercial_operation_tickets
  ADD CONSTRAINT unique_ticket_number UNIQUE (ticket_number);

-- Add check constraint to ensure ticket numbers are always between 1 and 2000
ALTER TABLE commercial_operation_tickets
  ADD CONSTRAINT valid_ticket_number_range CHECK (ticket_number >= 1 AND ticket_number <= 2000);

-- Create index on ticket_number for faster lookups when checking available tickets
CREATE INDEX IF NOT EXISTS idx_commercial_tickets_ticket_number ON commercial_operation_tickets(ticket_number);

-- Comment
COMMENT ON CONSTRAINT unique_ticket_number ON commercial_operation_tickets IS 'Ensures each ticket number (1-2000) is assigned only once';
COMMENT ON CONSTRAINT valid_ticket_number_range ON commercial_operation_tickets IS 'Ensures ticket numbers are always between 1 and 2000';
