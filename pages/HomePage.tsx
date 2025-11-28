import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { RENTAL_CATEGORIES, COMMERCIAL_OPERATION_GIVEAWAY } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

// Optional: if you want to map category ids to specific display titles
const DISPLAY_TITLE: Record<string, string> = {
  cars: 'Exotic Supercars',
  yachts: 'Yachts',
  villas: 'Villas',
  helicopters: 'Helicopters',
  jets: 'Private Jets',
  'car-wash-services': 'Luxury Wash',
  membership: 'Members',
};

// Map category ids to image filenames in /public
const CATEGORY_IMAGE: Record<string, string> = {
  cars: '/car.jpeg',
  'urban-cars': '/urbancars.jpeg',
  yachts: '/yacht.jpeg',
  villas: '/villa.jpeg',
  helicopters: '/helicopter.jpeg',
  jets: '/privatejet.jpeg',
  'car-wash-services': '/luxurywash.jpeg',
  membership: '/members.jpeg',
};

// Hero video slides configuration
const HERO_SLIDES = [
  {
    id: 1,
    videoSrc: '/main.mp4',
    title: 'DR7 Empire',
    subtitle: 'Global Mobility & Luxury Lifestyle',
  },
  {
    id: 2,
    videoSrc: '/video2.mp4',
    title: 'Exotic Fleet',
    subtitle: 'Supercar & Luxury Division',
  },
  {
    id: 3,
    videoSrc: '/video3.mp4',
    title: 'Premium Services',
    subtitle: 'Exclusive Experiences',
  },
];

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Auto-advance slides every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Pause/play videos based on active slide
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === activeSlide) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [activeSlide]);

  return (
    <div className="relative h-screen flex items-center justify-center text-center overflow-hidden">
      {/* Video slides */}
      <AnimatePresence mode="wait">
        {HERO_SLIDES.map((slide, index) => (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: index === activeSlide ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 z-0"
            style={{ pointerEvents: index === activeSlide ? 'auto' : 'none' }}
          >
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              loop
              muted
              playsInline
              className="w-full h-full object-cover brightness-[.65]"
            >
              <source src={slide.videoSrc} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/30" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Navigation dots - Ferrari style */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20 flex space-x-4">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setActiveSlide(index)}
            className={`transition-all duration-500 ease-out ${
              index === activeSlide
                ? 'w-2 h-2 bg-white rounded-full scale-100 opacity-100'
                : 'w-2 h-2 border border-white/50 rounded-full scale-75 opacity-60 hover:opacity-100 hover:scale-90'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
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

      {/* ===== Giveaway Section (fixed tag structure) ===== */}
      <section className="py-24 relative bg-black">
        <div className="absolute inset-0 bg-black/70" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-white"
          >
            {getTranslated(COMMERCIAL_OPERATION_GIVEAWAY.name)}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <Link
              to="/commercial-operation"
              className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
            >
              {t('Enter_Now')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== Categories Section ===== */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {RENTAL_CATEGORIES.map((category, index) => {
              const imageSrc =
                CATEGORY_IMAGE[category.id as keyof typeof CATEGORY_IMAGE] ||
                category.data?.[0]?.image ||
                '/placeholder.jpeg';

              const displayTitle =
                DISPLAY_TITLE[category.id as keyof typeof DISPLAY_TITLE] ||
                getTranslated(category.label);

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
                    <img
                      src={imageSrc}
                      alt={displayTitle}
                      className={`w-full ${isFeatured ? 'h-[40rem]' : 'h-96'} object-cover brightness-75 group-hover:brightness-100 transition-all duration-500 group-hover:scale-110`}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8">
                      <h3 className="text-3xl font-bold text-white">
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
    </motion.div>
  );
};

export default HomePage;
