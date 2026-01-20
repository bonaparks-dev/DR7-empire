select * from reservations where vehicle_id in (select id from vehicles where display_name ilike '%Porsche Cayenne%') and end_at > '2026-01-01' order by end_at desc;
