-- Optional: Create a reference table for booking extras (for documentation/analytics)
-- The bookings.extras column already exists and works - this is just for reference

CREATE TABLE IF NOT EXISTS public.booking_extras_reference (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_it TEXT NOT NULL,
    description_en TEXT,
    description_it TEXT,
    price_eur NUMERIC NOT NULL,
    price_usd NUMERIC NOT NULL,
    is_one_time BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the 6 booking extras
INSERT INTO public.booking_extras_reference (id, name_en, name_it, description_en, description_it, price_eur, price_usd, is_one_time) VALUES
('mobility_service', 'Mobility Service', 'Servizio Mobilità',
 'Assistance in case of user-caused errors preventing the trip (empty tank, dead battery, lost or locked key)',
 'Assistenza in caso di errori causati dall''utente che impediscono il viaggio (serbatoio vuoto, batteria scarica, chiave persa o bloccata)',
 6.49, 7.14, false),

('accident_insurance', 'Driver & Passenger Accident Insurance', 'Assicurazione Infortuni Conducente e Passeggeri',
 'Financial coverage in case of disability, injury, or death for the driver and passengers',
 'Copertura finanziaria in caso di invalidità, infortunio o decesso per conducente e passeggeri',
 9.47, 10.42, false),

('navigation_system', 'Navigation System (Android Auto / Apple CarPlay)', 'Sistema di Navigazione (Android Auto / Apple CarPlay)',
 'Built-in navigation system with Android Auto and Apple CarPlay connectivity',
 'Sistema di navigazione integrato con connettività Android Auto e Apple CarPlay',
 18.00, 19.80, false),

('international_coverage', 'International Coverage', 'Copertura Internazionale',
 'Allows driving in selected European countries (Germany, France, Austria, Netherlands, Switzerland, etc.)',
 'Consente di guidare in paesi europei selezionati (Germania, Francia, Austria, Paesi Bassi, Svizzera, ecc.)',
 20.00, 22.00, true),

('infant_seat', 'Infant Seat', 'Seggiolino Neonato',
 'Suitable for infants and small children up to 4 years old (40–105 cm), rear-facing only',
 'Adatto per neonati e bambini piccoli fino a 4 anni (40-105 cm), solo rivolto all''indietro',
 24.75, 27.23, false),

('child_seat', 'Child Seat', 'Seggiolino Bambino',
 'For children aged 15 months – 12 years (67–150 cm)',
 'Per bambini dai 15 mesi ai 12 anni (67-150 cm)',
 24.75, 27.23, false);

-- Enable RLS (optional - this table is read-only reference data)
ALTER TABLE public.booking_extras_reference ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read the reference data
CREATE POLICY "Allow public read access to booking extras reference"
ON public.booking_extras_reference
FOR SELECT
TO public
USING (true);

-- Add helpful comment
COMMENT ON TABLE public.booking_extras_reference IS 'Reference table for booking extras - actual bookings store extras as JSONB array in bookings.extras column';
