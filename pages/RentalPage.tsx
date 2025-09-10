import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RENTAL_CATEGORIES } from '../constants';
import type { RentalItem } from '../types';
import RentalCard from '../components/ui/RentalCard';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { motion, useScroll, useTransform } from 'framer-motion';

interface RentalPageProps {
  categoryId: 'cars' | 'yachts' | 'villas' | 'jets' | 'helicopters';
}

const RentalPage: React.FC<RentalPageProps> = ({ categoryId }) => {
  const { t, getTranslated } = useTranslation();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const category = RENTAL_CATEGORIES.find(cat => cat.id === categoryId);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
      target: heroRef,
      offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const handleBook = (item: RentalItem) => {
    if (!isLoggedIn) {
      navigate('/signin', { state: { from: location } });
      return;
    }
      
    navigate(`/book/${categoryId}/${item.id}`);
  };

  if (!category) {
    return <div className="pt-32 text-center text-white">Category not found.</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const heroImage = category.data[0]?.image || 'https://picsum.photos/seed/default-hero/1920/1080';
  
  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div ref={heroRef} className="relative h-[60vh] flex items-center justify-center text-center overflow-hidden">
            <motion.div className="absolute inset-0 z-0" style={{ y }}>
                <img src={heroImage} alt={getTranslated(category.label)} className="w-full h-full object-cover brightness-50" />
                <div className="absolute inset-0 bg-black/60"></div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative z-10"
            >
                <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-wider">
                    {t('Our_Collection_of')}
                </h1>
                <p className="text-3xl md:text-5xl font-light text-amber-400 mt-2">{getTranslated(category.label)}</p>
            </motion.div>
        </div>

        <div className="py-24 bg-black">
            <div className="container mx-auto px-6">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {category.data.map(item => (
                        <RentalCard key={item.id} item={item} onBook={handleBook} />
                    ))}
                </motion.div>
            </div>
        </div>
    </motion.div>
  );
};

export default RentalPage;