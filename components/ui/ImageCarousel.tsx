import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCarouselProps {
  images: string[];
  autoplaySpeed?: number;
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

// positive modulo
const wrapIndex = (index: number, length: number) =>
  ((index % length) + length) % length;

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, autoplaySpeed = 4000 }) => {
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isHovered, setIsHovered] = useState(false);

  const length = images.length;
  const imageIndex = useMemo(
    () => (length > 0 ? wrapIndex(page, length) : 0),
    [page, length]
  );

  const paginate = (newDirection: number) => {
    setPage(([p]) => [p + newDirection, newDirection]);
  };

  useEffect(() => {
    if (isHovered || length <= 1) return;
    const id = setTimeout(() => paginate(1), autoplaySpeed);
    return () => clearTimeout(id);
  }, [page, isHovered, length, autoplaySpeed]);

  const currentImage = images[imageIndex];
  if (!currentImage) return null;

  return (
    <div
      className="w-full h-full relative flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={page}
          src={currentImage}
          alt={`Carousel image ${imageIndex + 1}`}
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
    </div>
  );
};