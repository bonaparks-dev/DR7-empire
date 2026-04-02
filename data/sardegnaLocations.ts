// Sardegna Locations Database for DR7 Empire
// All locations in Sardinia relevant for vehicle rental delivery/pickup

export interface SardegnaLocation {
  id: string;
  name: string;
  type: 'city' | 'airport' | 'port' | 'resort' | 'town';
  province: string;
  label: string;
  aliases: string[];
}

// DR7 Office location
export const DR7_OFFICE_LOCATION: SardegnaLocation = {
  id: 'dr7-cagliari',
  name: 'DR7 Cagliari',
  type: 'city',
  province: 'CA',
  label: 'DR7 Cagliari — Viale Marconi 229, 09131',
  aliases: ['dr7', 'sede', 'ufficio', 'office', 'noleggio', 'marconi', 'viale marconi'],
};

export const SARDEGNA_LOCATIONS: SardegnaLocation[] = [
  // ── AIRPORTS ──
  {
    id: 'cagliari-aeroporto',
    name: 'Cagliari Aeroporto Elmas',
    type: 'airport',
    province: 'CA',
    label: 'Cagliari — Aeroporto Elmas',
    aliases: ['elmas', 'cag', 'aeroporto cagliari', 'mario mameli'],
  },
  {
    id: 'olbia-aeroporto',
    name: 'Olbia Aeroporto Costa Smeralda',
    type: 'airport',
    province: 'SS',
    label: 'Olbia — Aeroporto Costa Smeralda',
    aliases: ['olbia airport', 'costa smeralda airport', 'olb', 'aeroporto olbia'],
  },
  {
    id: 'alghero-aeroporto',
    name: 'Alghero Aeroporto Fertilia',
    type: 'airport',
    province: 'SS',
    label: 'Alghero — Aeroporto Fertilia',
    aliases: ['fertilia', 'ahо', 'aeroporto alghero', 'riviera del corallo'],
  },

  // ── PORTS ──
  {
    id: 'cagliari-porto',
    name: 'Cagliari Porto',
    type: 'port',
    province: 'CA',
    label: 'Cagliari — Porto',
    aliases: ['porto cagliari', 'porto canale'],
  },
  {
    id: 'olbia-porto',
    name: 'Olbia Porto',
    type: 'port',
    province: 'SS',
    label: 'Olbia — Porto',
    aliases: ['porto olbia', 'porto isola bianca'],
  },
  {
    id: 'porto-torres-porto',
    name: 'Porto Torres Porto',
    type: 'port',
    province: 'SS',
    label: 'Porto Torres — Porto',
    aliases: ['porto torres'],
  },
  {
    id: 'arbatax-porto',
    name: 'Arbatax Porto',
    type: 'port',
    province: 'NU',
    label: 'Arbatax — Porto',
    aliases: ['porto arbatax'],
  },
  {
    id: 'golfo-aranci-porto',
    name: 'Golfo Aranci Porto',
    type: 'port',
    province: 'SS',
    label: 'Golfo Aranci — Porto',
    aliases: ['porto golfo aranci'],
  },
  {
    id: 'santa-teresa-gallura-porto',
    name: 'Santa Teresa Gallura Porto',
    type: 'port',
    province: 'SS',
    label: 'Santa Teresa Gallura — Porto',
    aliases: ['porto santa teresa', 'santa teresa porto'],
  },
  {
    id: 'palau-porto',
    name: 'Palau Porto',
    type: 'port',
    province: 'SS',
    label: 'Palau — Porto',
    aliases: ['porto palau'],
  },
  {
    id: 'la-maddalena-porto',
    name: 'La Maddalena Porto',
    type: 'port',
    province: 'SS',
    label: 'La Maddalena — Porto',
    aliases: ['porto la maddalena', 'maddalena porto'],
  },
  {
    id: 'carloforte-porto',
    name: 'Carloforte Porto',
    type: 'port',
    province: 'SU',
    label: 'Carloforte — Porto',
    aliases: ['porto carloforte', 'isola di san pietro'],
  },

  // ── CITIES (Capoluoghi di Provincia) ──
  {
    id: 'cagliari',
    name: 'Cagliari',
    type: 'city',
    province: 'CA',
    label: 'Cagliari — Centro',
    aliases: ['casteddu', 'capoluogo'],
  },
  {
    id: 'sassari',
    name: 'Sassari',
    type: 'city',
    province: 'SS',
    label: 'Sassari — Centro',
    aliases: ['tatari'],
  },
  {
    id: 'nuoro',
    name: 'Nuoro',
    type: 'city',
    province: 'NU',
    label: 'Nuoro — Centro',
    aliases: ['nugoro'],
  },
  {
    id: 'oristano',
    name: 'Oristano',
    type: 'city',
    province: 'OR',
    label: 'Oristano — Centro',
    aliases: ['aristanis'],
  },

  // ── TOWNS ──
  {
    id: 'olbia',
    name: 'Olbia',
    type: 'town',
    province: 'SS',
    label: 'Olbia — Centro',
    aliases: ['terranoa'],
  },
  {
    id: 'alghero',
    name: 'Alghero',
    type: 'town',
    province: 'SS',
    label: 'Alghero — Centro',
    aliases: ['alguer'],
  },
  {
    id: 'porto-cervo',
    name: 'Porto Cervo',
    type: 'town',
    province: 'SS',
    label: 'Porto Cervo',
    aliases: ['costa smeralda', 'cervo'],
  },
  {
    id: 'porto-rotondo',
    name: 'Porto Rotondo',
    type: 'town',
    province: 'SS',
    label: 'Porto Rotondo',
    aliases: ['rotondo'],
  },
  {
    id: 'villasimius',
    name: 'Villasimius',
    type: 'town',
    province: 'CA',
    label: 'Villasimius',
    aliases: ['villasimius spiagge'],
  },
  {
    id: 'pula',
    name: 'Pula',
    type: 'town',
    province: 'CA',
    label: 'Pula',
    aliases: ['nora'],
  },
  {
    id: 'chia',
    name: 'Chia',
    type: 'town',
    province: 'CA',
    label: 'Chia',
    aliases: ['spiaggia chia'],
  },
  {
    id: 'teulada',
    name: 'Teulada',
    type: 'town',
    province: 'CA',
    label: 'Teulada',
    aliases: [],
  },
  {
    id: 'iglesias',
    name: 'Iglesias',
    type: 'town',
    province: 'SU',
    label: 'Iglesias',
    aliases: ['igresias'],
  },
  {
    id: 'carbonia',
    name: 'Carbonia',
    type: 'town',
    province: 'SU',
    label: 'Carbonia',
    aliases: [],
  },
  {
    id: 'quartu-sant-elena',
    name: "Quartu Sant'Elena",
    type: 'town',
    province: 'CA',
    label: "Quartu Sant'Elena",
    aliases: ['quartu'],
  },
  {
    id: 'elmas',
    name: 'Elmas',
    type: 'town',
    province: 'CA',
    label: 'Elmas',
    aliases: [],
  },
  {
    id: 'costa-rei',
    name: 'Costa Rei',
    type: 'town',
    province: 'CA',
    label: 'Costa Rei',
    aliases: ['rei'],
  },
  {
    id: 'san-teodoro',
    name: 'San Teodoro',
    type: 'town',
    province: 'SS',
    label: 'San Teodoro',
    aliases: ['santu teodoro'],
  },
  {
    id: 'palau',
    name: 'Palau',
    type: 'town',
    province: 'SS',
    label: 'Palau',
    aliases: [],
  },
  {
    id: 'santa-teresa-gallura',
    name: 'Santa Teresa Gallura',
    type: 'town',
    province: 'SS',
    label: 'Santa Teresa Gallura',
    aliases: ['santa teresa', 'longosardo'],
  },
  {
    id: 'golfo-aranci',
    name: 'Golfo Aranci',
    type: 'town',
    province: 'SS',
    label: 'Golfo Aranci',
    aliases: [],
  },
  {
    id: 'arbatax',
    name: 'Arbatax',
    type: 'town',
    province: 'NU',
    label: 'Arbatax',
    aliases: ['rocce rosse'],
  },
  {
    id: 'tortoli',
    name: 'Tortoli',
    type: 'town',
    province: 'NU',
    label: 'Tortoli',
    aliases: ['tortolì'],
  },
  {
    id: 'bosa',
    name: 'Bosa',
    type: 'town',
    province: 'OR',
    label: 'Bosa',
    aliases: [],
  },
  {
    id: 'castelsardo',
    name: 'Castelsardo',
    type: 'town',
    province: 'SS',
    label: 'Castelsardo',
    aliases: [],
  },
  {
    id: 'siniscola',
    name: 'Siniscola',
    type: 'town',
    province: 'NU',
    label: 'Siniscola',
    aliases: [],
  },
  {
    id: 'orosei',
    name: 'Orosei',
    type: 'town',
    province: 'NU',
    label: 'Orosei',
    aliases: [],
  },
  {
    id: 'budoni',
    name: 'Budoni',
    type: 'town',
    province: 'SS',
    label: 'Budoni',
    aliases: [],
  },
  {
    id: 'muravera',
    name: 'Muravera',
    type: 'town',
    province: 'CA',
    label: 'Muravera',
    aliases: [],
  },
  {
    id: 'la-maddalena',
    name: 'La Maddalena',
    type: 'town',
    province: 'SS',
    label: 'La Maddalena',
    aliases: ['maddalena', 'arcipelago'],
  },
  {
    id: 'tempio-pausania',
    name: 'Tempio Pausania',
    type: 'town',
    province: 'SS',
    label: 'Tempio Pausania',
    aliases: ['tempio'],
  },
  {
    id: 'assemini',
    name: 'Assemini',
    type: 'town',
    province: 'CA',
    label: 'Assemini',
    aliases: [],
  },
  {
    id: 'sestu',
    name: 'Sestu',
    type: 'town',
    province: 'CA',
    label: 'Sestu',
    aliases: [],
  },
  {
    id: 'monserrato',
    name: 'Monserrato',
    type: 'town',
    province: 'CA',
    label: 'Monserrato',
    aliases: [],
  },
  {
    id: 'selargius',
    name: 'Selargius',
    type: 'town',
    province: 'CA',
    label: 'Selargius',
    aliases: [],
  },
  {
    id: 'decimomannu',
    name: 'Decimomannu',
    type: 'town',
    province: 'CA',
    label: 'Decimomannu',
    aliases: ['decimu'],
  },
  {
    id: 'guspini',
    name: 'Guspini',
    type: 'town',
    province: 'SU',
    label: 'Guspini',
    aliases: [],
  },
  {
    id: 'villacidro',
    name: 'Villacidro',
    type: 'town',
    province: 'SU',
    label: 'Villacidro',
    aliases: [],
  },
  {
    id: 'carloforte',
    name: 'Carloforte',
    type: 'town',
    province: 'SU',
    label: 'Carloforte',
    aliases: ['san pietro', 'isola di san pietro'],
  },
  {
    id: 'sant-antioco',
    name: "Sant'Antioco",
    type: 'town',
    province: 'SU',
    label: "Sant'Antioco",
    aliases: ['antioco'],
  },
  {
    id: 'porto-torres',
    name: 'Porto Torres',
    type: 'town',
    province: 'SS',
    label: 'Porto Torres',
    aliases: [],
  },
  {
    id: 'ozieri',
    name: 'Ozieri',
    type: 'town',
    province: 'SS',
    label: 'Ozieri',
    aliases: [],
  },
  {
    id: 'macomer',
    name: 'Macomer',
    type: 'town',
    province: 'NU',
    label: 'Macomer',
    aliases: [],
  },
  {
    id: 'sorgono',
    name: 'Sorgono',
    type: 'town',
    province: 'NU',
    label: 'Sorgono',
    aliases: [],
  },
  {
    id: 'lanusei',
    name: 'Lanusei',
    type: 'town',
    province: 'NU',
    label: 'Lanusei',
    aliases: [],
  },
  {
    id: 'sanluri',
    name: 'Sanluri',
    type: 'town',
    province: 'SU',
    label: 'Sanluri',
    aliases: [],
  },
  {
    id: 'senorbi',
    name: 'Senorbi',
    type: 'town',
    province: 'CA',
    label: 'Senorbi',
    aliases: ['senorbì'],
  },
  {
    id: 'isili',
    name: 'Isili',
    type: 'town',
    province: 'CA',
    label: 'Isili',
    aliases: [],
  },
  {
    id: 'domusnovas',
    name: 'Domusnovas',
    type: 'town',
    province: 'SU',
    label: 'Domusnovas',
    aliases: [],
  },
  {
    id: 'capoterra',
    name: 'Capoterra',
    type: 'town',
    province: 'CA',
    label: 'Capoterra',
    aliases: [],
  },
  {
    id: 'sarroch',
    name: 'Sarroch',
    type: 'town',
    province: 'CA',
    label: 'Sarroch',
    aliases: [],
  },
  {
    id: 'villa-san-pietro',
    name: 'Villa San Pietro',
    type: 'town',
    province: 'CA',
    label: 'Villa San Pietro',
    aliases: [],
  },
  {
    id: 'domus-de-maria',
    name: 'Domus de Maria',
    type: 'town',
    province: 'CA',
    label: 'Domus de Maria',
    aliases: [],
  },
  {
    id: 'castiadas',
    name: 'Castiadas',
    type: 'town',
    province: 'CA',
    label: 'Castiadas',
    aliases: [],
  },
  {
    id: 'stintino',
    name: 'Stintino',
    type: 'town',
    province: 'SS',
    label: 'Stintino',
    aliases: ['pelosa', 'spiaggia della pelosa'],
  },
  {
    id: 'valledoria',
    name: 'Valledoria',
    type: 'town',
    province: 'SS',
    label: 'Valledoria',
    aliases: [],
  },
  {
    id: 'badesi',
    name: 'Badesi',
    type: 'town',
    province: 'SS',
    label: 'Badesi',
    aliases: [],
  },
  {
    id: 'trinita-d-agultu',
    name: "Trinita d'Agultu",
    type: 'town',
    province: 'SS',
    label: "Trinita d'Agultu",
    aliases: ['trinita', 'isola rossa'],
  },
  {
    id: 'arzachena',
    name: 'Arzachena',
    type: 'town',
    province: 'SS',
    label: 'Arzachena',
    aliases: [],
  },
  {
    id: 'cannigione',
    name: 'Cannigione',
    type: 'town',
    province: 'SS',
    label: 'Cannigione',
    aliases: [],
  },
  {
    id: 'baja-sardinia',
    name: 'Baja Sardinia',
    type: 'town',
    province: 'SS',
    label: 'Baja Sardinia',
    aliases: ['baia sardinia'],
  },
  {
    id: 'cala-gonone',
    name: 'Cala Gonone',
    type: 'town',
    province: 'NU',
    label: 'Cala Gonone',
    aliases: [],
  },
  {
    id: 'dorgali',
    name: 'Dorgali',
    type: 'town',
    province: 'NU',
    label: 'Dorgali',
    aliases: [],
  },
  {
    id: 'orgosolo',
    name: 'Orgosolo',
    type: 'town',
    province: 'NU',
    label: 'Orgosolo',
    aliases: [],
  },
  {
    id: 'fonni',
    name: 'Fonni',
    type: 'town',
    province: 'NU',
    label: 'Fonni',
    aliases: [],
  },
  {
    id: 'desulo',
    name: 'Desulo',
    type: 'town',
    province: 'NU',
    label: 'Desulo',
    aliases: [],
  },
  {
    id: 'aritzo',
    name: 'Aritzo',
    type: 'town',
    province: 'NU',
    label: 'Aritzo',
    aliases: [],
  },
  {
    id: 'laconi',
    name: 'Laconi',
    type: 'town',
    province: 'OR',
    label: 'Laconi',
    aliases: [],
  },
  {
    id: 'barumini',
    name: 'Barumini',
    type: 'town',
    province: 'SU',
    label: 'Barumini',
    aliases: ['su nuraxi'],
  },
  {
    id: 'tuili',
    name: 'Tuili',
    type: 'town',
    province: 'SU',
    label: 'Tuili',
    aliases: [],
  },
  {
    id: 'siddi',
    name: 'Siddi',
    type: 'town',
    province: 'SU',
    label: 'Siddi',
    aliases: [],
  },
  {
    id: 'cabras',
    name: 'Cabras',
    type: 'town',
    province: 'OR',
    label: 'Cabras',
    aliases: ['tharros', 'giganti di mont\'e prama'],
  },
  {
    id: 'san-vero-milis',
    name: 'San Vero Milis',
    type: 'town',
    province: 'OR',
    label: 'San Vero Milis',
    aliases: [],
  },
  {
    id: 'bosa-marina',
    name: 'Bosa Marina',
    type: 'town',
    province: 'OR',
    label: 'Bosa Marina',
    aliases: [],
  },
  {
    id: 'cuglieri',
    name: 'Cuglieri',
    type: 'town',
    province: 'OR',
    label: 'Cuglieri',
    aliases: [],
  },
  {
    id: 'terralba',
    name: 'Terralba',
    type: 'town',
    province: 'OR',
    label: 'Terralba',
    aliases: [],
  },
  {
    id: 'ales',
    name: 'Ales',
    type: 'town',
    province: 'OR',
    label: 'Ales',
    aliases: [],
  },
  {
    id: 'mogoro',
    name: 'Mogoro',
    type: 'town',
    province: 'OR',
    label: 'Mogoro',
    aliases: [],
  },
  {
    id: 'samugheo',
    name: 'Samugheo',
    type: 'town',
    province: 'OR',
    label: 'Samugheo',
    aliases: [],
  },

  // ── RESORTS ──
  {
    id: 'costa-smeralda',
    name: 'Costa Smeralda',
    type: 'resort',
    province: 'SS',
    label: 'Costa Smeralda',
    aliases: ['smeralda', 'emerald coast'],
  },
  {
    id: 'is-molas',
    name: 'Is Molas',
    type: 'resort',
    province: 'CA',
    label: 'Is Molas Resort',
    aliases: ['is molas golf', 'molas'],
  },
  {
    id: 'forte-village',
    name: 'Forte Village',
    type: 'resort',
    province: 'CA',
    label: 'Forte Village Resort',
    aliases: ['forte village resort', 'forte village pula'],
  },
  {
    id: 'chia-laguna',
    name: 'Chia Laguna',
    type: 'resort',
    province: 'CA',
    label: 'Chia Laguna Resort',
    aliases: ['chia laguna resort'],
  },
  {
    id: 'tanka-village',
    name: 'Tanka Village',
    type: 'resort',
    province: 'CA',
    label: 'Tanka Village Resort',
    aliases: ['tanka village villasimius', 'tanka'],
  },
];

// Priority order for sorting search results
const TYPE_PRIORITY: Record<SardegnaLocation['type'], number> = {
  airport: 0,
  port: 1,
  city: 2,
  resort: 3,
  town: 4,
};

/**
 * Search locations by query string.
 * - Case insensitive, partial word matching (startsWith on each word)
 * - Returns max 8 results
 * - Empty query returns top locations (airports + cities)
 * - Prioritizes airports/ports, then cities, then resorts, then towns
 */
export function searchLocations(query: string): SardegnaLocation[] {
  const trimmed = query.trim().toLowerCase();

  // Empty query: return airports + cities as defaults
  if (!trimmed) {
    return [...SARDEGNA_LOCATIONS]
      .filter((loc) => loc.type === 'airport' || loc.type === 'city')
      .sort((a, b) => TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type])
      .slice(0, 8);
  }

  const queryWords = trimmed.split(/\s+/);

  const scored = SARDEGNA_LOCATIONS.map((loc) => {
    const searchableFields = [
      loc.name.toLowerCase(),
      loc.label.toLowerCase(),
      loc.province.toLowerCase(),
      ...loc.aliases.map((a) => a.toLowerCase()),
    ];

    const searchableText = searchableFields.join(' ');

    // Check that ALL query words match at least one field (startsWith on word boundaries)
    const allWordsMatch = queryWords.every((qw) => {
      // Check direct substring match in combined text
      if (searchableText.includes(qw)) return true;

      // Check startsWith on individual words in each field
      return searchableFields.some((field) => {
        const fieldWords = field.split(/\s+/);
        return fieldWords.some((fw) => fw.startsWith(qw));
      });
    });

    if (!allWordsMatch) return null;

    // Scoring: exact name match > starts with > alias match > partial
    let score = 0;
    const nameLower = loc.name.toLowerCase();

    if (nameLower === trimmed) {
      score = 100;
    } else if (nameLower.startsWith(trimmed)) {
      score = 80;
    } else if (searchableFields.some((f) => f === trimmed)) {
      score = 70;
    } else if (searchableFields.some((f) => f.startsWith(trimmed))) {
      score = 60;
    } else {
      score = 40;
    }

    // Bonus for type priority (airports/ports rank higher)
    score -= TYPE_PRIORITY[loc.type] * 2;

    return { loc, score };
  }).filter(Boolean) as { loc: SardegnaLocation; score: number }[];

  return scored
    .sort((a, b) => b.score - a.score || TYPE_PRIORITY[a.loc.type] - TYPE_PRIORITY[b.loc.type])
    .slice(0, 8)
    .map((s) => s.loc);
}
