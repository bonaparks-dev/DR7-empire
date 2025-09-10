
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import type { Booking, User, MembershipTier } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, UsersIcon, CogIcon, CalendarIcon } from '../components/icons/Icons';
import { MEMBERSHIP_TIERS } from '../constants';

const ProfileSection: React.FC = () => {
    const { t } = useTranslation();
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        profilePicture: user?.profilePicture || '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({...prev, profilePicture: event.target?.result as string}));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedData: Partial<User> = {
            fullName: formData.fullName,
            phone: formData.phone,
        };
        // Only include profile picture if it's a new one (starts with data:image)
        if (formData.profilePicture && formData.profilePicture.startsWith('data:image')) {
            updatedData.profilePicture = formData.profilePicture;
        }
        updateUser(updatedData);
        setSuccessMessage(t('Profile_updated_successfully'));
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="text-3xl font-bold text-white mb-6">{t('Profile')}</h2>
            {successMessage && <div className="bg-green-500/20 text-green-300 p-3 rounded-md mb-4">{successMessage}</div>}
            <form onSubmit={handleSubmit} className="bg-stone-900/50 p-8 rounded-lg border border-stone-800">
                <div className="flex items-center space-x-6 mb-8">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-stone-700 flex items-center justify-center border-2 border-stone-600">
                            {formData.profilePicture ? (
                                <img src={formData.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover"/>
                            ) : (
                                <UsersIcon className="w-12 h-12 text-stone-400"/>
                            )}
                        </div>
                        {isEditing && (
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-amber-400 text-black w-8 h-8 rounded-full flex items-center justify-center hover:bg-amber-300">
                                <CameraIcon className="w-5 h-5" />
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
                            </button>
                        )}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">{user?.fullName}</h3>
                        <p className="text-stone-400">{user?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm text-stone-400">{t('Full_Name')}</label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} disabled={!isEditing} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white disabled:text-stone-400"/>
                    </div>
                    <div>
                        <label className="text-sm text-stone-400">{t('Phone_Number')}</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white disabled:text-stone-400"/>
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                    {isEditing ? (
                        <>
                            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 bg-stone-700 text-white font-bold rounded-full hover:bg-stone-600 transition-colors">{t('Cancel')}</button>
                            <button type="submit" className="px-6 py-2 bg-amber-400 text-black font-bold rounded-full hover:bg-amber-300 transition-colors">{t('Save_Changes')}</button>
                        </>
                    ) : (
                        <button type="button" onClick={() => setIsEditing(true)} className="px-6 py-2 bg-amber-400 text-black font-bold rounded-full hover:bg-amber-300 transition-colors">{t('Edit_Profile')}</button>
                    )}
                </div>
            </form>
        </motion.div>
    );
};

const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => {
    const { t, lang } = useTranslation();
    const formatPrice = (price: number) => new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: booking.currency }).format(price);
    const formatDate = (date: string) => new Date(date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return (
        <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-800 flex space-x-4">
            <img src={booking.image} alt={booking.itemName} className="w-32 h-24 object-cover rounded-md"/>
            <div className="flex-grow">
                <h4 className="font-bold text-white">{booking.itemName}</h4>
                <p className="text-sm text-stone-400">{formatDate(booking.pickupDate)} - {formatDate(booking.returnDate)}</p>
                <p className="text-sm text-stone-400">{t('Booked_On')}: {formatDate(booking.bookedAt)}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg text-amber-400">{formatPrice(booking.totalPrice)}</p>
            </div>
        </div>
    );
};

const BookingsSection: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]') as Booking[];
        const userBookings = allBookings.filter(b => b.userId === user?.id).sort((a,b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
        setBookings(userBookings);
    }, [user]);

    const { upcomingBookings, pastBookings } = useMemo(() => {
        const now = new Date();
        const upcoming = bookings.filter(b => new Date(b.returnDate) >= now);
        const past = bookings.filter(b => new Date(b.returnDate) < now);
        return { upcomingBookings: upcoming, pastBookings: past };
    }, [bookings]);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="text-3xl font-bold text-white mb-6">{t('My_Bookings')}</h2>
            
            <div>
                <h3 className="text-xl font-semibold text-amber-400 mb-4">{t('Upcoming_Bookings')}</h3>
                {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingBookings.map(b => <BookingCard key={b.bookingId} booking={b} />)}
                    </div>
                ) : <p className="text-stone-400">{t('You_have_no_upcoming_bookings')}</p>}
            </div>

            <div className="mt-12">
                <h3 className="text-xl font-semibold text-amber-400 mb-4">{t('Past_Bookings')}</h3>
                {pastBookings.length > 0 ? (
                    <div className="space-y-4">
                        {pastBookings.map(b => <BookingCard key={b.bookingId} booking={b} />)}
                    </div>
                ) : <p className="text-stone-400">{t('You_have_no_past_bookings')}</p>}
            </div>
        </motion.div>
    );
};

const MembershipSection: React.FC = () => {
    const { t, lang, getTranslated } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const membership = user?.membership;
    const tierDetails = membership ? MEMBERSHIP_TIERS.find(t => t.id === membership.tierId) : null;

    if (!membership || !tierDetails) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-3xl font-bold text-white mb-6">{t('My_Membership')}</h2>
                <div className="bg-stone-900/50 p-8 rounded-lg border border-stone-800 text-center">
                    <p className="text-stone-300 mb-4">You are not a DR7 Club member yet.</p>
                    <button onClick={() => navigate('/membership')} className="px-6 py-2 bg-amber-400 text-black font-bold rounded-full hover:bg-amber-300 transition-colors">
                        {t('Join_The_Club')}
                    </button>
                </div>
            </motion.div>
        );
    }

    const renewalDate = new Date(membership.renewalDate).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="text-3xl font-bold text-white mb-6">{t('My_Membership')}</h2>
            <div className="bg-stone-900/50 p-8 rounded-lg border border-stone-800">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-stone-400">{t('Current_Tier')}</p>
                        <p className="text-2xl font-bold text-amber-400">{getTranslated(tierDetails.name)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-stone-400">{t('Renews_On')}</p>
                        <p className="font-semibold text-white">{renewalDate}</p>
                    </div>
                </div>
                <div className="mt-6 border-t border-stone-800 pt-6">
                    <h4 className="font-semibold text-white mb-3">Your Benefits:</h4>
                    <ul className="space-y-2 text-stone-300 text-sm list-disc list-inside">
                        {tierDetails.features[lang].map((feature, index) => <li key={index}>{feature}</li>)}
                    </ul>
                </div>
                <div className="mt-8 flex justify-end">
                    <button className="px-6 py-2 bg-stone-700 text-white font-bold rounded-full hover:bg-stone-600 transition-colors">{t('Manage_Subscription')}</button>
                </div>
            </div>
        </motion.div>
    );
};


const SettingsSection: React.FC = () => {
    const { t } = useTranslation();
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="text-3xl font-bold text-white mb-6">{t('Settings')}</h2>
            <div className="bg-stone-900/50 p-8 rounded-lg border border-stone-800">
                <h3 className="text-xl font-semibold text-white mb-4">{t('Change_Password')}</h3>
                <form className="space-y-4">
                     <div>
                        <label className="text-sm text-stone-400">{t('Current_Password')}</label>
                        <input type="password" name="currentPassword" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>
                    </div>
                     <div>
                        <label className="text-sm text-stone-400">{t('New_Password')}</label>
                        <input type="password" name="newPassword" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>
                    </div>
                    <div>
                        <label className="text-sm text-stone-400">{t('Confirm_Password')}</label>
                        <input type="password" name="confirmNewPassword" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-6 py-2 bg-amber-400 text-black font-bold rounded-full hover:bg-amber-300 transition-colors">{t('Update_Password')}</button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

const AccountPage: React.FC = () => {
    const { tab = 'profile' } = useParams<{ tab: string }>();
    const { t } = useTranslation();
    const { user } = useAuth();
    
    const tabs = useMemo(() => {
        const baseTabs = [
            { id: 'profile', label: t('Profile'), icon: UsersIcon },
            { id: 'bookings', label: t('My_Bookings'), icon: CalendarIcon },
        ];
        if (user?.membership) {
            baseTabs.push({ id: 'membership', label: t('My_Membership'), icon: () => <span className="text-amber-400 text-xl font-bold">7</span> });
        }
        baseTabs.push({ id: 'settings', label: t('Settings'), icon: CogIcon });
        return baseTabs;
    }, [t, user]);
    
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="pt-32 pb-24 bg-black min-h-screen">
                <div className="container mx-auto px-6">
                    <div className="md:flex md:space-x-8">
                        <aside className="md:w-1/4">
                            <nav className="bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                                <ul className="space-y-2">
                                    {tabs.map(item => (
                                        <li key={item.id}>
                                            <Link 
                                                to={`/account/${item.id}`}
                                                className={`flex items-center space-x-3 px-4 py-3 rounded-md font-semibold transition-colors w-full text-left ${tab === item.id ? 'bg-amber-400/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800'}`}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </aside>
                        
                        <main className="md:w-3/4 mt-8 md:mt-0">
                            <AnimatePresence mode="wait">
                                <div key={tab}>
                                    {tab === 'profile' && <ProfileSection />}
                                    {tab === 'bookings' && <BookingsSection />}
                                    {tab === 'membership' && <MembershipSection />}
                                    {tab === 'settings' && <SettingsSection />}
                                </div>
                            </AnimatePresence>
                        </main>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AccountPage;