import React from 'react';
import type { RentalItem } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../contexts/CurrencyContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface RentalCardProps {
  item: RentalItem;
  onBook: (item: RentalItem) => void;
  jetSearchData?: {
    departure?: string;
    arrival?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: number;
    tripType?: string;
  };
}

const RentalCard: React.FC<RentalCardProps> = ({ item, onBook, jetSearchData }) => {
  const { t, getTranslated } = useTranslation();
  const { currency } = useCurrency();

  const isVilla = item.id.startsWith('villa');
  const isJet = item.id.startsWith('jet');
  const isHelicopter = item.id.startsWith('heli');
  const isYacht = item.id.startsWith('yacht');
  const isQuoteRequest = isJet || isHelicopter;
  // Jets, yachts, and helicopters use landscape format, others use vertical format
  const imageAspectRatio = (isJet || isYacht || isHelicopter) ? 'aspect-[16/9]' : 'aspect-[9/16]';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleHelicopterQuote = () => {
    const message = encodeURIComponent(
      `Ciao! Sono interessato a prenotare ${item.name}. Potrebbe fornirmi un preventivo e i dettagli sulla disponibilità? Grazie!`
    );
    const whatsappUrl = `https://wa.me/393457905205?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleJetQuote = () => {
    let message = `Ciao! Sono interessato a prenotare ${item.name}.\n\n`;

    if (jetSearchData) {
      message += `Dettagli del volo:\n`;
      message += `• Tipo di viaggio: ${jetSearchData.tripType === 'round-trip' ? 'Andata e ritorno' : 'Solo andata'}\n`;
      if (jetSearchData.departure) message += `• Partenza: ${jetSearchData.departure}\n`;
      if (jetSearchData.arrival) message += `• Arrivo: ${jetSearchData.arrival}\n`;
      if (jetSearchData.departureDate) message += `• Data di partenza: ${jetSearchData.departureDate}\n`;
      if (jetSearchData.returnDate && jetSearchData.tripType === 'round-trip') {
        message += `• Data di ritorno: ${jetSearchData.returnDate}\n`;
      }
      if (jetSearchData.passengers) message += `• Passeggeri: ${jetSearchData.passengers}\n`;
      message += `\n`;
    }

    message += `Potrebbe fornirmi un preventivo? Grazie!`;

    const whatsappUrl = `https://wa.me/393457905205?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
        <img src={item.image} alt={item.name} className={`w-full ${imageAspectRatio} object-cover transition-transform duration-500`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-center mt-auto pt-4">
          <div>
            {item.available !== false && item.pricePerDay && !isYacht ? (
              <>
                <span className="text-xl font-bold text-white">{formatPrice(item.pricePerDay[currency])}</span>
                <span className="text-sm text-gray-400 ml-1">/{t('per_day')}</span>
              </>
            ) : (
              isQuoteRequest && <span className="text-lg font-semibold text-white">{t('Quote_by_request')}</span>
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
              onClick={() => {
                if (isHelicopter) handleHelicopterQuote();
                else if (isJet) handleJetQuote();
                else onBook(item);
              }}
              disabled={item.available === false}
              className="bg-transparent border-2 border-white text-white px-6 py-2 rounded-full font-semibold text-sm transform transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:scale-105 disabled:bg-gray-700 disabled:border-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:scale-100"
            >
              {item.available === false ? t('Back_Soon') : (isQuoteRequest ? t('Request_Quote') : t('Book_Now'))}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RentalCard;