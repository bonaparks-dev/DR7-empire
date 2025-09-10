import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { HOME_PAGE_SERVICES } from '../constants';
import { motion } from 'framer-motion';

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="relative h-screen flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img src="/DR7logo.png" alt="Luxury Lifestyle" className="w-full h-full object-cover brightness-50" />
            <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative z-10 px-4">
            <motion.h1 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-8xl font-black text-white uppercase tracking-wider"
            >
                {t('Experience_Exclusivity')}
            </motion.h1>
            <motion.h2 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-3xl md:text-6xl font-light text-amber-400 mt-2"
            >
                {t('Redefined_Luxury')}
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
            <img src='https://picsum.photos/seed/revuelto/1920/1080' alt="Lottery background" className="w-full h-full object-cover opacity-30"/>
            <div className="absolute inset-0 bg-black/70"></div>
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold text-white">{t('Lottery_DR7')}</motion.h2>
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-4 text-lg text-amber-300 max-w-2xl mx-auto">{t('Win_your_dream_car_and_more')}</motion.p>
             <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-2 text-lg text-stone-400 max-w-2xl mx-auto">{t('DR7_is_your_gateway_to_a_world_of_unparalleled_luxury_From_supercars_to_jets_we_provide_access_to_the_extraordinary')}</motion.p>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8"
            >
                <Link to="/lottery" className="bg-amber-400 text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-amber-300 transition-all duration-300 transform hover:scale-105">
                    {t('Enter_Now')}
                </Link>
            </motion.div>
        </div>
      </section>

      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {HOME_PAGE_SERVICES.map((service, index) => (
                <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                    <Link to={service.link} className="block group relative rounded-lg overflow-hidden h-96">
                        <img src={service.image} alt={getTranslated(service.label)} className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-8">
                            <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-4">
                                <service.icon className="w-10 h-10 text-amber-400 opacity-80 group-hover:opacity-100" />
                                <h3 className="text-3xl font-bold text-white mt-2">{getTranslated(service.label)}</h3>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default HomePage;
