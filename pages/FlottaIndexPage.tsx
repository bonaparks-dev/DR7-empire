/**
 * FlottaIndexPage — landing pubblica "La Nostra Flotta".
 *
 * Mostra una card cliccabile per ciascuna categoria selezionata in
 * admin > Sito > Flotta. La label viene da Centralina Pro
 * (categories[].label) e l'immagine, se presente, dall'override
 * salvato nella sezione Home (site_copy.home.categories[id].image_src).
 *
 * Tappando una card si va alla rispettiva route /<categoryId>, che
 * renderizza la lista veicoli filtrata da useVehicles(categoryId).
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFlottaCategories } from '../hooks/useFlottaCategories';
import { useTranslation } from '../hooks/useTranslation';
import { RENTAL_CATEGORIES } from '../constants';
import { getHomeCopy, type HomeCopy } from '../utils/siteCopy';

const FlottaIndexPage: React.FC = () => {
  const { lang, getTranslated } = useTranslation();
  const { categories: flottaCats, loading } = useFlottaCategories();
  const [homeCopy, setHomeCopy] = useState<HomeCopy | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHomeCopy().then((c) => { if (!cancelled) setHomeCopy(c); });
    return () => { cancelled = true; };
  }, []);

  const overridesById = React.useMemo(() => {
    const map = new Map<string, { title_it: string; title_en: string; image: string }>();
    if (!homeCopy) return map;
    for (const c of homeCopy.categories) {
      map.set(c.id, { title_it: c.display_title_it, title_en: c.display_title_en, image: c.image_src });
    }
    return map;
  }, [homeCopy]);

  type Card = { id: string; label: string; image: string; path: string };

  const cards: Card[] = React.useMemo(() => {
    return flottaCats.map(c => {
      const legacy = RENTAL_CATEGORIES.find(r => r.id === c.id);
      const override = overridesById.get(c.id);
      return {
        id: c.id,
        label: override
          ? (lang === 'it' ? override.title_it : override.title_en)
          : legacy
            ? getTranslated(legacy.label)
            : c.label,
        image: override?.image
          || legacy?.data?.[0]?.image
          || '/placeholder.jpeg',
        path: c.path,
      };
    });
  }, [flottaCats, overridesById, lang, getTranslated]);

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
              ? 'Scegli la categoria che fa per te.'
              : 'Choose the category that fits you.'}
          </p>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">…</p>
        ) : cards.length === 0 ? (
          <p className="text-center text-gray-400">
            {lang === 'it'
              ? 'Nessuna categoria pubblicata al momento.'
              : 'No categories published right now.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  to={card.path}
                  className="block group relative rounded-xl overflow-hidden h-80"
                >
                  <img
                    src={card.image}
                    alt={card.label}
                    className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <h3 className="text-2xl font-bold text-white">{card.label}</h3>
                    <p className="text-gray-300 text-sm mt-1">
                      {lang === 'it' ? 'Scopri →' : 'Discover →'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FlottaIndexPage;
