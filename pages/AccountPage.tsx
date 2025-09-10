import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import type { Booking, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, UsersIcon, CogIcon, CalendarIcon, CreditCardIcon } from '../components/icons/Icons';
import { MEMBERSHIP_TIERS } from '../constants';

const ProfileSection: React.FC = () => {
    const { t } = useTranslation();
    const { user, updateUser } = useAuth();

    // State from original ProfileSection
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        profilePicture: user?.profilePicture || '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State from original VerificationSection
    const [idFront, setIdFront] = useState<string>(user?.verification?.idFrontImage || '');
    const [idBack, setIdBack] = useState<string>(user?.verification?.idBackImage || '');
    const [cardDetails, setCardDetails] = useState({ 
        name: user?.verification?.cardholderName || '', 
        number: '', 
        expiry: user?.verification?.cardExpiry || '', 
        cvc: '' 
    });
    const [phoneCode, setPhoneCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    
    const verification = user?.verification;

    // Handlers from original ProfileSection
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
        if (formData.profilePicture && formData.profilePicture.startsWith('data:image')) {
            updatedData.profilePicture = formData.profilePicture;
        }
        updateUser(updatedData);
        setSuccessMessage(t('Profile_updated_successfully'));
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // Handlers from original VerificationSection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                if (side === 'front') setIdFront(result);
                else setIdBack(result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const submitIdForReview = () => {
        // FIX: Spread user!.verification to provide the full verification object,
        // as required by the type, even though updateUser performs a merge.
        updateUser({ verification: { ...user!.verification, idStatus: 'pending', idFrontImage: idFront, idBackImage: idBack } });
    };

    const handleCardSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // FIX: Spread user!.verification to provide the full verification object.
        updateUser({ verification: { ...user!.verification, cardStatus: 'verified', cardLast4: cardDetails.number.slice(-4), cardExpiry: cardDetails.expiry, cardholderName: cardDetails.name } });
    };

    const handlePhoneVerify = () => {
        setIsCodeSent(true);
    };

    const handlePhoneCodeSubmit = () => {
        if(phoneCode === '123456') { // Mock code
            // FIX: Spread user!.verification to provide the full verification object.
            updateUser({ verification: { ...user!.verification, phoneStatus: 'verified' } });
            setIsCodeSent(false);
        } else {
            alert('Invalid code');
        }
    };

    const getStatusChip = (status: 'none' | 'pending' | 'verified' | undefined) => {
        switch (status) {
            case 'verified': return <span className="text-xs font-medium text-gray-200 bg-gray-500/20 px-2 py-1 rounded-full">{t('Verified')}</span>;
            case 'pending': return <span className="text-xs font-medium text-gray-300 bg-gray-600/20 px-2 py-1 rounded-full">{t('Pending_Review')}</span>;
            default: return <span className="text-xs font-medium text-gray-400 bg-gray-700/20 px-2 py-1 rounded-full">{t('Not_Verified')}</span>;
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="text-3xl font-bold text-white mb-6">{t('Profile')}</h2>
            {successMessage && <div className="bg-gray-500/20 text-gray-200 p-3 rounded-md mb-4">{successMessage}</div>}
            
            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="bg-gray-900/50 p-8 rounded-lg border border-gray-800">
                <div className="flex items-center space-x-6 mb-8">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                            {formData.profilePicture ? (
                                <img src={formData.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover"/>
                            ) : (
                                <UsersIcon className="w-12 h-12 text-gray-400"/>
                            )}
                        </div>
                        {isEditing && (
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-white text-black w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200">
                                <CameraIcon className="w-5 h-5" />
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
                            </button>
                        )}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">{user?.fullName}</h3>
                        <p className="text-gray-400">{user?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm text-gray-400">{t('Full_Name')}</label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} disabled={!isEditing} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white disabled:text-gray-400"/>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">{t('Phone_Number')}</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white disabled:text-gray-400"/>
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                    {isEditing ? (
                        <>
                            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors">{t('Cancel')}</button>
                            <button type="submit" className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">{t('Save_Changes')}</button>
                        </>
                    ) : (
                        <button type="button" onClick={() => setIsEditing(true)} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">{t('Edit_Profile')}</button>
                    )}
                </div>
            </form>

            {/* Verification Sections */}
            <h2 className="text-3xl font-bold text-white mb-6 mt-12">{t('Verification')}</h2>
            <div className="space-y-8">
                 {/* ID Documents */}
                <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-white">{t('ID_Documents')}</h3>
                            <p className="text-sm text-gray-400">{verification?.idStatus !== 'verified' ? t('Your_identity_is_not_verified') : 'Your identity has been verified.'}</p>
                        </div>
                        {getStatusChip(verification?.idStatus)}
                    </div>
                    {verification?.idStatus !== 'verified' && (
                        <div className="mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="text-center p-4 border-2 border-dashed border-gray-700 rounded-lg">
                                    {idFront ? <img src={idFront} alt="ID Front Preview" className="h-24 w-auto mx-auto rounded-md mb-2 object-contain" /> : <div className="h-24 flex items-center justify-center text-gray-500">Front</div>}
                                    <label htmlFor="id-front" className="text-sm font-medium text-white hover:text-gray-300 cursor-pointer">{t('Upload_Front_of_ID')}<input id="id-front" type="file" className="sr-only" onChange={e => handleFileChange(e, 'front')} /></label>
                                </div>
                                <div className="text-center p-4 border-2 border-dashed border-gray-700 rounded-lg">
                                    {idBack ? <img src={idBack} alt="ID Back Preview" className="h-24 w-auto mx-auto rounded-md mb-2 object-contain" /> : <div className="h-24 flex items-center justify-center text-gray-500">Back</div>}
                                    <label htmlFor="id-back" className="text-sm font-medium text-white hover:text-gray-300 cursor-pointer">{t('Upload_Back_of_ID')}<input id="id-back" type="file" className="sr-only" onChange={e => handleFileChange(e, 'back')} /></label>
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button onClick={submitIdForReview} disabled={!idFront || !idBack || verification?.idStatus === 'pending'} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {verification?.idStatus === 'pending' ? t('Pending_Review') : t('Submit_for_Review')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Credit Card */}
                <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-white">{t('Credit_Card_Details')}</h3>
                            <p className="text-sm text-gray-400">{verification?.cardStatus !== 'verified' ? t('Add_a_credit_card_for_faster_bookings') : 'Your credit card is on file.'}</p>
                        </div>
                        {getStatusChip(verification?.cardStatus)}
                    </div>
                    {verification?.cardStatus === 'verified' ? (
                        <div className="mt-6 flex items-center justify-between bg-gray-800/50 p-4 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <CreditCardIcon className="w-8 h-8 text-gray-400" />
                                <div>
                                    <p className="font-mono text-white">•••• •••• •••• {user?.verification?.cardLast4}</p>
                                    <p className="text-sm text-gray-400">Expires {user?.verification?.cardExpiry}</p>
                                </div>
                            </div>
                            <button className="text-sm font-bold text-white hover:text-gray-300">{t('Update_Card')}</button>
                        </div>
                    ) : (
                        <form onSubmit={handleCardSubmit} className="mt-6 space-y-4">
                            <div><label className="text-sm text-gray-400">{t('Cardholder_Name')}</label><input type="text" value={cardDetails.name} onChange={e => setCardDetails(p => ({...p, name: e.target.value}))} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div>
                            <div><label className="text-sm text-gray-400">{t('Card_Number')}</label><input type="text" placeholder="•••• •••• •••• ••••" value={cardDetails.number} onChange={e => setCardDetails(p => ({...p, number: e.target.value}))} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm text-gray-400">{t('Expiry')}</label><input type="text" placeholder="MM/YY" value={cardDetails.expiry} onChange={e => setCardDetails(p => ({...p, expiry: e.target.value}))} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div>
                                <div><label className="text-sm text-gray-400">{t('CVC')}</label><input type="text" placeholder="•••" value={cardDetails.cvc} onChange={e => setCardDetails(p => ({...p, cvc: e.target.value}))} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/></div>
                            </div>
                            <div className="flex justify-end"><button type="submit" className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">{t('Add_Card')}</button></div>
                        </form>
                    )}
                </div>

                 {/* Phone Number */}
                <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-white">{t('Phone_Number_Verification')}</h3>
                            <p className="text-sm text-gray-400">{t('Verify_your_phone_number_for_added_security')}</p>
                        </div>
                        {getStatusChip(verification?.phoneStatus)}
                    </div>
                    {verification?.phoneStatus !== 'verified' && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg">
                                <p className="text-white">{user?.phone || 'No phone number on file.'}</p>
                                <button onClick={handlePhoneVerify} disabled={!user?.phone || isCodeSent} className="px-6 py-2 text-sm bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('Verify_Phone')}</button>
                            </div>
                            {isCodeSent && (
                                <div className="mt-4 p-4 bg-gray-800/30 rounded-lg">
                                    <p className="text-sm text-gray-300 mb-2">{t('Verification_code_sent')}</p>
                                    <div className="flex space-x-2">
                                        <input type="text" value={phoneCode} onChange={e => setPhoneCode(e.target.value)} placeholder={t('Enter_Verification_Code')} className="flex-grow bg-gray-800 border-gray-700 rounded-md p-2 text-white"/>
                                        <button onClick={handlePhoneCodeSubmit} className="px-6 py-2 text-sm bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">{t('Submit_Code')}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => {
    const { t, lang } = useTranslation();
    const formatPrice = (price: number) => new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: booking.currency }).format(price);
    const formatDate = (date: string) => new Date(date).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 flex space-x-4">
            <img src={booking.image} alt={booking.itemName} className="w-32 h-24 object-cover rounded-md"/>
            <div className="flex-grow">
                <h4 className="font-bold text-white">{booking.itemName}</h4>
                <p className="text-sm text-gray-400">{formatDate(booking.pickupDate)} - {formatDate(booking.returnDate)}</p>
                <p className="text-sm text-gray-400">{t('Booked_On')}: {formatDate(booking.bookedAt)}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg text-white">{formatPrice(booking.totalPrice)}</p>
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
                <h3 className="text-xl font-semibold text-white mb-4">{t('Upcoming_Bookings')}</h3>
                {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingBookings.map(b => <BookingCard key={b.bookingId} booking={b} />)}
                    </div>
                ) : <p className="text-gray-400">{t('You_have_no_upcoming_bookings')}</p>}
            </div>

            <div className="mt-12">
                <h3 className="text-xl font-semibold text-white mb-4">{t('Past_Bookings')}</h3>
                {pastBookings.length > 0 ? (
                    <div className="space-y-4">
                        {pastBookings.map(b => <BookingCard key={b.bookingId} booking={b} />)}
                    </div>
                ) : <p className="text-gray-400">{t('You_have_no_past_bookings')}</p>}
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
                <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800 text-center">
                    <p className="text-gray-300 mb-4">You are not a DR7 Club member yet.</p>
                    <button onClick={() => navigate('/membership')} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
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
            <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-400">{t('Current_Tier')}</p>
                        <p className="text-2xl font-bold text-white">{getTranslated(tierDetails.name)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">{t('Renews_On')}</p>
                        <p className="font-semibold text-white">{renewalDate}</p>
                    </div>
                </div>
                <div className="mt-6 border-t border-gray-800 pt-6">
                    <h4 className="font-semibold text-white mb-3">Your Benefits:</h4>
                    <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside">
                        {tierDetails.features[lang].map((feature, index) => <li key={index}>{feature}</li>)}
                    </ul>
                </div>
                <div className="mt-8 flex justify-end">
                    <button className="px-6 py-2 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors">{t('Manage_Subscription')}</button>
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
            <div className="bg-gray-900/50 p-8 rounded-lg border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-4">{t('Change_Password')}</h3>
                <form className="space-y-4">
                     <div>
                        <label className="text-sm text-gray-400">{t('Current_Password')}</label>
                        <input type="password" name="currentPassword" className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>
                    </div>
                     <div>
                        <label className="text-sm text-gray-400">{t('New_Password')}</label>
                        <input type="password" name="newPassword" className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">{t('Confirm_Password')}</label>
                        <input type="password" name="confirmNewPassword" className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">{t('Update_Password')}</button>
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
            baseTabs.push({ id: 'membership', label: t('My_Membership'), icon: () => <span className="text-white text-xl font-bold">7</span> });
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
                            <nav className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                                <ul className="space-y-2">
                                    {tabs.map(item => (
                                        <li key={item.id}>
                                            <Link 
                                                to={`/account/${item.id}`}
                                                className={`flex items-center space-x-3 px-4 py-3 rounded-md font-semibold transition-colors w-full text-left ${tab === item.id ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
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