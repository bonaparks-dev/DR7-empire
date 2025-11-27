-- Fix car wash service durations to match correct hours
-- LAVAGGIO COMPLETO: 1h
-- LAVAGGIO TOP: 2h
-- LAVAGGIO VIP: 3h
-- LAVAGGIO DR7 LUXURY: 4h

UPDATE car_wash_services
SET duration = '1 hour'
WHERE name = 'LAVAGGIO COMPLETO' OR name_en = 'COMPLETE WASH';

UPDATE car_wash_services
SET duration = '2 hours'
WHERE name = 'LAVAGGIO TOP' OR name_en = 'TOP WASH';

UPDATE car_wash_services
SET duration = '3 hours'
WHERE name = 'LAVAGGIO VIP' OR name_en = 'VIP WASH';

UPDATE car_wash_services
SET duration = '4 hours'
WHERE name = 'LAVAGGIO DR7 LUXURY' OR name_en = 'DR7 LUXURY WASH';

-- Verify the updates
SELECT
    name,
    name_en,
    price,
    duration,
    is_active
FROM car_wash_services
ORDER BY price;
