/**
 * FlottaIndexPage — landing pubblica "La Nostra Flotta".
 *
 * Mostra TUTTI i veicoli delle categorie selezionate in admin >
 * Sito > Flotta, raggruppati per categoria. Ogni veicolo e' una
 * card con foto, nome e prezzo giornaliero — tap per andare al
 * dettaglio/booking.
 *
 * Sorgenti:
 *   - useFlottaCategories: lista categorie ticked in admin
 *   - useVehicles(undefined): TUTTI i veicoli, filtrati lato client
 *     per categoria selezionata.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFlottaCategories } from '../hooks/useFlottaCategories';
import { useVehicles } from '../hooks/useVehicles';
import { useTranslation } from '../hooks/useTranslation';

// Alias storici categoria DB ↔ id slug usato in URL/Centralina Pro.
// Stessa logica di useVehicles per coerenza.
const CATEGORY_ALIASES: Record<string, string[]> = {
  exotic: ['exotic', 'supercars'],
  supercars: ['exotic', 'supercars'],
};

const FlottaIndexPage: React.FC = () => {
  const { lang } = useTranslation();
  const { categories: flottaCats, loading: catsLoading } = useFlottaCategories();
  const { vehicles: allVehicles, loading: vehLoading } = useVehicles(undefined);

  // Veicoli filtrati per categoria selezionata, raggruppati.
  const groups = useMemo(() => {
    const out: Array<{ id: string; label: string; path: string; vehicles: typeof allVehicles }> = [];
    for (const cat of flottaCats) {
      const aliases = CATEGORY_ALIASES[cat.id] || [cat.id];
      const aliasSet = new Set(aliases.map(a => a.toLowerCase()));
      const list = allVehicles.filter(v => {
        const c = (v.category || '').toLowerCase();
        return aliasSet.has(c);
      });
      out.push({ id: cat.id, label: cat.label, path: cat.path, vehicles: list });
    }
    return out;
  }, [flottaCats, allVehicles]);

  const totalCount = useMemo(() => groups.reduce((s, g) => s + g.vehicles.length, 0), [groups]);

  const isLoading = catsLoading || vehLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-32 pb-24 bg-black min-h-screen"
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            {lang === 'it' ? 'La Nostra Flotta' : 'Our Fleet'}
          </h1>
          <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
            {lang === 'it'
              ? 'Scegli il tuo veicolo dalla nostra flotta esclusiva.'
              : 'Pick your vehicle from our exclusive fleet.'}
          </p>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-400">…</p>
        ) : totalCount === 0 ? (
          <p className="text-center text-gray-400">
            {lang === 'it'
              ? 'Nessun veicolo disponibile al momento.'
              : 'No vehicles available right now.'}
          </p>
        ) : (
          <div className="space-y-16">
            {groups.map((group) => (
              <section key={group.id}>
                <div className="flex items-baseline justify-between mb-6 border-b border-white/10 pb-3">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{group.label}</h2>
                  <Link to={group.path} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {lang === 'it' ? 'Vedi tutti →' : 'See all →'}
                  </Link>
                </div>

                {group.vehicles.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    {lang === 'it'
                      ? 'Nessun veicolo in questa categoria al momento.'
                      : 'No vehicles in this category yet.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.vehicles.map((v, index) => (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.4, delay: index * 0.04 }}
                      >
                        <Link
                          to={group.path}
                          className="block bg-gray-900 rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-colors group"
                        >
                          <div className="relative h-56 bg-black overflow-hidden">
                            <img
                              src={v.image || '/placeholder.jpeg'}
                              alt={v.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-5">
                            <h3 className="text-lg font-semibold text-white truncate" title={v.name}>{v.name}</h3>
                            {v.price > 0 && (
                              <div className="mt-3">
                                <span className="text-2xl font-bold text-white">€{v.price}</span>
                                <span className="text-gray-400 text-xs ml-1">/{lang === 'it' ? 'giorno' : 'day'}</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FlottaIndexPage;
