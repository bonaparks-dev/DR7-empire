


import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RENTAL_CATEGORIES, VILLA_SERVICE_FEE_PERCENTAGE } from '../constants';
import { useTranslation } from '../hooks/useTranslation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { 
    ArrowLeftIcon, MapPinIcon, UsersIcon, BedIcon, BathIcon, MinusIcon, PlusIcon, Building2Icon
} from '../components/icons/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../contexts/CurrencyContext';
import { Button } from '../components/ui/Button';
import { useVerification } from '../hooks/useVerification';

export default function VillaDetailsPage() {
  const { villaId } = useParams<{ villaId: string }>();
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { currency } = useCurrency();
  const { checkVerificationAndProceed } = useVerification();
  
  const villa = useMemo(() => {
    return RENTAL_CATEGORIES.find(c => c.id === 'villas')?.data.find(v => v.id === villaId);
  }, [villaId]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const today = new Date().toISOString().split('T')[0];

  const { nights, subtotal, serviceFee, total } = useMemo(() => {
    if (checkIn && checkOut && villa?.pricePerDay) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (start >= end) return { nights: 0, subtotal: 0, serviceFee: 0, total: 0 };

        const diffTime = end.getTime() - start.getTime();
        const numNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const pricePerNight = villa.pricePerDay[currency];
        const calcSubtotal = numNights * pricePerNight;
        const calcServiceFee = calcSubtotal * VILLA_SERVICE_FEE_PERCENTAGE;
        const calcTotal = calcSubtotal + calcServiceFee;

        return { nights: numNights, subtotal: calcSubtotal, serviceFee: calcServiceFee, total: calcTotal };
    }
    return { nights: 0, subtotal: 0, serviceFee: 0, total: 0 };
  }, [checkIn, checkOut, villa, currency]);

  const formatPrice = (price: number, fractionDigits = 2) => {
    return new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(price);
  };

  const handleReserve = () => {
    if (nights > 0 && villa) {
        checkVerificationAndProceed(() => {
            navigate(`/book/villas/${villa.id}`, {
                state: {
                    checkinDate: checkIn,
                    checkoutDate: checkOut,
                    guests,
                }
            });
        });
    }
  };

  if (!villa) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
            <p className="pt-32">Villa not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % (villa.images?.length || 1));
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + (villa.images?.length || 1)) % (villa.images?.length || 1));

  const mainImage = villa.images?.[currentImageIndex] || villa.image;
  const villaDescription = villa.description ? villa.description[lang] : '';

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-black text-white"
    >
      <Header />

      <button
        onClick={() => navigate("/villas")}
        className="fixed top-24 left-4 z-40 bg-black/50 text-white border border-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full px-4 py-2 flex items-center text-sm font-semibold"
        aria-label={t('Back')}
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        {t('Back')}
      </button>

      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{villa.name}</h1>
            <div className="flex items-center gap-2 text-gray-400"><MapPinIcon className="w-5 h-5" /><span>{villa.location}</span></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2">
              <div className="relative mb-8">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-900">
                  <AnimatePresence>
                      <motion.img
                          key={mainImage}
                          src={mainImage}
                          alt={villa.name}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="w-full h-full object-cover"
                      />
                  </AnimatePresence>
                </div>
                <div className="flex justify-center mt-4 space-x-2">
                  {villa.images?.map((_, index) => (
                    <button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-3 h-3 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/50'}`} aria-label={`View image ${index + 1}`} />
                  ))}
                </div>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors" aria-label="Previous image"><ArrowLeftIcon className="w-5 h-5" /></button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors" aria-label="Next image"><ArrowLeftIcon className="w-5 h-5 rotate-180" /></button>
                <div className="absolute top-4 left-4 bg-white/90 text-black text-xs font-bold px-3 py-1 rounded-full">{villa.distanceToBeach}</div>
              </div>

              <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-6 border-y border-gray-800 py-4">
                {villa.specs.map(spec => {
                  const Icon = spec.icon;
                  return <div key={spec.label.en} className="flex items-center gap-2 text-gray-300"><Icon className="w-5 h-5 text-white" /><span>{spec.value} {t(spec.label.en as any)}</span></div>
                })}
                {villa.size && <div className="flex items-center gap-2 text-gray-300"><Building2Icon className="w-5 h-5 text-white" /><span>{villa.size}</span></div>}
              </div>

              <p className="text-lg text-gray-300 mb-8 leading-relaxed">{villaDescription}</p>
              
              {villa.amenities && villa.features ? (
                <>
                  <div className="mb-12"><h2 className="text-3xl font-bold mb-8">{t('amenities.comfort')}</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{villa.amenities.map((amenity, index) => (<div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"><amenity.icon className="w-8 h-8 mb-4 text-white" /><h3 className="text-xl font-semibold mb-2">{amenity.title[lang]}</h3><p className="text-gray-400">{amenity.description[lang]}</p></div>))}</div></div>
                  {/* FIX: Removed unnecessary 'as any' type assertion to improve type safety. */}
                  <div className="mb-12"><h2 className="text-3xl font-bold mb-8">{t('features.title')}</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">{villa.features[lang].map((feature: string, index: number) => (<div key={index} className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div><span>{feature}</span></div>))}</div></div>
                </>
              ) : (
                <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-lg">
                    <h2 className="text-2xl font-bold text-white">More Information Coming Soon</h2>
                    <p className="text-gray-400 mt-2">Detailed information for this villa is being prepared.</p>
                </div>
              )}
            </div>

            <aside className="lg:col-span-1">
              <div className="lg:sticky top-32">
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 shadow-2xl">
                  {villa.pricePerDay ? (
                    <>
                      <div className="mb-4">
                        <span className="text-3xl font-bold">{formatPrice(villa.pricePerDay[currency], 0)}</span>
                        <span className="text-gray-400"> / {t('Night')}</span>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-400 block">{t('Check_in_Date')}</label>
                            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={today} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block">{t('Check_out_Date')}</label>
                            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || today} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">{t('Number_of_Guests')}</label>
                          <div className="flex items-center justify-between bg-gray-800 border-gray-700 rounded-md p-2">
                            <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600" aria-label="Decrease guests"><MinusIcon className="w-4 h-4" /></button>
                            <span className="text-base font-medium px-4 w-12 text-center">{guests}</span>
                            {/* FIX: Convert spec value string to number for Math.min */}
                            <button type="button" onClick={() => setGuests(Math.min(parseInt(villa.specs.find(s => s.label.en === 'Guests')?.value || '1', 10), guests + 1))} className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600" aria-label="Increase guests"><PlusIcon className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                      
                      <Button onClick={handleReserve} disabled={nights <= 0} className="w-full mt-6" variant="primary" size="lg">
                        {t('Reserve')}
                      </Button>

                      {nights > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-800 space-y-2 text-sm">
                          <div className="flex justify-between text-gray-300">
                            <span>{formatPrice(villa.pricePerDay[currency], 0)} x {nights} {t('nights')}</span>
                            <span>{formatPrice(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-gray-300">
                            <span>{t('Service_Fee')}</span>
                            <span>{formatPrice(serviceFee)}</span>
                          </div>
                          <div className="border-t border-gray-700 my-2"></div>
                          <div className="flex justify-between font-bold text-white text-base">
                            <span>{t('Total')}</span>
                            <span>{formatPrice(total)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                       <h2 className="text-2xl font-bold mb-4">{t('dream.vacation.title')}</h2>
                       <p className="text-gray-300 mb-6">{t('dream.vacation.desc')}</p>
                       <Button onClick={() => window.open(`https://wa.me/393457905205`, "_blank")} variant="primary" size="lg">{t('contact.us')}</Button>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}