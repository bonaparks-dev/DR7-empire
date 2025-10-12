import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCarouselProps {
  images: string[];
  autoplaySpeed?: number;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, autoplaySpeed = 3000 }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length > 1) {
      const timer = setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, autoplaySpeed);
      return () => clearTimeout(timer);
    }
  }, [index, images.length, autoplaySpeed]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <AnimatePresence initial={false} mode="sync">
        <motion.img
          key={index}
          src={images[index]}
          alt={`Carousel image ${index + 1}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectFit: 'cover' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </AnimatePresence>
    </div>
  );
};
