import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prize } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { ArrowLeftIcon } from '../icons/Icons';

interface PrizeCarouselProps {
  prizes: Prize[];
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) =>
  Math.abs(offset) * velocity;

// modulo positif
const wrapIndex = (index: number, length: number) =>
  ((index % length) + length) % length;

export const PrizeCarousel: React.FC<PrizeCarouselProps> = ({ prizes }) => {
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isHovered, setIsHovered] = useState(false);
  const { getTranslated } = useTranslation();

  const length = prizes.length;
  const imageIndex = useMemo(
    () => (length > 0 ? wrapIndex(page, length) : 0),
    [page, length]
  );

  const paginate = (newDirection: number) => {
    setPage(([p]) => [p + newDirection, newDirection]);
  };

  // Auto-slide toutes les 4s (pause au survol)
  useEffect(() => {
    if (isHovered || length <= 1) return;
    const id = setTimeout(() => paginate(1), 4000);
    return () => clearTimeout(id);
  }, [page, isHovered, length]);

  const currentPrize = prizes[imageIndex];
  if (!currentPrize) return null;

  return (
    <div
      className="w-full max-w-4xl mx-auto relative flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800 shadow-2xl shadow-black/50">
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={page}
            src={currentPrize.image}
            alt={getTranslated(currentPrize.name)}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute w-full h-full object-cover"
          />
        </AnimatePresence>

        <button
          onClick={() => paginate(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
          aria-label="Previous prize"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <button
          onClick={() => paginate(1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
          aria-label="Next prize"
        >
          <ArrowLeftIcon className="w-6 h-6 rotate-180" />
        </button>
      </div>

      <div className="text-center mt-4">
        <h3 className="text-2xl font-bold text-white">
          {getTranslated(currentPrize.name)}
        </h3>
        <p className="text-md text-gray-400">
          {getTranslated(currentPrize.tier)}
        </p>
      </div>

      <div className="flex justify-center space-x-2 mt-4">
        {prizes.map((_, i) => (
          <button
            key={i}
            onClick={() =>
              setPage(([p]) => [i, i > wrapIndex(p, length) ? 1 : -1])
            }
            className={`w-3 h-3 rounded-full transition-colors ${
              i === imageIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to prize ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
