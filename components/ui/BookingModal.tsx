import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBooking } from '../../hooks/useBooking';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../hooks/useAuth';
import type { Booking } from '../../types';
import { XIcon } from '../icons/Icons';

const BookingModal: React.FC = () => {
    const { isBookingOpen, closeBooking, bookingItem } = useBooking();
    const { t, lang, getTranslated } = useTranslation();
    const { currency } = useCurrency();
    const { user } = useAuth();
    
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);
    
    useEffect(() => {
        if (user) {
            setFullName(user.fullName);
            setEmail(user.email);
            if(user.phone) setPhone(user.phone);
        }
    }, [user]);

    const today = new Date().toISOString().split('T')[0];

    const { totalDays, totalPrice } = useMemo(() => {
        if (pickupDate && returnDate && bookingItem) {
            const start = new Date(pickupDate);
            const end = new Date(returnDate);
            if (start < end) {
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const pricePerDay = bookingItem.pricePerDay[currency] || 0;
                return { totalDays: diffDays, totalPrice: diffDays * pricePerDay };
            }
        }
        return { totalDays: 0, totalPrice: 0 };
    }, [pickupDate, returnDate, currency, bookingItem]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
          style: 'currency',
          currency: currency.toUpperCase(),
          minimumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const handleClose = () => {
        closeBooking();
        setTimeout(() => {
            setIsConfirmed(false);
            setCompletedBooking(null);
            setPickupDate('');
            setReturnDate('');
            setPhone('');
            // Don't reset name and email if user is logged in
            if (!user) {
                setFullName('');
                setEmail('');
            }
        }, 300); // Reset form after animation
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingItem || totalDays <= 0 || !user) return;

        const newBooking: Booking = {
            bookingId: crypto.randomUUID(),
            userId: user.id,
            itemId: bookingItem.id,
            itemName: bookingItem.name,
            image: bookingItem.image,
            pickupDate,
            pickupTime: '15:00', // Default check-in time for non-car rentals
            returnDate,
            returnTime: '11:00', // Default check-out time for non-car rentals
            duration: `${totalDays} ${totalDays === 1 ? t('Night') : t('Nights')}`,
            totalPrice,
            currency: currency.toUpperCase() as 'USD' | 'EUR',
            // FIX: Added 'countryOfResidency'. This and 'age' are not collected in this modal.
            customer: { fullName, email, phone, age: 0, countryOfResidency: '' },
            driverLicenseImage: '', // Not applicable for non-car rentals
            paymentMethod: 'stripe', // Default payment method
            bookedAt: new Date().toISOString(),
        };

        const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]') as Booking[];
        localStorage.setItem('bookings', JSON.stringify([...existingBookings, newBooking]));
        
        setCompletedBooking(newBooking);
        setIsConfirmed(true);
    };

    if (!bookingItem) return null;

    return (
        <AnimatePresence>
            {isBookingOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative bg-gray-900/80 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                    >
                        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10" aria-label={t('Close')}>
                            <XIcon className="w-6 h-6" />
                        </button>
                        
                        {!isConfirmed ? (
                             <form onSubmit={handleSubmit}>
                                <div className="grid md:grid-cols-2">
                                    <div className="p-8 border-b md:border-b-0 md:border-r border-gray-700">
                                        <h2 className="text-2xl font-bold text-white mb-2">{t('Book_Your_Experience')}</h2>
                                        <h3 className="text-3xl font-bold text-white mb-6">{bookingItem.name}</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-300">{t('Pickup_Date')}</label>
                                                <input type="date" id="pickupDate" value={pickupDate} onChange={e => setPickupDate(e.target.value)} min={today} required className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm text-white focus:ring-white focus:border-white" />
                                            </div>
                                            <div>
                                                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-300">{t('Return_Date')}</label>
                                                <input type="date" id="returnDate" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={pickupDate || today} required className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm text-white focus:ring-white focus:border-white" />
                                            </div>
                                            <div>
                                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">{t('Full_Name')}</label>
                                                <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required disabled={!!user} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm text-white focus:ring-white focus:border-white disabled:text-gray-400 disabled:cursor-not-allowed" />
                                            </div>
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-300">{t('Email_Address')}</label>
                                                <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={!!user} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm text-white focus:ring-white focus:border-white disabled:text-gray-400 disabled:cursor-not-allowed" />
                                            </div>
                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">{t('Phone_Number')}</label>
                                                <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm text-white focus:ring-white focus:border-white" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col">
                                        <img src={bookingItem.image} alt={bookingItem.name} className="w-full h-64 object-cover rounded-lg mb-6"/>
                                        
                                        <div className="grid grid-cols-3 gap-4 mb-6 text-gray-300 text-sm">
                                            {bookingItem.specs.map((spec, index) => (
                                                <div key={index} className="flex flex-col items-center text-center p-2 rounded-lg bg-gray-800/50">
                                                    <spec.icon className="w-6 h-6 mb-2 text-white" />
                                                    <span className="font-semibold text-white">{spec.value}</span>
                                                    <span className="text-xs text-gray-400">{getTranslated(spec.label)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center text-gray-300">
                                                <span>{formatPrice(bookingItem.pricePerDay[currency])} x {totalDays} {totalDays === 1 ? t('Night') : t('Nights')}</span>
                                                <span>{formatPrice(totalPrice)}</span>
                                            </div>
                                            <div className="border-t border-gray-700 my-4"></div>
                                            <div className="flex justify-between items-center text-white font-bold text-xl">
                                                <span>{t('Total_Price')}</span>
                                                <span>{formatPrice(totalPrice)}</span>
                                            </div>
                                        </div>
                                        <button type="submit" disabled={totalDays <= 0} className="w-full mt-6 bg-white text-black px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100">
                                            {t('Confirm_Booking')}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="p-8">
                                <div className="text-center mb-6">
                                    <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type: 'spring', stiffness: 260, damping: 20}} className="w-16 h-16 bg-gray-500/20 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </motion.div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{t('Booking_Confirmed')}</h2>
                                    <p className="text-gray-300">{t('Your_booking_is_confirmed')}</p>
                                    <p className="text-gray-400 text-sm">{t('A_confirmation_email_has_been_sent')}</p>
                                </div>
                                
                                {completedBooking && (
                                    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-3 text-sm max-w-md mx-auto">
                                        <h3 className="text-lg font-bold text-white text-center mb-4">{t('Booking_Details')}</h3>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">{t('Item')}</span>
                                            <span className="font-semibold text-white text-right">{completedBooking.itemName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">{t('Dates')}</span>
                                            <span className="font-semibold text-white text-right">{formatDate(completedBooking.pickupDate)} - {formatDate(completedBooking.returnDate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">{t('Duration')}</span>
                                            <span className="font-semibold text-white text-right">{completedBooking.duration}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">{t('Full_Name')}</span>
                                            <span className="font-semibold text-white text-right">{completedBooking.customer.fullName}</span>
                                        </div>
                                        <div className="border-t border-gray-700 my-3"></div>
                                        <div className="flex justify-between items-center text-lg">
                                            <span className="text-gray-300 font-bold">{t('Total_Price')}</span>
                                            <span className="font-bold text-white">{formatPrice(completedBooking.totalPrice)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center mt-8">
                                    <button onClick={handleClose} className="bg-gray-700 text-white px-6 py-2 rounded-full font-semibold text-sm hover:bg-gray-600 transition-colors">
                                        {t('Close')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BookingModal;