// Bilingual FAQ dataset used by both the dedicated /faq page and the homepage
// FAQ section. Questions are written to target high-intent keywords:
// "noleggio supercar Sardegna", "noleggio Lamborghini Cagliari",
// "autolavaggio premium Cagliari", "DR7 Club", "yachting Sardegna",
// "jet privato Sardegna", "cauzione noleggio", "patente noleggio supercar".
//
// Each entry feeds the FAQPage JSON-LD schema (schema.org/FAQPage) which makes
// the answers eligible for Google's FAQ rich results.

export interface FaqEntry {
  id: string;
  category:
    | 'rental'
    | 'requirements'
    | 'pricing'
    | 'insurance'
    | 'cancellation'
    | 'payment'
    | 'wash'
    | 'club'
    | 'yacht'
    | 'jet'
    | 'wallet';
  question: { it: string; en: string };
  answer: { it: string; en: string };
  // Marks questions to surface on the homepage FAQ section.
  homepage?: boolean;
}

export const FAQS: FaqEntry[] = [
  // ===== NOLEGGIO SUPERCAR / LUSSO =====
  {
    id: 'rent-supercar-sardegna',
    category: 'rental',
    homepage: true,
    question: {
      it: 'Come si noleggia una supercar in Sardegna con DR7 Empire?',
      en: 'How do I rent a supercar in Sardinia with DR7 Empire?',
    },
    answer: {
      it: 'Puoi noleggiare una supercar (Lamborghini, Ferrari, Porsche, BMW M, Mercedes AMG) direttamente dal sito dr7empire.com selezionando date e veicolo nella sezione Supercar Division. Confermi la prenotazione online con carta di credito e ritiri il veicolo presso la nostra sede di Viale Marconi 229 a Cagliari oppure richiedi consegna in aeroporto, hotel o porto in tutta la Sardegna.',
      en: 'You can rent a supercar (Lamborghini, Ferrari, Porsche, BMW M, Mercedes AMG) directly on dr7empire.com by picking your dates and vehicle in the Supercar Division section. Confirm the booking online with a credit card and pick up the car at our Cagliari office (Viale Marconi 229), or request delivery to the airport, your hotel or any port in Sardinia.',
    },
  },
  {
    id: 'rent-lamborghini-ferrari',
    category: 'rental',
    homepage: true,
    question: {
      it: 'Posso noleggiare una Lamborghini o una Ferrari a Cagliari?',
      en: 'Can I rent a Lamborghini or Ferrari in Cagliari?',
    },
    answer: {
      it: 'Sì. La flotta DR7 Empire include modelli Lamborghini, Ferrari, Porsche 911, BMW M e Mercedes-AMG, disponibili sia per noleggio giornaliero sia per esperienze di più giorni. Il ritiro standard è a Cagliari, ma offriamo anche consegna e ritiro in tutta la Sardegna su richiesta.',
      en: 'Yes. The DR7 Empire fleet includes Lamborghini, Ferrari, Porsche 911, BMW M and Mercedes-AMG models, available for both daily rentals and multi-day experiences. Standard pickup is in Cagliari, with optional delivery and collection anywhere in Sardinia on request.',
    },
  },
  {
    id: 'urban-rental',
    category: 'rental',
    question: {
      it: 'DR7 noleggia anche city car e auto urbane economiche?',
      en: 'Does DR7 also rent city cars and affordable urban vehicles?',
    },
    answer: {
      it: 'Sì. La Urban Mobility Division offre city car e auto urbane per spostamenti pratici in città e in tutta la Sardegna a tariffe accessibili, con KM illimitati e assicurazione inclusa.',
      en: 'Yes. The Urban Mobility Division offers city cars and urban vehicles for practical city or island-wide travel at affordable rates, with unlimited mileage and insurance included.',
    },
  },

  // ===== REQUISITI =====
  {
    id: 'min-age',
    category: 'requirements',
    homepage: true,
    question: {
      it: 'Qual è l’età minima per noleggiare una supercar?',
      en: 'What is the minimum age to rent a supercar?',
    },
    answer: {
      it: 'Per la Supercar Division (Fascia A) è richiesta un’età compresa tra 26 e 69 anni con almeno 5 anni di patente. La Fascia B (21-25 anni o 3-4 anni di patente) può accedere a una selezione di veicoli con condizioni dedicate. Sotto i 21 anni, oltre i 70 o con meno di 3 anni di patente il noleggio non è possibile.',
      en: 'The Supercar Division (Tier A) requires drivers between 26 and 69 years old with at least 5 years of driving licence. Tier B (21-25 years old, or 3-4 years of licence) can access a selected fleet under specific conditions. Under 21, over 70, or with less than 3 years of licence, rental is not available.',
    },
  },
  {
    id: 'documents-needed',
    category: 'requirements',
    question: {
      it: 'Quali documenti servono per noleggiare un’auto in Sardegna?',
      en: 'What documents do I need to rent a car in Sardinia?',
    },
    answer: {
      it: 'Servono: carta d’identità o passaporto in corso di validità, patente di guida valida da almeno 3-5 anni (a seconda della fascia) e una carta di credito intestata al conducente per l’addebito della cauzione. Per cittadini extra-UE è richiesto anche il passaporto.',
      en: 'You need: a valid ID card or passport, a valid driving licence held for at least 3-5 years (depending on the tier), and a credit card in the driver’s name to authorise the security deposit. Non-EU citizens must also present a passport.',
    },
  },

  // ===== PREZZI / KM =====
  {
    id: 'km-included',
    category: 'pricing',
    homepage: true,
    question: {
      it: 'Quanti chilometri sono inclusi nel noleggio?',
      en: 'How many kilometres are included in the rental?',
    },
    answer: {
      it: 'I KM inclusi sono calcolati automaticamente in base ai giorni: 1 giorno = 100 KM, 2 giorni = 180 KM, 3 giorni = 240 KM, 4 giorni = 280 KM, 5 giorni = 300 KM, oltre il quinto giorno +60 KM/giorno. È disponibile l’opzione KM illimitati. Per le auto urbane i KM sono sempre illimitati. I KM in eccesso vengono fatturati a €1,80/KM (sforo).',
      en: 'Included mileage is calculated automatically by rental length: 1 day = 100 KM, 2 days = 180 KM, 3 days = 240 KM, 4 days = 280 KM, 5 days = 300 KM, and +60 KM/day after the fifth day. An unlimited mileage option is available. Urban cars always include unlimited mileage. Excess kilometres are billed at €1.80 per KM.',
    },
  },
  {
    id: 'delivery-airport',
    category: 'pricing',
    question: {
      it: 'Offrite consegna in aeroporto, hotel o in porto?',
      en: 'Do you offer delivery to airports, hotels or ports?',
    },
    answer: {
      it: 'Sì. Su richiesta consegniamo e ritiriamo il veicolo all’aeroporto di Cagliari-Elmas, Olbia, Alghero, in hotel, ville, porti turistici o residenze private in tutta la Sardegna. Il costo del transfer dipende dalla distanza e dall’orario.',
      en: 'Yes. On request we deliver and collect vehicles at Cagliari-Elmas, Olbia or Alghero airports, hotels, villas, marinas or private residences anywhere in Sardinia. The transfer fee depends on distance and time.',
    },
  },

  // ===== ASSICURAZIONE / CAUZIONE =====
  {
    id: 'insurance-options',
    category: 'insurance',
    question: {
      it: 'Quali coperture assicurative sono incluse?',
      en: 'Which insurance options are included?',
    },
    answer: {
      it: 'Tutti i noleggi includono RCA obbligatoria. Sono disponibili pacchetti aggiuntivi: Kasko Base, Kasko Black, Signature e DR7 (riduzione franchigia fino a zero in base alla formula scelta). Le tariffe sono visibili durante la prenotazione e variano in base al veicolo (Fascia A o Fascia B).',
      en: 'All rentals include mandatory third-party liability (RCA). Additional packages are available: Base, Black, Signature and DR7 (with progressive deductible reduction down to zero). Rates are shown during booking and depend on the vehicle tier (A or B).',
    },
  },
  {
    id: 'security-deposit',
    category: 'insurance',
    homepage: true,
    question: {
      it: 'È richiesta una cauzione e a quanto ammonta?',
      en: 'Is a security deposit required and how much is it?',
    },
    answer: {
      it: 'Sì. Per ogni noleggio è prevista una cauzione (deposito) bloccata sulla carta di credito del conducente. L’importo varia in base al veicolo e alla copertura assicurativa scelta ed è indicato in fase di prenotazione. La cauzione viene rilasciata al rientro del veicolo, salvo danni o sanzioni.',
      en: 'Yes. Every rental requires a security deposit pre-authorised on the driver’s credit card. The amount depends on the vehicle and the chosen insurance package and is shown at checkout. The deposit is released after the vehicle is returned, unless damage or fines apply.',
    },
  },

  // ===== CANCELLAZIONE / RIMBORSI =====
  {
    id: 'cancellation-policy',
    category: 'cancellation',
    question: {
      it: 'Posso annullare o modificare la prenotazione?',
      en: 'Can I cancel or modify my booking?',
    },
    answer: {
      it: 'Sì. Cancellando con almeno 5 giorni di anticipo viene applicata una commissione del 10% e il restante 90% viene accreditato come credito DR7 Wallet. Cancellazioni con meno di 5 giorni di anticipo o no-show non danno diritto a rimborso. Le modifiche di data sono soggette a disponibilità.',
      en: 'Yes. Cancelling at least 5 days in advance applies a 10% fee and the remaining 90% is credited to your DR7 Wallet. Cancellations within 5 days, or no-shows, are non-refundable. Date changes are subject to availability.',
    },
  },

  // ===== PAGAMENTI =====
  {
    id: 'payment-methods',
    category: 'payment',
    question: {
      it: 'Quali metodi di pagamento accettate?',
      en: 'Which payment methods do you accept?',
    },
    answer: {
      it: 'Accettiamo carte di credito e debito Visa, Mastercard e American Express tramite Nexi (gateway certificato), bonifico bancario e DR7 Credit Wallet. Le carte prepagate non sono accettate per la cauzione.',
      en: 'We accept Visa, Mastercard and American Express credit and debit cards via Nexi (certified gateway), bank transfer and DR7 Credit Wallet. Prepaid cards are not accepted for the security deposit.',
    },
  },

  // ===== PRIME CAR WASH =====
  {
    id: 'car-wash',
    category: 'wash',
    homepage: true,
    question: {
      it: 'Cosa include il servizio Prime Car Wash a Cagliari?',
      en: 'What does the Prime Car Wash service in Cagliari include?',
    },
    answer: {
      it: 'Prime Car Wash offre lavaggio premium, sanificazione interna, detailing professionale, lucidatura, trattamenti ceramic coating e paint protection film (PPF). Il servizio è disponibile presso la sede di Cagliari dal lunedì al venerdì 9-13 e 15-19, sabato 9-13 e 14-18.',
      en: 'Prime Car Wash offers premium washing, interior sanitation, professional detailing, polishing, ceramic coating and paint protection film (PPF). The service is available at our Cagliari location Monday to Friday 9-13 and 15-19, Saturday 9-13 and 14-18.',
    },
  },
  {
    id: 'mechanical',
    category: 'wash',
    question: {
      it: 'Offrite anche un servizio di meccanica rapida?',
      en: 'Do you also provide a rapid mechanical service?',
    },
    answer: {
      it: 'Sì. La DR7 Rapid Response Services offre interventi meccanici rapidi su prenotazione: tagliando, cambio gomme, controllo freni, diagnosi, piccoli interventi. Prenotabile online dalla sezione Meccanica.',
      en: 'Yes. DR7 Rapid Response Services offers quick mechanical jobs by appointment: scheduled service, tyre change, brake check, diagnostics and minor repairs. Bookable online from the Meccanica section.',
    },
  },

  // ===== CLUB / MEMBERSHIP =====
  {
    id: 'dr7-club',
    category: 'club',
    question: {
      it: 'Cos’è il DR7 Club e quanto costa la membership?',
      en: 'What is the DR7 Club and how much does membership cost?',
    },
    answer: {
      it: 'Il DR7 Club è il programma fedeltà di DR7 Empire. La quota di iscrizione è di €39/anno e dà accesso a tariffe preferenziali, priorità di prenotazione, inviti a eventi privati e tier (Gold/Platinum) basati sulla spesa annuale (noleggi pagati con carta + ricariche wallet negli ultimi 12 mesi).',
      en: 'The DR7 Club is DR7 Empire’s loyalty programme. Membership costs €39 per year and unlocks preferential rates, priority booking, invitations to private events, and Gold/Platinum tiers based on annual spend (card-paid bookings plus wallet recharges over the last 12 months).',
    },
  },

  // ===== YACHTING =====
  {
    id: 'yacht-charter',
    category: 'yacht',
    question: {
      it: 'È possibile noleggiare uno yacht in Sardegna con DR7?',
      en: 'Can I charter a yacht in Sardinia with DR7?',
    },
    answer: {
      it: 'Sì. La DR7 Yachting Division gestisce noleggi di yacht e barche in tutta la Sardegna, con o senza skipper, per uscite giornaliere o crociere multi-giorno lungo la Costa Smeralda, Villasimius, La Maddalena e l’Arcipelago.',
      en: 'Yes. The DR7 Yachting Division offers yacht and boat charters across Sardinia, with or without skipper, for day trips or multi-day cruises along the Costa Smeralda, Villasimius, La Maddalena and the archipelago.',
    },
  },

  // ===== JET =====
  {
    id: 'private-jet',
    category: 'jet',
    question: {
      it: 'Organizzate voli in jet privato da e per la Sardegna?',
      en: 'Do you arrange private jet flights to and from Sardinia?',
    },
    answer: {
      it: 'Sì. La DR7 Aviation Division organizza voli in jet privato da e per gli aeroporti di Cagliari, Olbia e Alghero, con preventivo personalizzato in base a velivolo, rotta e numero di passeggeri.',
      en: 'Yes. The DR7 Aviation Division arranges private jet flights to and from Cagliari, Olbia and Alghero airports, with a custom quote based on aircraft, route and passenger count.',
    },
  },

  // ===== WALLET =====
  {
    id: 'credit-wallet',
    category: 'wallet',
    question: {
      it: 'Come funziona il DR7 Credit Wallet?',
      en: 'How does the DR7 Credit Wallet work?',
    },
    answer: {
      it: 'Il DR7 Credit Wallet è un portafoglio digitale ricaricabile che ti permette di pagare i servizi DR7 (noleggi, lavaggi, meccanica, esperienze) con un saldo prepagato e di accumulare credito da cancellazioni e promozioni. Le ricariche sono valide per 12 mesi e contribuiscono al calcolo del tier DR7 Club.',
      en: 'The DR7 Credit Wallet is a rechargeable digital wallet you can use to pay for DR7 services (rentals, car wash, mechanical, experiences) with a prepaid balance and to collect credit from cancellations and promotions. Top-ups are valid for 12 months and count toward your DR7 Club tier calculation.',
    },
  },
];

export const HOMEPAGE_FAQS = FAQS.filter((f) => f.homepage);
