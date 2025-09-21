import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../hooks/useAuth';
import { RENTAL_CATEGORIES, PICKUP_LOCATIONS, INSURANCE_OPTIONS, RENTAL_EXTRAS, COUNTRIES, INSURANCE_ELIGIBILITY, VALIDATION_MESSAGES, YACHT_PICKUP_MARINAS, AIRPORTS, HELI_DEPARTURE_POINTS, HELI_ARRIVAL_POINTS, VILLA_SERVICE_FEE_PERCENTAGE, CRYPTO_ADDRESSES } from '../constants';
import type { Booking, Inquiry, RentalItem } from '../types';
import { CameraIcon, CreditCardIcon, CryptoIcon } from '../components/icons/Icons';
import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = process.env.VITE_STRIPE_PUBLISHABLE_KEY;

type Category = 'cars' | 'yachts' | 'villas' | 'jets' | 'helicopters';

const BookingPage: React.FC = () => {
    const { category, itemId } = useParams<{ category: Category; itemId: string }>();
    const { t } = useTranslation();
    const { user } = useAuth();
    
    const item = useMemo(() => {
        if (!category || !itemId) return null;
        return RENTAL_CATEGORIES.find(c => c.id === category)?.data.find(i => i.id === itemId);
    }, [category, itemId]);

    if (!user) {
        // This page is protected, so user should exist. But as a fallback:
        return <div className="pt-32 text-center text-white">Please sign in to continue.</div>;
    }
    
    if (!item) {
        return <div className="pt-32 text-center text-white">Item not found.</div>;
    }

    const renderBookingFlow = () => {
        // For simplicity, this example will focus on a unified booking flow.
        // In a real app, you might have more distinct flows.
        // For now, let's assume a generic booking/inquiry form that adapts.
        // A more complex car rental wizard would be in its own component.
        if (category === 'cars' || category === 'villas' || category === 'yachts') {
            return <PaymentBookingForm item={item} category={category} />;
        } else if (category === 'jets' || category === 'helicopters') {
            return <AviationInquiryForm item={item} category={category} />;
        }
        return <div className="pt-32 text-center text-white">Invalid booking category.</div>;
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-32 pb-24 bg-black min-h-screen text-white">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold">{t(category === 'jets' || category === 'helicopters' ? 'Submit_Inquiry' : 'Book_Your')} {item.name}</h1>
                </div>
                {renderBookingFlow()}
            </div>
        </motion.div>
    );
};

// A generic form for items that require payment (Cars, Villas, Yachts)
const PaymentBookingForm: React.FC<{item: RentalItem, category: Category}> = ({ item, category }) => {
    const { t } = useTranslation();
    // This would contain state for dates, payment, etc., and the Stripe payment element.
    // Due to the complexity, this is a simplified placeholder.
    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">{t('Booking_Summary')}</h2>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                    <img src={item.image} alt={item.name} className="rounded-lg object-cover w-full aspect-square" />
                    <h3 className="text-xl font-bold mt-4">{item.name}</h3>
                </div>
                <div className="md:w-2/3">
                    <p className="text-gray-300">This is where the detailed booking form with date pickers, options, and payment processing via Stripe would be implemented. It is currently under construction.</p>
                    <button className="mt-6 w-full bg-white text-black font-bold py-3 px-4 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60">
                        {t('Confirm_Booking')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// A generic form for items that require an inquiry (Jets, Helicopters)
const AviationInquiryForm: React.FC<{item: RentalItem, category: Category}> = ({ item, category }) => {
     const { t } = useTranslation();
     const navigate = useNavigate();
     const [isSubmitted, setIsSubmitted] = useState(false);

     const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
     }
     
     if (isSubmitted) {
        return (
             <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
                 <h2 className="text-3xl font-bold text-white mb-2">{t('Inquiry_Sent')}</h2>
                 <p className="text-gray-300 mb-6">{t('Our_team_will_contact_you_shortly_with_a_quote')}</p>
                 <button onClick={() => navigate(`/${category}`)} className="bg-white text-black font-bold py-2 px-6 rounded-full">{t('Close')}</button>
            </div>
        )
     }

    return (
        <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">{t('Inquiry_Summary')}</h2>
             <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                    <img src={item.image} alt={item.name} className="rounded-lg object-cover w-full aspect-square" />
                    <h3 className="text-xl font-bold mt-4">{item.name}</h3>
                </div>
                <div className="md:w-2/3">
                    <p className="text-gray-300">This is where the detailed inquiry form for aviation services would be. It would collect itinerary details before submission.</p>
                     <button type="submit" className="mt-6 w-full bg-white text-black font-bold py-3 px-4 rounded-full hover:bg-gray-200 transition-colors">
                        {t('Submit_Inquiry')}
                    </button>
                </div>
            </div>
        </form>
    );
}

export default BookingPage;