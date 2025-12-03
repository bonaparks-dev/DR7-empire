-- Restore RS3 Verde - set back to available
UPDATE vehicles
SET status = 'available',
    daily_rate = 70
WHERE display_name ILIKE '%rs3%verde%' OR display_name ILIKE '%rs3 verde%';

-- Verify the change
SELECT id, display_name, daily_rate, status, plate, category
FROM vehicles
WHERE display_name ILIKE '%rs3%';
