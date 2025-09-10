
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import type { RentalItem, Booking } from '../../types';
import { XIcon, CalendarIcon, CameraIcon, CreditCardIcon, CryptoIcon } from '../icons/Icons';

interface CarBookingWizardProps {
  item: RentalItem;
  onClose: () => void;
}

const ProgressBar: React.FC<{ step: number }> = ({ step }) => {
    const { t } = useTranslation();
    const steps = [t('Select_Dates_and_Times'), t('Driver_Information'), t('License_Verification'), t('Payment')];
    return (
        <div className="w-full px-8 pt-6">
            <div className="flex items-center">
                {steps.map((label, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${step > index ? 'bg-amber-400 text-black' : step === index ? 'bg-amber-400 text-black border-2 border-amber-200' : 'bg-stone-700 text-stone-400'}`}>
                                {step > index ? '✓' : index + 1}
                            </div>
                            <p className={`mt-2 text-xs text-center transition-colors duration-300 ${step >= index ? 'text-white' : 'text-stone-500'}`}>{label}</p>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`flex-1 h-1 mx-2 transition-colors duration-300 ${step > index ? 'bg-amber-400' : 'bg-stone-700'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const CarBookingWizard: React.FC<CarBookingWizardProps> = ({ item, onClose }) => {
    const { t, lang } = useTranslation();
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // At least 30 mins in the future
    const currentTime = now.toTimeString().substring(0,5);

    const [bookingDetails, setBookingDetails] = useState({
        pickupDate: today,
        pickupTime: currentTime,
        returnDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        returnTime: currentTime,
        driverAge: 25,
        licenseImage: '', // base64
        paymentMethod: 'stripe' as 'stripe' | 'crypto',
    });

    const [isCapturing, setIsCapturing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        return () => { // Cleanup on unmount
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
    },[]);

    const { duration, totalPrice } = useMemo(() => {
        const pickup = new Date(`${bookingDetails.pickupDate}T${bookingDetails.pickupTime}`);
        const ret = new Date(`${bookingDetails.returnDate}T${bookingDetails.returnTime}`);
        if (pickup >= ret) return { duration: 'Invalid dates', totalPrice: 0 };

        const diffMs = ret.getTime() - pickup.getTime();
        const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;

        let durationStr = '';
        if (days > 0) durationStr += `${days} ${days === 1 ? t('day') : t('days')}`;
        if (hours > 0) durationStr += `${days > 0 ? ', ' : ''}${hours} ${hours === 1 ? t('hour') : t('hours')}`;

        const pricePerDay = lang === 'it' ? item.pricePerDay.eur : item.pricePerDay.usd;
        const pricePerHour = pricePerDay / 12; // Assuming a 12h day rate for hourly calcs
        const total = (days * pricePerDay) + (hours * pricePerHour);

        return { duration: durationStr, totalPrice: total };
    }, [bookingDetails.pickupDate, bookingDetails.pickupTime, bookingDetails.returnDate, bookingDetails.returnTime, item.pricePerDay, lang, t]);

    const formatPrice = (price: number) => new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: lang === 'it' ? 'EUR' : 'USD' }).format(price);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setBookingDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setBookingDetails(prev => ({ ...prev, licenseImage: event.target?.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const startCamera = async () => {
        setIsCapturing(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Camera error:", err);
            alert("Could not access camera. Please check permissions.");
            setIsCapturing(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context?.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            setBookingDetails(prev => ({ ...prev, licenseImage: dataUrl }));
            stopCamera();
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCapturing(false);
    };

    const nextStep = () => { setDirection(1); setStep(s => s + 1); };
    const prevStep = () => { setDirection(-1); setStep(s => s - 1); };

    const handleSubmit = () => {
        if (!user) return;
        const newBooking: Booking = {
            bookingId: crypto.randomUUID(),
            itemId: item.id,
            itemName: item.name,
            image: item.image,
            pickupDate: bookingDetails.pickupDate,
            pickupTime: bookingDetails.pickupTime,
            returnDate: bookingDetails.returnDate,
            returnTime: bookingDetails.returnTime,
            duration,
            totalPrice,
            currency: lang === 'it' ? 'EUR' : 'USD',
            customer: {
                fullName: user.fullName,
                email: user.email,
                phone: '', // This would be in a user profile
                age: bookingDetails.driverAge,
            },
            driverLicenseImage: bookingDetails.licenseImage,
            paymentMethod: bookingDetails.paymentMethod,
            bookedAt: new Date().toISOString(),
        };
        console.log("New Booking:", newBooking);
        nextStep(); // Move to confirmation
    }

    const stepVariants = {
        enter: (direction: number) => ({ opacity: 0, x: direction * 30 }),
        center: { opacity: 1, x: 0 },
        exit: (direction: number) => ({ opacity: 0, x: -direction * 30 }),
    };

    const renderStep = () => {
        switch (step) {
            case 0: // Dates & Times
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-300">{t('Pickup_Date')}</label>
                                <input type="date" name="pickupDate" value={bookingDetails.pickupDate} onChange={handleChange} min={today} className="mt-1 w-full bg-stone-800 border-stone-600 rounded-md" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-stone-300">{t('Pickup_Time')}</label>
                                <input type="time" name="pickupTime" value={bookingDetails.pickupTime} onChange={handleChange} className="mt-1 w-full bg-stone-800 border-stone-600 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-300">{t('Return_Date')}</label>
                                <input type="date" name="returnDate" value={bookingDetails.returnDate} onChange={handleChange} min={bookingDetails.pickupDate} className="mt-1 w-full bg-stone-800 border-stone-600 rounded-md" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-stone-300">{t('Return_Time')}</label>
                                <input type="time" name="returnTime" value={bookingDetails.returnTime} onChange={handleChange} className="mt-1 w-full bg-stone-800 border-stone-600 rounded-md" />
                            </div>
                        </div>
                        <div className="mt-6 bg-stone-800/50 p-4 rounded-lg">
                            <div className="flex justify-between text-sm"><span className="text-stone-400">{t('Total_Duration')}</span><span>{duration}</span></div>
                            <div className="flex justify-between text-sm mt-2"><span className="text-stone-400">{t('Price_per_day')}</span><span>{formatPrice(lang === 'it' ? item.pricePerDay.eur : item.pricePerDay.usd)}</span></div>
                            <div className="border-t border-stone-700 my-3"></div>
                            <div className="flex justify-between font-bold text-lg"><span className="text-stone-300">{t('Estimated_Total')}</span><span className="text-amber-400">{formatPrice(totalPrice)}</span></div>
                        </div>
                    </>
                );
            case 1: // Driver Info
                 return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-300">{t('Full_Name')}</label>
                            <input type="text" value={user?.fullName} disabled className="mt-1 w-full bg-stone-800 border-stone-600 rounded-md text-stone-400 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300">{t('Email_Address')}</label>
                            <input type="email" value={user?.email} disabled className="mt-1 w-full bg-stone-800 border-stone-600 rounded-md text-stone-400 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300">{t('Drivers_Age')}</label>
                            <input type="number" name="driverAge" value={bookingDetails.driverAge} onChange={handleChange} min="25" className="mt-1 w-full bg-stone-800 border-stone-600 rounded-md" />
                            <p className="text-xs text-stone-500 mt-1">{t('Minimum_age_is_25')}</p>
                        </div>
                    </div>
                );
            case 2: // License
                return (
                    <div className="text-center">
                        <p className="text-sm text-stone-400 mb-4">{t('Please_provide_a_clear_photo_of_your_drivers_license')}</p>
                        {isCapturing ? (
                             <div className="relative">
                                <video ref={videoRef} autoPlay className="w-full rounded-lg bg-stone-900 aspect-video object-cover"></video>
                                <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white/30 rounded-full border-4 border-white backdrop-blur-sm"></button>
                                <button onClick={stopCamera} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"><XIcon className="w-5 h-5"/></button>
                            </div>
                        ) : bookingDetails.licenseImage ? (
                            <div>
                                <img src={bookingDetails.licenseImage} alt="Driver's License Preview" className="w-full rounded-lg mb-4" />
                                <button onClick={() => setBookingDetails(prev => ({ ...prev, licenseImage: '' }))} className="bg-stone-700 text-white px-4 py-2 rounded-full text-sm">{t('Change_Photo')}</button>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <label htmlFor="licenseUpload" className="flex-1 cursor-pointer text-center bg-stone-700 text-white px-4 py-3 rounded-full font-semibold hover:bg-stone-600 transition-colors">
                                    {t('Upload_File')}
                                </label>
                                <input id="licenseUpload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                <button onClick={startCamera} className="flex-1 flex items-center justify-center gap-2 bg-amber-400 text-black px-4 py-3 rounded-full font-semibold hover:bg-amber-300 transition-colors">
                                    <CameraIcon className="w-5 h-5" /> {t('Use_Camera')}
                                </button>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                );
            case 3: // Payment
                return (
                    <div>
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => setBookingDetails(p => ({ ...p, paymentMethod: 'stripe' }))} className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${bookingDetails.paymentMethod === 'stripe' ? 'bg-amber-400/10 border-amber-400 text-amber-400' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}>
                                <CreditCardIcon className="w-6 h-6"/> {t('Credit_Card')}
                            </button>
                             <button onClick={() => setBookingDetails(p => ({ ...p, paymentMethod: 'crypto' }))} className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${bookingDetails.paymentMethod === 'crypto' ? 'bg-amber-400/10 border-amber-400 text-amber-400' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}>
                                <CryptoIcon className="w-6 h-6"/> {t('Cryptocurrency')}
                            </button>
                        </div>
                        {bookingDetails.paymentMethod === 'stripe' ? (
                            <div className="space-y-3 p-4 bg-stone-800/50 rounded-lg">
                                <input type="text" placeholder={t('Card_Number')} className="w-full bg-stone-700 border-stone-600 rounded-md" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder={t('Expiry')} className="w-full bg-stone-700 border-stone-600 rounded-md" />
                                    <input type="text" placeholder={t('CVC')} className="w-full bg-stone-700 border-stone-600 rounded-md" />
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-stone-800/50 rounded-lg text-center">
                                <p className="text-sm text-stone-400 mb-2">{t('Scan_or_copy_address_below')}</p>
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" alt="QR Code" className="mx-auto rounded-md bg-white p-2"/>
                                <p className="text-xs break-all bg-stone-900 p-2 rounded-md mt-2">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</p>
                            </div>
                        )}
                    </div>
                );
            case 4: // Confirmation
                return (
                    <div className="text-center p-8">
                        <motion.div initial={{scale:0}} animate={{scale:1}} className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </motion.div>
                        <h3 className="text-2xl font-bold text-amber-400">{t('Booking_Request_Sent')}</h3>
                        <p className="text-stone-300 mt-2">{t('We_will_confirm_your_booking_shortly')}</p>
                    </div>
                )
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative bg-stone-900/80 border border-stone-700 rounded-lg shadow-2xl w-full max-w-xl text-white">
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white"><XIcon/></button>
                <div className="p-6 border-b border-stone-700">
                    <h2 className="text-2xl font-bold text-amber-400">{item.name}</h2>
                </div>
                {step < 4 && <ProgressBar step={step} />}
                <div className="p-8 min-h-[300px]">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>
                {step < 4 && (
                    <div className="p-6 border-t border-stone-700 flex justify-between items-center">
                        <button onClick={prevStep} disabled={step === 0} className="px-6 py-2 bg-stone-700 rounded-full text-sm font-semibold hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed">{t('Back')}</button>
                        <button onClick={step === 3 ? handleSubmit : nextStep} className="px-6 py-2 bg-amber-400 text-black rounded-full text-sm font-bold hover:bg-amber-300">{step === 3 ? t('Confirm_Booking') : t('Next')}</button>
                    </div>
                )}
                 {step === 4 && (
                     <div className="p-6 border-t border-stone-700 flex justify-center">
                        <button onClick={onClose} className="px-8 py-2 bg-amber-400 text-black rounded-full text-sm font-bold hover:bg-amber-300">{t('Close')}</button>
                    </div>
                 )}
            </motion.div>
        </div>
    );
};

export default CarBookingWizard;
