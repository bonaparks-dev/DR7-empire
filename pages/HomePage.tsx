import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { RENTAL_CATEGORIES } from '../constants';
import { motion } from 'framer-motion';

// Optional: if you want to map category ids to specific display titles
const DISPLAY_TITLE: Record<string, string> = {
  cars: 'Cars',
  yachts: 'Yachts',
  villas: 'Villas',
  helicopters: 'Helicopters',
  jets: 'Private Jets',
};

// Map category ids to video filenames in /public
const CATEGORY_VIDEO: Record<string, string> = {
  cars: '/cars1.mp4',
  yachts: '/yacht.mp4',
  villas: '/villa1.mp4',
  helicopters: '/helicopter1.mp4',
  jets: '/privatejet.mp4',
};

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="relative h-screen flex items-center justify-center text-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          src="/main.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover brightness-[.65]"
        />
        {/* Lighter black overlay */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Text Overlay */}
      <div className="relative z-10 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-6xl font-bold text-white uppercase tracking-wider font-exo2"
        >
          {t('Welcome_to_DR7_Empire')}
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-2xl md:text-4xl font-light text-white mt-2 font-exo2"
        >
          {t('Experience_Exclusivity')}
        </motion.h2>
      </div>
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

      <section className="py-24 relative bg-black">
        <div className="absolute inset-0 z-0">
          <img
            src="https://picsum.photos/seed/lamborghini-revuelto-prize/1920/1080"
            alt="Lottery background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-black/70"></div>
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-white font-exo2"
          >
            {t('Lottery_DR7')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto"
          >
            {t('Win_your_dream_car_and_more')}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-2 text-lg text-gray-400 max-w-2xl mx-auto"
          >
            {t(
              'DR7_is_your_gateway_to_a_world_of_unparalleled_luxury_From_supercars_to_private_jets_we_provide_access_to_the_extraordinary'
            )}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <Link
              to="/lottery"
              className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
            >
              {t('Enter_Now')}
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {RENTAL_CATEGORIES.map((category, index) => {
              const videoSrc = CATEGORY_VIDEO[category.id as keyof typeof CATEGORY_VIDEO];
              const displayTitle =
                DISPLAY_TITLE[category.id as keyof typeof DISPLAY_TITLE] || getTranslated(category.label);

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
                    {videoSrc ? (
                      <video
                        src={videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster={category.data?.[0]?.image}
                        className={`w-full ${isFeatured ? 'h-[40rem]' : 'h-96'} object-cover brightness-75 group-hover:brightness-100 transition-all duration-500 group-hover:scale-110`}
                      />
                    ) : (
                      <img
                        src={category.data[0].image}
                        alt={displayTitle}
                        className={`w-full ${isFeatured ? 'h-[40rem]' : 'h-96'} object-cover brightness-75 group-hover:brightness-100 transition-all duration-500 group-hover:scale-110`}
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-8">
                      <h3 className="text-3xl font-bold text-white font-exo2">
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

      <section className="py-24 bg-gray-900/40">
        <div className="container mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-white font-exo2"
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
            {t(
              'Unlock_a_new_level_of_luxury_with_our_exclusive_membership_tiers'
            )}
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