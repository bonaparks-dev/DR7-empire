-- Update car wash service durations to match new requirements
-- LAVAGGIO COMPLETO: 45 minutes
-- LAVAGGIO TOP: 1.5 hours
-- LAVAGGIO VIP: 2 hours
-- LAVAGGIO DR7 LUXURY: 2.5 hours (dalle 9:00 alle 10:30 o dalle 15:00 alle 16:30)

UPDATE car_wash_services
SET duration = '45 min'
WHERE name = 'LAVAGGIO COMPLETO' OR name_en = 'FULL CLEAN';

UPDATE car_wash_services
SET duration = '1.5 ore'
WHERE name = 'LAVAGGIO TOP' OR name_en = 'TOP SHINE';

UPDATE car_wash_services
SET duration = '2 ore'
WHERE name = 'LAVAGGIO VIP' OR name_en = 'VIP EXPERIENCE';

UPDATE car_wash_services
SET duration = '2.5 ore'
WHERE name = 'LAVAGGIO DR7 LUXURY' OR name_en = 'DR7 LUXURY';

-- Verify the updates
SELECT
    name,
    name_en,
    price,
    duration,
    is_active
FROM car_wash_services
ORDER BY price;
