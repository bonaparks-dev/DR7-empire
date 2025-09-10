import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RENTAL_CATEGORIES } from '../constants';
import type { RentalItem } from '../types';
import RentalCard from '../components/ui/RentalCard';
import { useTranslation } from '../hooks/useTranslation';
import { useBooking } from '../hooks/useBooking';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

interface RentalPageProps {
  categoryId: 'cars' | 'yachts' | 'villas' | 'jets' | 'helicopters';
}

const RentalPage: React.FC<RentalPageProps> = ({ categoryId }) => {
  const { t, getTranslated } = useTranslation();
  const { openBooking } = useBooking();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const category = RENTAL_CATEGORIES.find(cat => cat.id === categoryId);

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
  
  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="pt-32 pb-24 bg-black">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
                        {t('Our_Collection_of')} <span className="text-amber-400">{getTranslated(category.label)}</span>
                    </h1>
                </motion.div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12"
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