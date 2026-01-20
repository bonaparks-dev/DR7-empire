-- Temporarily change LAVAGGIO SCOOTER price to €1 for testing
UPDATE car_wash_services 
SET price = 1
WHERE name ILIKE '%scooter%';

-- Verify the change (without category column)
SELECT * FROM car_wash_services WHERE name ILIKE '%scooter%';
