import React from 'react';
import { StarIcon } from '../icons/Icons';
import { useTranslation } from '../../hooks/useTranslation';

type Review = {
    author: string;
    rating: number;
    date: string;
    body: string;
    sourceUrl: string;
};

type Business = {
    name: string;
    url: string;
    image: string;
    telephone: string;
    address: {
        streetAddress: string;
        addressLocality: string;
        addressRegion: string;
        postalCode: string;
        addressCountry: string;
    };
};

type RatingSummary = {
    ratingValue: number;
    reviewCount: number;
};

type ReviewsMarqueeProps = {
    reviews: Review[];
    business?: Business;
    ratingSummary?: RatingSummary;
    googleReviewsUrl?: string;
    speedSeconds?: number;
    speedSecondsMobile?: number;
    gapPx?: number;
    dark?: boolean;
};

const ReviewCard: React.FC<{ review: Review, dark?: boolean }> = ({ review, dark }) => {
    const { lang } = useTranslation();
    const formattedDate = new Date(review.date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    
    const cardClasses = dark
        ? "bg-black/70 border-white/10 text-gray-200"
        : "bg-white/90 border-gray-200 text-gray-800";
    const authorColor = dark ? "text-white" : "text-black";
    const dateColor = dark ? "text-gray-400" : "text-gray-500";
    const starColor = dark ? "text-white" : "text-yellow-500";
    const starEmptyColor = dark ? "text-gray-600" : "text-gray-300";

    return (
        <a href={review.sourceUrl} target="_blank" rel="noopener noreferrer" className={`h-full w-[280px] sm:w-[320px] md:w-[350px] shrink-0 rounded-xl p-4 sm:p-6 flex flex-col text-left transition-all duration-300 border backdrop-blur-sm hover:border-white/50 hover:bg-gray-900 ${cardClasses}`} style={{ marginRight: `var(--gap, 20px)` }}>
            <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 sm:mr-4 bg-gray-700 flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                    {review.author.charAt(0)}
                </div>
                <div>
                    <h3 className={`font-bold text-sm sm:text-base ${authorColor}`}>{review.author}</h3>
                    <p className={`text-xs sm:text-sm ${dateColor}`}>{formattedDate}</p>
                </div>
            </div>
            <div className="flex mb-3 sm:mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                        key={i}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${i < review.rating ? starColor : starEmptyColor}`}
                    />
                ))}
            </div>
            <p className="text-xs sm:text-sm leading-relaxed flex-grow line-clamp-5 sm:line-clamp-6">{review.body}</p>
        </a>
    );
};

export const ReviewsMarquee: React.FC<ReviewsMarqueeProps> = ({
    reviews,
    business,
    ratingSummary,
    speedSeconds = 10,
    speedSecondsMobile = 10,
    gapPx = 20,
    dark = false,
}) => {
    const marqueeStyle = {
        '--speed': `${speedSeconds}s`,
        '--speed-mobile': `${speedSecondsMobile}s`,
        '--gap': `${gapPx}px`,
    } as React.CSSProperties;

    // Duplicate reviews for a seamless loop
    const doubledReviews = [...reviews, ...reviews, ...reviews, ...reviews];
    
    const jsonLd = business && ratingSummary ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": business.name,
        "image": business.image,
        "@id": business.url,
        "url": business.url,
        "telephone": business.telephone,
        "address": {
          "@type": "PostalAddress",
          ...business.address
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": ratingSummary.ratingValue,
          "reviewCount": ratingSummary.reviewCount
        },
        "review": reviews.map(review => ({
            "@type": "Review",
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": review.rating
            },
            "author": {
                "@type": "Person",
                "name": review.author
            },
            "reviewBody": review.body.replace(/\n\n/g, ' '),
            "datePublished": review.date,
            "publisher": {
                "@type": "Organization",
                "name": "Google"
            }
        }))
    } : null;

    return (
        <div className="w-full overflow-hidden group flex flex-col" style={marqueeStyle}>
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}
            <div className="flex shrink-0 animate-marquee group-hover:[animation-play-state:paused]">
                {doubledReviews.map((review, i) => (
                    <ReviewCard key={i} review={review} dark={dark} />
                ))}
            </div>
        </div>
    );
};
