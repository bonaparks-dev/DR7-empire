import React from 'react';
import type { RentalItem } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../contexts/CurrencyContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface RentalCardProps {
  item: RentalItem;
  onBook: (item: RentalItem) => void;
}

const RentalCard: React.FC<RentalCardProps> = ({ item, onBook }) => {
  const { t, getTranslated } = useTranslation();
  const { currency } = useCurrency();

  const isVilla = item.id.startsWith('villa');
  const isQuoteRequest = item.id.startsWith('jet') || item.id.startsWith('heli');
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden group transition-all duration-300 hover:border-white/50 hover:shadow-2xl hover:shadow-white/10 flex flex-col"
    >
      <div className="relative overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
        <div className="grid grid-cols-3 gap-4 my-4 text-gray-300 text-sm">
          {item.specs.map((spec, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <spec.icon className="w-6 h-6 mb-1 text-white" />
              <span className="font-semibold">{spec.value}</span>
              <span className="text-xs text-gray-400">{getTranslated(spec.label)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-800">
          <div>
            {item.pricePerDay ? (
              <>
                <span className="text-xl font-bold text-white">{formatPrice(item.pricePerDay[currency])}</span>
                <span className="text-sm text-gray-400 ml-1">/{t('per_day')}</span>
              </>
            ) : (
                 <span className="text-lg font-semibold text-white">{t('Quote_by_request')}</span>
            )}
          </div>
           {isVilla ? (
            <Link 
              to={`/villas/${item.id}`}
              className="bg-transparent border-2 border-white text-white px-6 py-2 rounded-full font-semibold text-sm transform transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:scale-105"
            >
              {t('Discover_More')}
            </Link>
          ) : (
            <button 
              onClick={() => onBook(item)}
              className="bg-transparent border-2 border-white text-white px-6 py-2 rounded-full font-semibold text-sm transform transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:scale-105"
            >
              {isQuoteRequest ? t('Request_Quote') : t('Book_Now')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RentalCard;