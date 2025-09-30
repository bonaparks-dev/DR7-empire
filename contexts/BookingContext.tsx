import React, { createContext, useState, useMemo, useEffect } from 'react';
import type { RentalItem } from '../types';

interface BookingContextType {
  bookingItem: RentalItem | null;
  isBookingOpen: boolean;
  bookingCategory: 'yachts' | 'villas' | 'cars' | null;
  openBooking: (item: RentalItem, categoryId: 'yachts' | 'villas' | 'cars') => void;
  closeBooking: () => void;

  // Car booking wizard state
  isCarWizardOpen: boolean;
  openCarWizard: (item: RentalItem) => void;
  closeCarWizard: () => void;
  selectedCar: RentalItem | null;
}

export const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<RentalItem | null>(null);
  const [bookingCategory, setBookingCategory] = useState<'yachts' | 'villas' | 'cars' | null>(null);

  const [isCarWizardOpen, setCarWizardOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<RentalItem | null>(null);


  useEffect(() => {
    if (isBookingOpen || isCarWizardOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isBookingOpen, isCarWizardOpen]);


  const openBooking = (item: RentalItem, categoryId: 'yachts' | 'villas' | 'cars') => {
    setBookingItem(item);
    setBookingCategory(categoryId);
    setIsBookingOpen(true);
  };

  const closeBooking = () => {
    setIsBookingOpen(false);
    setTimeout(() => {
        setBookingItem(null);
        setBookingCategory(null);
    }, 300);
  };

  const openCarWizard = (item: RentalItem) => {
    setSelectedCar(item);
    setCarWizardOpen(true);
  }

  const closeCarWizard = () => {
    setCarWizardOpen(false);
    setTimeout(() => {
      setSelectedCar(null);
    }, 300);
  }
  
  const value = useMemo(() => ({
    bookingItem,
    isBookingOpen,
    bookingCategory,
    openBooking,
    closeBooking,
    isCarWizardOpen,
    openCarWizard,
    closeCarWizard,
    selectedCar,
  }), [bookingItem, isBookingOpen, bookingCategory, isCarWizardOpen, selectedCar]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};