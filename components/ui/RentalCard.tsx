import React from 'react';
import type { RentalItem } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../contexts/CurrencyContext';
import { motion } from 'framer-motion';

interface RentalCardProps {
  item: RentalItem;
  onBook: (item: RentalItem) => void;
}

const RentalCard: React.FC<RentalCardProps> = ({ item, onBook }) => {
  const { t, getTranslated } = useTranslation();
  const { currency } = useCurrency();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      variants={cardVariants}
      className="bg-stone-900/50 backdrop-blur-sm border border-stone-800 rounded-lg overflow-hidden group transition-all duration-300 hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/10"
    >
      <div className="relative overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
        <div className="grid grid-cols-3 gap-4 my-4 text-stone-300 text-sm">
          {item.specs.map((spec, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <spec.icon className="w-6 h-6 mb-1 text-amber-400" />
              <span className="font-semibold">{spec.value}</span>
              <span className="text-xs text-stone-400">{getTranslated(spec.label)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-6">
          <div>
            <span className="text-xl font-bold text-white">{formatPrice(item.pricePerDay[currency])}</span>
            <span className="text-sm text-stone-400 ml-1">/{t('per_day')}</span>
          </div>
          <button 
            onClick={() => onBook(item)}
            className="bg-transparent border-2 border-amber-400 text-amber-400 px-6 py-2 rounded-full font-semibold text-sm transform transition-all duration-300 group-hover:bg-amber-400 group-hover:text-black group-hover:scale-105"
          >
            {t('Book_Now')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default RentalCard;