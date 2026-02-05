import React from 'react';
import type { RentalItem } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface RentalCardProps {
  item: RentalItem;
  onBook: (item: RentalItem) => void;
  marketingPrice?: number;
  jetSearchData?: {
    departure?: string;
    arrival?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: number;
    tripType?: string;
  };
}

const RentalCard: React.FC<RentalCardProps> = ({ item, onBook, marketingPrice, jetSearchData }) => {
  const { t, getTranslated } = useTranslation();
  const { currency } = useCurrency();
  const { user } = useAuth();

  const isVilla = item.id.startsWith('villa');
  const isJet = item.id.startsWith('jet');
  const isHelicopter = item.id.startsWith('heli');
  const isYacht = item.id.startsWith('yacht');
  const isCar = item.id.startsWith('car-');
  const isM4 = item.name?.toLowerCase().includes('m4');

  // Jets, yachts, and helicopters use landscape format, others use vertical format
  const imageAspectRatio = (isJet || isYacht || isHelicopter) ? 'aspect-[16/9]' : 'aspect-[9/16]';

  // Determine user's residency zone (treat null as NON_RESIDENTE)
  const userResidencyZone = (user as any)?.residencyZone || 'NON_RESIDENTE';
  const isResident = userResidencyZone === 'RESIDENTE_CAGLIARI_SUD_SARDEGNA' || userResidencyZone === 'RESIDENTE_CA' || userResidencyZone === 'RESIDENTE_SU';

  // Check if dual pricing is available for this vehicle
  const hasDualPricing = isCar && item.priceResidentDaily && item.priceNonresidentDaily;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleJetQuote = () => {
    let message = `Ciao! Sono interessato a prenotare ${item.name}.\\n\\n`;

    if (jetSearchData) {
      message += `Dettagli del volo:\\n`;
      message += `• Tipo di viaggio: ${jetSearchData.tripType === 'round-trip' ? 'Andata e ritorno' : 'Solo andata'}\\n`;
      if (jetSearchData.departure) message += `• Partenza: ${jetSearchData.departure}\\n`;
      if (jetSearchData.arrival) message += `• Arrivo: ${jetSearchData.arrival}\\n`;
      if (jetSearchData.departureDate) message += `• Data di partenza: ${jetSearchData.departureDate}\\n`;
      if (jetSearchData.returnDate && jetSearchData.tripType === 'round-trip') {
        message += `• Data di ritorno: ${jetSearchData.returnDate}\\n`;
      }
      if (jetSearchData.passengers) message += `• Passeggeri: ${jetSearchData.passengers}\\n`;
      message += `\\n`;
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
      <div className="px-6 pt-6 pb-4 flex-grow flex flex-col">
        <div className="mt-auto space-y-2">
          <div>
            {marketingPrice ? (
              // Marketing "Da X/giorno" display
              <div>
                <span className="text-sm text-gray-400">Da </span>
                <span className="text-2xl font-bold text-white">{formatPrice(marketingPrice)}</span>
                <span className="text-sm text-gray-400 ml-1">/{t('per_day')}</span>
              </div>
            ) : hasDualPricing ? (
              // Dual pricing display for cars with residency-based rates
              // Always show CHEAPER price (resident) as LARGER text
              <div className="space-y-0.5">
                <div className={`flex items-baseline gap-2 ${isResident ? 'text-yellow-400' : 'text-white'}`}>
                  <span className="text-2xl font-bold">
                    {formatPrice(item.priceResidentDaily!)}/giorno
                  </span>
                  <span className="text-xs uppercase tracking-wide">Residenti</span>
                </div>
                <div className={`flex items-baseline gap-2 text-gray-400`}>
                  <span className="text-base">
                    {formatPrice(item.priceNonresidentDaily!)}/giorno
                  </span>
                  <span className="text-xs uppercase tracking-wide">Non Residenti</span>
                </div>
                {!user && (
                  <p className="text-xs text-gray-400 mt-1.5 leading-tight">
                    Accedi per applicare automaticamente la tariffa corretta.
                  </p>
                )}
              </div>
            ) : item.pricePerDay && !isYacht ? (
              // Standard single pricing
              <>
                <span className="text-xl font-bold text-white">{formatPrice(item.pricePerDay[currency])}</span>
                <span className="text-sm text-gray-400 ml-1">/{t('per_day')}</span>
              </>
            ) : null}
          </div>
          {/* Insurance Indicator */}
          {isCar && (
            <div className="flex items-center text-xs text-green-400">
              <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Assicurazione inclusa</span>
            </div>
          )}
        </div>
        <div className="mt-3">
          {isVilla ? (
            <Link
              to={`/villas/${item.id}`}
              className="bg-transparent border-2 border-white text-white px-6 py-2 rounded-full font-semibold text-sm transform transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:scale-105"
            >
              {t('Discover_More')}
            </Link>
          ) : isM4 ? (
            <span className="inline-block bg-transparent border-2 border-gray-600 text-gray-500 px-6 py-2 rounded-full font-semibold text-sm cursor-not-allowed">
              Non disponibile
            </span>
          ) : (
            <button
              onClick={() => {
                console.log('RentalCard button clicked for:', item.name, 'ID:', item.id, 'isJet:', isJet);
                if (isJet) handleJetQuote();
                else {
                  console.log('Calling onBook with item:', item);
                  onBook(item);
                }
              }}
              className="bg-transparent border-2 border-white text-white px-6 py-2 rounded-full font-semibold text-sm transform transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:scale-105 whitespace-nowrap"
            >
              {t('Book_Now')}
            </button>
          )}
        </div>
      </div>
    </motion.div >
  );
};

export default RentalCard;