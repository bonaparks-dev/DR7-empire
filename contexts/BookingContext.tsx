import React, { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import type { RentalItem } from '../types';

interface BookingContextType {
  bookingItem: RentalItem | null;
  isBookingOpen: boolean;
  bookingCategory: 'yachts' | 'villas' | 'cars' | null;
  openBooking: (item: RentalItem, categoryId: 'yachts' | 'villas' | 'cars') => void;
  closeBooking: () => void;

  // Car booking wizard state
  isCarWizardOpen: boolean;
  openCarWizard: (item: RentalItem, categoryContext?: string) => void;
  closeCarWizard: () => void;
  selectedCar: RentalItem | null;
  wizardCategory: string | null;
}

export const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<RentalItem | null>(null);
  const [bookingCategory, setBookingCategory] = useState<'yachts' | 'villas' | 'cars' | null>(null);

  const [isCarWizardOpen, setCarWizardOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<RentalItem | null>(null);

  const [wizardCategory, setWizardCategory] = useState<string | null>(null);

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


  const openBooking = useCallback((item: RentalItem, categoryId: 'yachts' | 'villas' | 'cars') => {
    setBookingItem(item);
    setBookingCategory(categoryId);
    setIsBookingOpen(true);
  }, []);

  const closeBooking = useCallback(() => {
    setIsBookingOpen(false);
    setTimeout(() => {
      setBookingItem(null);
      setBookingCategory(null);
    }, 300);
  }, []);

  const openCarWizard = useCallback((item: RentalItem, categoryContext?: string) => {
    console.log('BookingContext openCarWizard called with:', item, 'categoryContext:', categoryContext);
    setSelectedCar(item);
    setWizardCategory(categoryContext || null);
    setCarWizardOpen(true);
  }, []);

  const closeCarWizard = useCallback(() => {
    setCarWizardOpen(false);
    setTimeout(() => {
      setSelectedCar(null);
      setWizardCategory(null);
    }, 300);
  }, []);

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
    wizardCategory
  }), [bookingItem, isBookingOpen, bookingCategory, openBooking, closeBooking, isCarWizardOpen, openCarWizard, closeCarWizard, selectedCar, wizardCategory]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};