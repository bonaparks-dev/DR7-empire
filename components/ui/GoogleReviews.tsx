import React, { useEffect, useRef, useState } from 'react';
import { motion, animate, AnimationPlaybackControls } from 'framer-motion';
import { GOOGLE_REVIEWS } from '../../constants';
import { StarIcon } from '../icons/Icons';
import { useTranslation } from '../../hooks/useTranslation';

const ReviewCard: React.FC<{ review: typeof GOOGLE_REVIEWS[0] }> = ({ review }) => {
    return (
        <div className="h-full bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 flex flex-col text-left transition-all duration-300 hover:border-white/50 hover:shadow-2xl hover:shadow-white/10">
            <div className="flex items-center mb-4">
                <img src={review.avatar} alt={review.name} className="w-12 h-12 rounded-full mr-4 border-2 border-gray-700" />
                <div>
                    <h3 className="font-bold text-white">{review.name}</h3>
                    <p className="text-sm text-gray-400">{review.date}</p>
                </div>
            </div>
            <div className="flex mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className={`w-5 h-5 ${i < review.rating ? 'text-white' : 'text-gray-600'}`} />
                ))}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed flex-grow">{review.review}</p>
        </div>
    );
};

const GoogleReviews: React.FC = () => {
    const { t } = useTranslation();
    const duplicatedReviews = [...GOOGLE_REVIEWS, ...GOOGLE_REVIEWS, ...GOOGLE_REVIEWS];
    
    const ref = useRef<HTMLDivElement>(null);
    const [animation, setAnimation] = useState<AnimationPlaybackControls | null>(null);

    const duration = GOOGLE_REVIEWS.length * 8; // Adjust speed here, higher number is slower

    useEffect(() => {
        if (ref.current) {
            const controls = animate(
                ref.current,
                { x: ['0%', '-33.333%'] }, // Corresponds to one full set of original reviews
                { ease: 'linear', duration, repeat: Infinity }
            );
            setAnimation(controls);
            return () => controls.stop();
        }
    }, [duration]);

    const handleMouseEnter = () => animation?.pause();
    const handleMouseLeave = () => animation?.play();

    return (
        <>
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold text-white text-center mb-12"
            >
                {t('What_Our_Clients_Say')}
            </motion.h2>
            <div 
                className="w-full overflow-hidden relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
            >
                <motion.div ref={ref} className="flex">
                    {duplicatedReviews.map((review, index) => (
                        <div key={index} className="flex-shrink-0" style={{ width: 'clamp(20rem, 25vw, 24rem)', padding: '1rem' }}>
                            <ReviewCard review={review} />
                        </div>
                    ))}
                </motion.div>
            </div>
        </>
    );
};

export default GoogleReviews;