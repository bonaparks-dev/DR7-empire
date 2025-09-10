import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../hooks/useAuth';
import { RENTAL_CATEGORIES, PICKUP_LOCATIONS, INSURANCE_OPTIONS, RENTAL_EXTRAS, COUNTRIES } from '../constants';
import type { Booking } from '../types';
import { CameraIcon, CreditCardIcon, CryptoIcon } from '../components/icons/Icons';

const BookingPage: React.FC = () => {
  const { category: categoryId, itemId } = useParams<{ category: string; itemId: string }>();
  const navigate = useNavigate();
  const { t, lang, getTranslated } = useTranslation();
  const { currency } = useCurrency();
  const { user } = useAuth();

  const { category, item } = useMemo(() => {
    const cat = RENTAL_CATEGORIES.find(c => c.id === categoryId);
    const itm = cat?.data.find(i => i.id === itemId);
    return { category: cat, item: itm };
  }, [categoryId, itemId]);

  const isCar = category?.id === 'cars';
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
      // Step 1 - Car
      pickupDate: today,
      pickupTime: '10:00',
      returnDate: '',
      returnTime: '10:00',
      pickupLocation: PICKUP_LOCATIONS[0].id,
      insuranceOption: INSURANCE_OPTIONS[0].id,
      extras: [] as string[],
      // Step 1 - Other
      checkinDate: today,
      checkoutDate: '',
      guests: 1,
      // Step 2
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      countryOfResidency: '',
      age: 25,
      // Step 3
      licenseImage: '',
      // Step 4
      paymentMethod: 'stripe' as 'stripe' | 'crypto',
      cardNumber: '',
      cardExpiry: '',
      cardCVC: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const { 
    duration, rentalCost, insuranceCost, extrasCost, subtotal, taxes, total, nights
  } = useMemo(() => {
    if (!item) return { duration: { days: 0, hours: 0 }, rentalCost: 0, insuranceCost: 0, extrasCost: 0, subtotal: 0, taxes: 0, total: 0, nights: 0 };
    
    const pricePerDay = item.pricePerDay[currency];
    
    if (isCar) {
      if (!formData.pickupDate || !formData.returnDate) return { duration: { days: 0, hours: 0 }, rentalCost: 0, insuranceCost: 0, extrasCost: 0, subtotal: 0, taxes: 0, total: 0, nights: 0 };
      const pickup = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
      const ret = new Date(`${formData.returnDate}T${formData.returnTime}`);
      
      if (pickup >= ret) return { duration: { days: 0, hours: 0 }, rentalCost: 0, insuranceCost: 0, extrasCost: 0, subtotal: 0, taxes: 0, total: 0, nights: 0 };

      const diffMs = ret.getTime() - pickup.getTime();
      const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      const billingDays = days + (hours > 0 ? 1 : 0);

      const calculatedRentalCost = (days * pricePerDay) + (hours * (pricePerDay / 12));
      const selectedInsurance = INSURANCE_OPTIONS.find(opt => opt.id === formData.insuranceOption);
      const calculatedInsuranceCost = (selectedInsurance?.pricePerDay[currency] || 0) * billingDays;
      const calculatedExtrasCost = formData.extras.reduce((acc, extraId) => {
        const extra = RENTAL_EXTRAS.find(e => e.id === extraId);
        return acc + (extra?.pricePerDay[currency] || 0) * billingDays;
      }, 0);
      
      const calculatedSubtotal = calculatedRentalCost + calculatedInsuranceCost + calculatedExtrasCost;
      const calculatedTaxes = calculatedSubtotal * 0.10;
      const calculatedTotal = calculatedSubtotal + calculatedTaxes;
      
      return { duration: { days, hours }, rentalCost: calculatedRentalCost, insuranceCost: calculatedInsuranceCost, extrasCost: calculatedExtrasCost, subtotal: calculatedSubtotal, taxes: calculatedTaxes, total: calculatedTotal, nights: 0 };

    } else { // Not a car
      if (!formData.checkinDate || !formData.checkoutDate) return { duration: { days: 0, hours: 0 }, rentalCost: 0, insuranceCost: 0, extrasCost: 0, subtotal: 0, taxes: 0, total: 0, nights: 0 };
      const start = new Date(formData.checkinDate);
      const end = new Date(formData.checkoutDate);
      
      if (start >= end) return { duration: { days: 0, hours: 0 }, rentalCost: 0, insuranceCost: 0, extrasCost: 0, subtotal: 0, taxes: 0, total: 0, nights: 0 };

      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const calculatedRentalCost = diffDays * pricePerDay;
      const calculatedTaxes = calculatedRentalCost * 0.10;
      const calculatedTotal = calculatedRentalCost + calculatedTaxes;

      return { duration: { days: diffDays, hours: 0 }, rentalCost: calculatedRentalCost, insuranceCost: 0, extrasCost: 0, subtotal: calculatedRentalCost, taxes: calculatedTaxes, total: calculatedTotal, nights: diffDays };
    }

  }, [formData, item, currency, isCar]);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            extras: checked ? [...prev.extras, name] : prev.extras.filter(id => id !== name)
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
        setErrors(prev => ({...prev, [name]: ''}));
    }
  };
  
  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              setFormData(prev => ({...prev, licenseImage: event.target?.result as string}));
              setErrors(prev => ({...prev, licenseImage: ''}));
          };
          reader.readAsDataURL(file);
      }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (isCar) {
        if (step === 1) {
            if (!formData.pickupDate || !formData.returnDate) newErrors.date = 'Please select valid pickup and return dates.';
            else if (new Date(`${formData.pickupDate}T${formData.pickupTime}`) >= new Date(`${formData.returnDate}T${formData.returnTime}`)) {
                newErrors.date = 'Return date must be after pickup date.';
            }
        }
        if (step === 2) {
            if (!formData.fullName) newErrors.fullName = t('Full_name_is_required');
            if (!formData.email) newErrors.email = t('Email_is_required');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('Please_enter_a_valid_email_address');
            if (!formData.countryOfResidency) newErrors.countryOfResidency = t('Country_of_Residency_is_required');
            if (formData.age < 25) newErrors.age = t('Minimum_age_is_25');
        }
        if (step === 3) {
            if (!formData.licenseImage) newErrors.licenseImage = 'Please upload your driver\'s license.';
        }
        if (step === 4) {
          if (formData.paymentMethod === 'stripe') {
              if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required.';
              if (!formData.cardExpiry.trim()) newErrors.cardExpiry = 'Expiry date is required.';
              if (!formData.cardCVC.trim()) newErrors.cardCVC = 'CVC is required.';
          }
        }
    } else { // Not a car
        if (step === 1) {
            if (!formData.checkinDate || !formData.checkoutDate) newErrors.date = 'Please select valid check-in and check-out dates.';
            else if (new Date(formData.checkinDate) >= new Date(formData.checkoutDate)) {
                newErrors.date = 'Check-out date must be after check-in date.';
            }
        }
        if (step === 2) {
            if (!formData.fullName) newErrors.fullName = t('Full_name_is_required');
            if (!formData.email) newErrors.email = t('Email_is_required');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('Please_enter_a_valid_email_address');
            if (!formData.countryOfResidency) newErrors.countryOfResidency = t('Country_of_Residency_is_required');
        }
        if (step === 3) {
            if (formData.paymentMethod === 'stripe') {
              if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required.';
              if (!formData.cardExpiry.trim()) newErrors.cardExpiry = 'Expiry date is required.';
              if (!formData.cardCVC.trim()) newErrors.cardCVC = 'CVC is required.';
            }
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => setStep(s => s - 1);
  
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateStep() || !item || !user) return;
      
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsProcessing(false);
      
      const commonData = {
          bookingId: crypto.randomUUID(),
          userId: user.id,
          itemId: item.id,
          itemName: item.name,
          image: item.image,
          totalPrice: total,
          currency: currency.toUpperCase() as 'USD' | 'EUR',
          customer: { 
            fullName: formData.fullName, 
            email: formData.email, 
            phone: formData.phone, 
            age: Number(formData.age),
            countryOfResidency: formData.countryOfResidency,
          },
          paymentMethod: formData.paymentMethod,
          bookedAt: new Date().toISOString(),
      };

      const newBooking: Booking = isCar ? {
          ...commonData,
          pickupDate: formData.pickupDate,
          pickupTime: formData.pickupTime,
          returnDate: formData.returnDate,
          returnTime: formData.returnTime,
          duration: `${duration.days} ${duration.days === 1 ? t('day') : t('days')}, ${duration.hours} ${duration.hours === 1 ? t('hour') : t('hours')}`,
          driverLicenseImage: formData.licenseImage,
          pickupLocation: formData.pickupLocation,
          insuranceOption: formData.insuranceOption,
          extras: formData.extras
      } : {
        ...commonData,
        pickupDate: formData.checkinDate,
        pickupTime: '15:00',
        returnDate: formData.checkoutDate,
        returnTime: '11:00',
        duration: `${nights} ${nights === 1 ? t('Night') : t('Nights')}`,
        driverLicenseImage: '', // Not applicable
      };

      const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]') as Booking[];
      localStorage.setItem('bookings', JSON.stringify([...existingBookings, newBooking]));

      setStep(isCar ? 5 : 4); // Confirmation step
  };

  const steps = useMemo(() => {
    const carSteps = [
        { id: 1, name: t('Configuration') },
        { id: 2, name: t('Driver_Information') },
        { id: 3, name: t('License_Verification') },
        { id: 4, name: t('Payment') },
    ];
    const otherSteps = [
        { id: 1, name: t('Dates_and_Guests') },
        { id: 2, name: t('Personal_Information') },
        { id: 3, name: t('Payment') },
    ];
    return isCar ? carSteps : otherSteps;
  }, [isCar, t]);

  if (!item) {
    return <div className="pt-32 text-center text-white">Item not found.</div>;
  }

  const renderStepContent = () => {
    if (step === (isCar ? 5 : 4)) {
      return (
        <div className="text-center">
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type: 'spring', stiffness: 260, damping: 20}} className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </motion.div>
          <h2 className="text-3xl font-bold text-amber-400 mb-2">{t('Booking_Request_Sent')}</h2>
          <p className="text-stone-300 max-w-md mx-auto">{t('We_will_confirm_your_booking_shortly')}</p>
          <button type="button" onClick={() => navigate('/account/bookings')} className="mt-8 bg-amber-400 text-black px-6 py-2 rounded-full font-semibold text-sm hover:bg-amber-300 transition-colors">
              {t('My_Bookings')}
          </button>
        </div>
      );
    }

    if(isCar) {
      switch (step) {
        case 1:
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-stone-400">{t('Pickup_Date')}</label><input type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} min={today} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/></div>
                <div><label className="text-sm text-stone-400">{t('Pickup_Time')}</label><input type="time" name="pickupTime" value={formData.pickupTime} onChange={handleChange} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/></div>
                <div><label className="text-sm text-stone-400">{t('Return_Date')}</label><input type="date" name="returnDate" value={formData.returnDate} onChange={handleChange} min={formData.pickupDate || today} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/></div>
                <div><label className="text-sm text-stone-400">{t('Return_Time')}</label><input type="time" name="returnTime" value={formData.returnTime} onChange={handleChange} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/></div>
              </div>
              {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
              <div><label className="text-sm text-stone-400">{t('Pickup_Location')}</label><select name="pickupLocation" value={formData.pickupLocation} onChange={handleChange} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white">{PICKUP_LOCATIONS.map(loc => <option key={loc.id} value={loc.id}>{getTranslated(loc.label)}</option>)}</select></div>
              <div><h3 className="text-lg font-semibold text-white mb-2">{t('Insurance_Options')}</h3><div className="space-y-2">{INSURANCE_OPTIONS.map(opt => <label key={opt.id} className="flex items-center p-3 bg-stone-800/50 rounded-md border border-stone-700 cursor-pointer has-[:checked]:border-amber-400"><input type="radio" name="insuranceOption" value={opt.id} checked={formData.insuranceOption === opt.id} onChange={handleChange} className="h-4 w-4 text-amber-500 bg-stone-700 border-stone-600 focus:ring-amber-500" /><span className="ml-3 text-sm text-white">{getTranslated(opt.label)}</span><span className="ml-auto text-xs text-stone-400">+{formatPrice(opt.pricePerDay[currency])}/{t('day')}</span></label>)}</div></div>
              <div><h3 className="text-lg font-semibold text-white mb-2">{t('Extras_and_Addons')}</h3><div className="space-y-2">{RENTAL_EXTRAS.map(extra => <label key={extra.id} className="flex items-center p-3 bg-stone-800/50 rounded-md border border-stone-700 cursor-pointer has-[:checked]:border-amber-400"><input type="checkbox" name={extra.id} checked={formData.extras.includes(extra.id)} onChange={handleChange} className="h-4 w-4 text-amber-500 bg-stone-700 border-stone-600 rounded focus:ring-amber-500" /><span className="ml-3 text-sm text-white">{getTranslated(extra.label)}</span><span className="ml-auto text-xs text-stone-400">+{formatPrice(extra.pricePerDay[currency])}/{t('day')}</span></label>)}</div></div>
            </div>
          );
        case 2:
          return (
            <div className="space-y-4">
                <div><label className="text-sm text-stone-400">{t('Full_Name')}</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} disabled={!!user} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white disabled:text-stone-400"/>{errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}</div>
                <div><label className="text-sm text-stone-400">{t('Email_Address')}</label><input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!!user} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white disabled:text-stone-400"/>{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}</div>
                <div><label className="text-sm text-stone-400">{t('Phone_Number')}</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/></div>
                <div><label className="text-sm text-stone-400">{t('Country_of_Residency')}</label><select name="countryOfResidency" value={formData.countryOfResidency} onChange={handleChange} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"><option value="" disabled>Select a country</option>{COUNTRIES.map(country => (<option key={country.code} value={country.code}>{country.name}</option>))}</select>{errors.countryOfResidency && <p className="text-xs text-red-500 mt-1">{errors.countryOfResidency}</p>}</div>
                <div><label className="text-sm text-stone-400">{t('Drivers_Age')}</label><input type="number" name="age" value={formData.age} onChange={handleChange} min="25" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>{errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}</div>
            </div>
          );
        case 3:
          return (
            <div><p className="text-stone-300 mb-4">{t('Please_provide_a_clear_photo_of_your_drivers_license')}</p><div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-stone-700 border-dashed rounded-md"><div className="space-y-1 text-center">{formData.licenseImage ? <img src={formData.licenseImage} alt="License Preview" className="mx-auto h-32 w-auto rounded-md"/> : <CameraIcon className="mx-auto h-12 w-12 text-stone-500"/>}<div className="flex text-sm text-stone-400 justify-center"><label htmlFor="file-upload" className="relative cursor-pointer bg-stone-800 rounded-md font-medium text-amber-400 hover:text-amber-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-amber-500 focus-within:ring-offset-stone-900 px-2"><span>{t('Upload_File')}</span><input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleLicenseUpload} accept="image/*" /></label></div><p className="text-xs text-stone-500">PNG, JPG, GIF up to 10MB</p></div></div>{errors.licenseImage && <p className="text-xs text-red-500 mt-1">{errors.licenseImage}</p>}</div>
          );
        case 4:
          return (
            <div><div className="flex border-b border-stone-700"><button type="button" onClick={() => setFormData(p => ({...p, paymentMethod: 'stripe'}))} className={`flex-1 py-2 text-sm font-semibold transition-colors ${formData.paymentMethod === 'stripe' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-stone-400'}`}><CreditCardIcon className="w-5 h-5 inline mr-2"/>{t('Credit_Card')}</button><button type="button" onClick={() => setFormData(p => ({...p, paymentMethod: 'crypto'}))} className={`flex-1 py-2 text-sm font-semibold transition-colors ${formData.paymentMethod === 'crypto' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-stone-400'}`}><CryptoIcon className="w-5 h-5 inline mr-2"/>{t('Cryptocurrency')}</button></div><div className="mt-6">{formData.paymentMethod === 'stripe' ? (<div className="space-y-4"><div><label className="text-sm text-stone-400">{t('Card_Number')}</label><input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleChange} placeholder="•••• •••• •••• ••••" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>{errors.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}</div><div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-stone-400">{t('Expiry')}</label><input type="text" name="cardExpiry" value={formData.cardExpiry} onChange={handleChange} placeholder="MM / YY" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>{errors.cardExpiry && <p className="text-xs text-red-500 mt-1">{errors.cardExpiry}</p>}</div><div><label className="text-sm text-stone-400">{t('CVC')}</label><input type="text" name="cardCVC" value={formData.cardCVC} onChange={handleChange} placeholder="•••" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>{errors.cardCVC && <p className="text-xs text-red-500 mt-1">{errors.cardCVC}</p>}</div></div></div>) : (<div className="text-center"><p className="text-stone-300 mb-4">{t('Scan_or_copy_address_below')}</p><div className="w-40 h-40 bg-white p-2 rounded-md mx-auto flex items-center justify-center text-black">QR Code</div><input type="text" readOnly value="0x1234...abcd" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-4 text-white text-center text-sm"/><button type="button" className="mt-4 w-full py-2 bg-stone-700 text-white rounded-md hover:bg-stone-600">{t('I_have_sent_the_payment')}</button></div>)}</div></div>
          );
        default: return null;
      }
    } else { // Not a car
      switch (step) {
        case 1:
          return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-stone-400">{t('Check_in_Date')}</label>
                        <input type="date" name="checkinDate" value={formData.checkinDate} onChange={handleChange} min={today} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>
                    </div>
                    <div>
                        <label className="text-sm text-stone-400">{t('Check_out_Date')}</label>
                        <input type="date" name="checkoutDate" value={formData.checkoutDate} onChange={handleChange} min={formData.checkinDate || today} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>
                    </div>
                </div>
                {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
                <div>
                    <label className="text-sm text-stone-400">{t('Number_of_Guests')}</label>
                    <input type="number" name="guests" value={formData.guests} onChange={handleChange} min="1" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>
                </div>
            </div>
          );
        case 2:
          return (
            <div className="space-y-4">
                <div><label className="text-sm text-stone-400">{t('Full_Name')}</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} disabled={!!user} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white disabled:text-stone-400"/>{errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}</div>
                <div><label className="text-sm text-stone-400">{t('Email_Address')}</label><input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!!user} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white disabled:text-stone-400"/>{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}</div>
                <div><label className="text-sm text-stone-400">{t('Phone_Number')}</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/></div>
                <div><label className="text-sm text-stone-400">{t('Country_of_Residency')}</label><select name="countryOfResidency" value={formData.countryOfResidency} onChange={handleChange} className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"><option value="" disabled>Select a country</option>{COUNTRIES.map(country => (<option key={country.code} value={country.code}>{country.name}</option>))}</select>{errors.countryOfResidency && <p className="text-xs text-red-500 mt-1">{errors.countryOfResidency}</p>}</div>
            </div>
          );
        case 3:
          return (
            <div>
                <div className="flex border-b border-stone-700">
                    <button type="button" onClick={() => setFormData(p => ({...p, paymentMethod: 'stripe'}))} className={`flex-1 py-2 text-sm font-semibold transition-colors ${formData.paymentMethod === 'stripe' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-stone-400'}`}><CreditCardIcon className="w-5 h-5 inline mr-2"/>{t('Credit_Card')}</button>
                    <button type="button" onClick={() => setFormData(p => ({...p, paymentMethod: 'crypto'}))} className={`flex-1 py-2 text-sm font-semibold transition-colors ${formData.paymentMethod === 'crypto' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-stone-400'}`}><CryptoIcon className="w-5 h-5 inline mr-2"/>{t('Cryptocurrency')}</button>
                </div>
                <div className="mt-6">
                {formData.paymentMethod === 'stripe' ? (
                    <div className="space-y-4">
                        <div><label className="text-sm text-stone-400">{t('Card_Number')}</label><input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleChange} placeholder="•••• •••• •••• ••••" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>{errors.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm text-stone-400">{t('Expiry')}</label><input type="text" name="cardExpiry" value={formData.cardExpiry} onChange={handleChange} placeholder="MM / YY" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>{errors.cardExpiry && <p className="text-xs text-red-500 mt-1">{errors.cardExpiry}</p>}</div>
                            <div><label className="text-sm text-stone-400">{t('CVC')}</label><input type="text" name="cardCVC" value={formData.cardCVC} onChange={handleChange} placeholder="•••" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-1 text-white"/>{errors.cardCVC && <p className="text-xs text-red-500 mt-1">{errors.cardCVC}</p>}</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-stone-300 mb-4">{t('Scan_or_copy_address_below')}</p>
                        <div className="w-40 h-40 bg-white p-2 rounded-md mx-auto flex items-center justify-center text-black">QR Code</div>
                        <input type="text" readOnly value="0x1234...abcd" className="w-full bg-stone-800 border-stone-700 rounded-md p-2 mt-4 text-white text-center text-sm"/>
                        <button type="button" className="mt-4 w-full py-2 bg-stone-700 text-white rounded-md hover:bg-stone-600">{t('I_have_sent_the_payment')}</button>
                    </div>
                )}
                </div>
            </div>
          );
        default: return null;
      }
    }
  };

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-32 pb-24 bg-black min-h-screen"
    >
        <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
                {t('Book_Your')} <span className="text-amber-400">{item.name}</span>
            </h1>

            {step < (isCar ? 5 : 4) && (
                <div className="w-full max-w-lg mx-auto mb-12">
                    <div className="flex items-center justify-between">
                        {steps.map((s, index) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'bg-amber-400 border-amber-400 text-black' : 'border-stone-600 text-stone-400'}`}>
                                        {s.id}
                                    </div>
                                    <p className={`mt-2 text-xs font-semibold ${step >= s.id ? 'text-white' : 'text-stone-500'}`}>{s.name}</p>
                                </div>
                                {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${step > s.id ? 'bg-amber-400' : 'bg-stone-700'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                <aside className="lg:col-span-1 lg:sticky lg:top-32 self-start mb-8 lg:mb-0">
                    <div className="bg-stone-900/50 p-6 rounded-lg border border-stone-800">
                        <h2 className="text-2xl font-bold text-white mb-4">{t('Booking_Summary')}</h2>
                        <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-lg mb-4"/>
                        {isCar ? (
                        <>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-stone-400">{t('Rental_Cost')}</span><span className="text-white font-medium">{formatPrice(rentalCost)}</span></div>
                                <div className="flex justify-between"><span className="text-stone-400">{t('Insurance')}</span><span className="text-white font-medium">{formatPrice(insuranceCost)}</span></div>
                                <div className="flex justify-between"><span className="text-stone-400">{t('Extras')}</span><span className="text-white font-medium">{formatPrice(extrasCost)}</span></div>
                                <div className="flex justify-between border-t border-stone-700 pt-2 mt-1"><span className="text-stone-300 font-semibold">{t('Subtotal')}</span><span className="text-white font-semibold">{formatPrice(subtotal)}</span></div>
                                <div className="flex justify-between"><span className="text-stone-400">{t('Taxes_and_Fees')}</span><span className="text-white font-medium">{formatPrice(taxes)}</span></div>
                                <div className="flex justify-between text-lg border-t border-amber-400/20 pt-2 mt-2"><span className="text-white font-bold">{t('Total')}</span><span className="text-amber-400 font-bold">{formatPrice(total)}</span></div>
                            </div>
                            <div className="mt-4 text-xs text-stone-400 text-center">
                                {duration.days > 0 || duration.hours > 0 ? `${duration.days} ${duration.days === 1 ? t('day') : t('days')}, ${duration.hours} ${duration.hours === 1 ? t('hour') : t('hours')}` : 'Select dates to see price'}
                            </div>
                        </>
                        ) : (
                        <>
                             <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-stone-400">{formatPrice(item.pricePerDay[currency])} x {nights} {nights === 1 ? t('Night') : t('Nights')}</span><span className="text-white font-medium">{formatPrice(rentalCost)}</span></div>
                                <div className="flex justify-between"><span className="text-stone-400">{t('Taxes_and_Fees')}</span><span className="text-white font-medium">{formatPrice(taxes)}</span></div>
                                <div className="flex justify-between text-lg border-t border-amber-400/20 pt-2 mt-2"><span className="text-white font-bold">{t('Total')}</span><span className="text-amber-400 font-bold">{formatPrice(total)}</span></div>
                            </div>
                        </>
                        )}
                    </div>
                </aside>
                
                <main className="lg:col-span-2">
                    <form onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                                className="bg-stone-900/50 p-8 rounded-lg border border-stone-800"
                            >
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>
                        {step < (isCar ? 5 : 4) && (
                            <div className="flex justify-between mt-8">
                                <button type="button" onClick={handleBack} disabled={step === 1} className="px-8 py-3 bg-stone-700 text-white font-bold rounded-full hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('Back')}</button>
                                {step < (isCar ? 4 : 3) ?
                                    <button type="button" onClick={handleNext} className="px-8 py-3 bg-amber-400 text-black font-bold rounded-full hover:bg-amber-300 transition-colors">{t('Next')}</button> :
                                    <button type="submit" disabled={isProcessing} className="px-8 py-3 bg-amber-400 text-black font-bold rounded-full hover:bg-amber-300 transition-colors flex items-center justify-center disabled:bg-stone-600 disabled:cursor-not-allowed">
                                        {isProcessing ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-5 h-5 border-2 border-t-black border-stone-700/50 rounded-full inline-block mr-2"
                                                />
                                                {t('Processing')}
                                            </>
                                        ) : t('Confirm_and_Pay')}
                                    </button>
                                }
                            </div>
                        )}
                    </form>
                </main>
            </div>
        </div>
    </motion.div>
  );
};

export default BookingPage;