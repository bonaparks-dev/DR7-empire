-- Fix car wash service durations to display correctly
-- Update all services to use consistent Italian duration format

UPDATE car_wash_services SET duration = '45 min' WHERE id = 'full-clean';
UPDATE car_wash_services SET duration = '1 ora e 30 min' WHERE id = 'top-shine';
UPDATE car_wash_services SET duration = '2 ore' WHERE id = 'vip';
UPDATE car_wash_services SET duration = '2 ore e 30 min' WHERE id = 'dr7-luxury';
UPDATE car_wash_services SET duration = '15 min' WHERE id = 'scooter-wash';
UPDATE car_wash_services SET duration = '15 min' WHERE id = 'exterior-only';
UPDATE car_wash_services SET duration = '30 min' WHERE id = 'interior-only';
