import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { RENTAL_CATEGORIES, COMMERCIAL_OPERATION_GIVEAWAY } from '../constants';
import { motion } from 'framer-motion';

// Optional: if you want to map category ids to specific display titles
const DISPLAY_TITLE: Record<string, string> = {
  cars: 'Exotic Supercars',
  yachts: 'Yachts',
  villas: 'Villas',
  helicopters: 'Helicopters',
  jets: 'Private Jets',
  'car-wash-services': 'Lavaggio',
  membership: 'Membership',
};

// Map category ids to image filenames in /public
const CATEGORY_IMAGE: Record<string, string> = {
  cars: '/car.jpeg',
  yachts: '/yacht.jpeg',
  villas: '/villa.jpeg',
  helicopters: '/helicopter.jpeg',
  jets: '/privatejet.jpeg',
  'car-wash-services': '/car.jpeg',
  membership: '/main.jpeg',
};

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="relative h-screen flex items-center justify-center text-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/main.jpeg"
          alt="Background"
          className="w-full h-full object-cover brightness-[.65]"
        />
        {/* Lighter black overlay */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Text Overlay has been removed as per user request. */}
    </div>
  );
};

const HomePage: React.FC = () => {
  const { t, getTranslated } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <HeroSection />

      {/* ===== Giveaway Section (fixed tag structure) ===== */}
      <section className="py-24 relative bg-black">
        <div className="absolute inset-0 bg-black/70" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-white"
          >
            {getTranslated(COMMERCIAL_OPERATION_GIVEAWAY.name)}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <Link
              to="/commercial-operation"
              className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
            >
              {t('Enter_Now')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== Categories Section ===== */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {RENTAL_CATEGORIES.map((category, index) => {
              const imageSrc =
                CATEGORY_IMAGE[category.id as keyof typeof CATEGORY_IMAGE] ||
                category.data?.[0]?.image ||
                '/placeholder.jpeg';

              const displayTitle =
                DISPLAY_TITLE[category.id as keyof typeof DISPLAY_TITLE] ||
                getTranslated(category.label);

              const isFeatured = index === 0;

              return (
                <motion.div
                  key={category.id}
                  className={isFeatured ? 'md:col-span-2' : ''}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link
                    to={`/${category.id}`}
                    className="block group relative rounded-lg overflow-hidden"
                  >
                    <img
                      src={imageSrc}
                      alt={displayTitle}
                      className={`w-full ${isFeatured ? 'h-[40rem]' : 'h-96'} object-cover brightness-75 group-hover:brightness-100 transition-all duration-500 group-hover:scale-110`}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8">
                      <h3 className="text-3xl font-bold text-white">
                        {displayTitle}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Membership Section ===== */}
      <section className="py-24 bg-gray-900/40">
        <div className="container mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-white"
          >
            {t('The_DR7_Club')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto"
          >
            {t('Unlock_a_new_level_of_luxury_with_our_exclusive_membership_tiers')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <Link
              to="/membership"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105"
            >
              {t('View_Tiers')}
            </Link>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default HomePage;
