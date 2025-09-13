import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RENTAL_CATEGORIES } from '../constants';
import { useTranslation } from '../hooks/useTranslation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { 
    ArrowLeftIcon, MapPinIcon, UsersIcon, BedIcon, BathIcon, WifiIcon, CarIcon, Building2Icon, 
    HomeIcon, CrownIcon, ShieldIcon, CalendarIcon, MessageCircleIcon, MinusIcon, PlusIcon 
} from '../components/icons/Icons';
import { motion } from 'framer-motion';

export default function VillaDetailsPage() {
  const { villaId } = useParams<{ villaId: string }>();
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  
  const villa = useMemo(() => {
    const villaCategory = RENTAL_CATEGORIES.find(cat => cat.id === 'villas');
    return villaCategory?.data.find(v => v.id === villaId);
  }, [villaId]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState(2);

  if (!villa) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Header />
        <p className="pt-32">Villa not found.</p>
        <Footer />
      </div>
    );
  }

  const hasDetailedInfo = !!villa.amenities;

  const nextImage = () => {
    const images = villa.images || [villa.image];
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = villa.images || [villa.image];
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const generateWhatsAppMessage = () => {
    const checkInDate = checkIn ? new Date(checkIn).toLocaleDateString('en-GB') : 'Not specified';
    const checkOutDate = checkOut ? new Date(checkOut).toLocaleDateString('en-GB') : 'Not specified';
    
    return `Hello, I want to book ${villa.name}. May I have more information?

Check-in: ${checkInDate}
Check-out: ${checkOutDate}
Guests: ${guests}
Location: ${villa.location || 'N/A'}

Thank you!`;
  };

  const handleWhatsAppContact = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/393457905205?text=${encodedMessage}`, "_blank");
  };

  const mainImage = (villa.images || [villa.image])[currentImageIndex];
  const maxGuests = parseInt(villa.specs.find(s => s.label.en === 'Guests')?.value || '2');

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
        aria-label="Back to villas"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back
      </button>

      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-900">
                <img
                  src={mainImage}
                  alt={villa.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  key={mainImage}
                />
              </div>
              
              {(villa.images && villa.images.length > 1) && (
                <>
                  <div className="flex justify-center mt-4 space-x-2">
                    {villa.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                        }`}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                  </button>
                </>
              )}
              {villa.distanceToBeach && (
                <div className="absolute top-4 left-4 bg-white/90 text-black text-xs font-bold px-3 py-1 rounded-full">
                  {villa.distanceToBeach}
                </div>
              )}
            </div>

            <div>
              {villa.location && (
                <div className="flex items-center gap-2 mb-4 text-gray-400">
                  <MapPinIcon className="w-5 h-5" />
                  <span>{villa.location}</span>
                </div>
              )}

              <h1 className="text-4xl md:text-5xl font-bold mb-6">{villa.name}</h1>

              <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-6">
                {villa.specs.map(spec => (
                    <div key={spec.label.en} className="flex items-center gap-2 text-gray-300">
                        <spec.icon className="w-5 h-5 text-white" />
                        <span>{spec.value} {spec.label[lang]}</span>
                    </div>
                ))}
                {villa.size && (
                     <div className="text-sm font-medium text-gray-300 border-l border-gray-700 pl-6">
                        {villa.size}
                    </div>
                )}
              </div>

              {villa.description && (
                <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                  {villa.description[lang]}
                </p>
              )}
            </div>
          </div>
          
          {hasDetailedInfo ? (
            <>
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-8">Amenities & Comfort</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {villa.amenities?.map((amenity, index) => (
                    <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                      <amenity.icon className="w-8 h-8 mb-4 text-white" />
                      <h3 className="text-xl font-semibold mb-2">{amenity.title[lang]}</h3>
                      <p className="text-gray-400">{amenity.description[lang]}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-8">Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                  {villa.features?.[lang].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {villa.images && villa.images.length > 1 && (
                <div className="mb-12">
                    <h2 className="text-3xl font-bold mb-8">Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {villa.images.map((image, index) => (
                        <div
                        key={index}
                        className={`aspect-square overflow-hidden rounded-lg cursor-pointer transition-all duration-200 border-2 ${index === currentImageIndex ? 'border-white' : 'border-transparent hover:border-white/50'}`}
                        onClick={() => setCurrentImageIndex(index)}
                        >
                        <img
                            src={image}
                            alt={`${villa.name} - ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        </div>
                    ))}
                    </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-lg">
                <h2 className="text-2xl font-bold text-white">More Information Coming Soon</h2>
                <p className="text-gray-400 mt-2">Detailed information for this villa is being prepared.</p>
            </div>
          )}

          <div className="mt-16">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">
                Ready for your dream vacation?
              </h2>
              <p className="text-gray-300 mb-6">
                Contact us for more information and availability
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Check-in</label>
                  <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Check-out</label>
                  <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 text-white" />
                </div>
              </div>

              <div className="mb-8">
                <label className="text-sm text-gray-400 mb-2 block">Guests</label>
                <div className="flex items-center justify-center gap-4 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-medium px-4 w-12 text-center">{guests}</span>
                  <button
                    type="button"
                    onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <button
                  onClick={handleWhatsAppContact}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full flex items-center justify-center mx-auto transition-colors"
                >
                  <MessageCircleIcon className="w-5 h-5 mr-2" />
                  Contact Us
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}