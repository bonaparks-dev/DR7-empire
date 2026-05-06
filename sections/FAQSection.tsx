import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { HOMEPAGE_FAQS } from '../data/faqs';

// Compact homepage FAQ block. Renders the questions flagged `homepage: true`
// in data/faqs.ts and embeds an FAQPage JSON-LD schema scoped to those items
// so the homepage itself is eligible for Google FAQ rich results.

const FAQSection: React.FC = () => {
  const { lang } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(HOMEPAGE_FAQS[0]?.id ?? null);

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': 'https://dr7empire.com/#faq',
      mainEntity: HOMEPAGE_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question[lang],
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer[lang],
        },
      })),
    }),
    [lang]
  );

  return (
    <section className="py-24 bg-black border-t border-gray-900">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {lang === 'it'
                ? 'Domande frequenti su DR7 Empire'
                : 'DR7 Empire frequently asked questions'}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {lang === 'it'
                ? 'Noleggio supercar in Sardegna, requisiti, KM, cauzione e Prime Car Wash: le risposte rapide.'
                : 'Supercar rental in Sardinia, requirements, mileage, deposit and Prime Car Wash — quick answers.'}
            </p>
          </div>

          <div className="space-y-3">
            {HOMEPAGE_FAQS.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4 }}
                  className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-900 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`home-faq-${faq.id}`}
                  >
                    <h3 className="text-base md:text-lg font-semibold text-white">
                      {faq.question[lang]}
                    </h3>
                    <span
                      className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-white transition-transform ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`home-faq-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-gray-300 leading-relaxed">
                          {faq.answer[lang]}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/faq"
              className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors rounded-md"
            >
              {lang === 'it' ? 'Vedi tutte le FAQ' : 'See all FAQs'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
