import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import SEOHead from '../components/seo/SEOHead';
import BackButton from '../components/ui/BackButton';
import { FAQS, FaqEntry } from '../data/faqs';

const CATEGORY_LABEL: Record<FaqEntry['category'], { it: string; en: string }> = {
  rental: { it: 'Noleggio Auto', en: 'Car Rental' },
  requirements: { it: 'Requisiti e Documenti', en: 'Requirements & Documents' },
  pricing: { it: 'Prezzi e KM', en: 'Pricing & Mileage' },
  insurance: { it: 'Assicurazione e Cauzione', en: 'Insurance & Deposit' },
  cancellation: { it: 'Cancellazioni', en: 'Cancellations' },
  payment: { it: 'Pagamenti', en: 'Payments' },
  wash: { it: 'Prime Car Wash & Meccanica', en: 'Prime Car Wash & Mechanical' },
  club: { it: 'DR7 Club', en: 'DR7 Club' },
  yacht: { it: 'Yachting', en: 'Yachting' },
  jet: { it: 'Aviazione Privata', en: 'Private Aviation' },
  wallet: { it: 'DR7 Credit Wallet', en: 'DR7 Credit Wallet' },
};

const FAQPage: React.FC = () => {
  const { lang } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<FaqEntry['category'], FaqEntry[]>();
    FAQS.forEach((faq) => {
      const list = map.get(faq.category) ?? [];
      list.push(faq);
      map.set(faq.category, list);
    });
    return Array.from(map.entries());
  }, []);

  const faqJsonLd = useMemo(
    () => ({
      '@type': 'FAQPage',
      '@id': 'https://dr7empire.com/faq#page',
      mainEntity: FAQS.map((faq) => ({
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

  const seoTitle =
    lang === 'it'
      ? 'FAQ DR7 Empire | Domande frequenti su noleggio supercar, lavaggio e Club'
      : 'DR7 Empire FAQ | Supercar rental, car wash and Club questions';

  const seoDescription =
    lang === 'it'
      ? 'Tutte le risposte sul noleggio supercar in Sardegna, requisiti, KM, cauzione, assicurazione, Prime Car Wash, yachting, jet privato e DR7 Club.'
      : 'Everything you need to know about supercar rental in Sardinia, requirements, mileage, deposit, insurance, Prime Car Wash, yachting, private jets and the DR7 Club.';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black text-white min-h-screen pt-32 pb-24"
    >
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical="/faq"
        jsonLd={faqJsonLd}
      />

      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <BackButton to="/" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            {lang === 'it' ? 'Domande Frequenti' : 'Frequently Asked Questions'}
          </h1>
          <p className="text-center text-gray-400 max-w-2xl mx-auto mb-14">
            {lang === 'it'
              ? 'Le risposte alle domande più frequenti sul noleggio di supercar e auto di lusso in Sardegna, sui servizi Prime Car Wash, sullo yachting, sull’aviazione privata e sul DR7 Club.'
              : 'Answers to the most common questions about supercar and luxury car rental in Sardinia, Prime Car Wash, yachting, private aviation and the DR7 Club.'}
          </p>

          <div className="space-y-12">
            {grouped.map(([category, items]) => (
              <section key={category}>
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-3">
                  {CATEGORY_LABEL[category][lang]}
                </h2>
                <div className="space-y-3">
                  {items.map((faq) => {
                    const isOpen = openId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenId(isOpen ? null : faq.id)}
                          className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-900 transition-colors"
                          aria-expanded={isOpen}
                          aria-controls={`faq-${faq.id}`}
                        >
                          <h3 className="text-lg font-semibold text-white">
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
                              id={`faq-${faq.id}`}
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
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-16 text-center text-gray-400">
            <p>
              {lang === 'it'
                ? 'Non hai trovato la risposta che cercavi?'
                : 'Didn’t find the answer you were looking for?'}
            </p>
            <a
              href="/contact"
              className="inline-block mt-3 px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors rounded-md"
            >
              {lang === 'it' ? 'Contattaci' : 'Contact us'}
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FAQPage;
