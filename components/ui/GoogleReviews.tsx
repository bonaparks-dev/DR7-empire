import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { GOOGLE_REVIEWS } from '../../constants';
import { StarIcon } from '../icons/Icons';
import { useTranslation } from '../../hooks/useTranslation';

type Review = typeof GOOGLE_REVIEWS[number];

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  return (
    <div className="h-full bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl p-6 flex flex-col text-left transition-all duration-300">
      <div className="flex items-center mb-4">
        <img
          src={review.avatar}
          alt={review.name}
          className="w-12 h-12 rounded-full mr-4 border-2 border-white/10"
        />
        <div>
          <h3 className="font-bold text-white">{review.name}</h3>
          <p className="text-sm text-gray-400">{review.date}</p>
        </div>
      </div>
      <div className="flex mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            className={`w-5 h-5 ${i < review.rating ? 'text-white' : 'text-gray-600'}`}
          />
        ))}
      </div>
      <p className="text-gray-200 text-sm leading-relaxed flex-grow">{review.review}</p>
    </div>
  );
};

const GoogleReviews: React.FC<{
  intervalMs?: number;       // autoplay interval
  transitionMs?: number;     // slide duration
  zoomScale?: number;        // active zoom amount
}> = ({
  intervalMs = 2400,
  transitionMs = 450,
  zoomScale = 1.04,
}) => {
  const { t } = useTranslation();
  const reviews = useMemo(() => (GOOGLE_REVIEWS?.length ? GOOGLE_REVIEWS : []), []);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    if (!reviews.length) return;
    const id = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % reviews.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, reviews.length]);

  const current = reviews[index];

  // Slide + zoom variants
  const variants: Variants = {
    enter: (dir: 1 | -1) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
      scale: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: zoomScale,
      transition: { duration: transitionMs / 1000, ease: 'easeOut' },
    },
    exit: (dir: 1 | -1) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
      scale: 1,
      transition: { duration: transitionMs / 1000, ease: 'easeIn' },
    }),
  };

  if (!reviews.length) return null;

  return (
    <div className="w-full">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold text-white text-center mb-8"
      >
        {t('What_Our_Clients_Say')}
      </motion.h2>

      <div className="relative mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-2xl bg-black border border-white/10 p-6">
          <AnimatePresence custom={direction} mode="popLayout" initial={false}>
            <motion.div
              key={current.id ?? index}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <ReviewCard review={current} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoogleReviews;
