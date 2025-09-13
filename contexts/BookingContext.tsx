import React, { createContext, useState, useMemo, useEffect } from 'react';
import type { RentalItem } from '../types';

interface BookingContextType {
  bookingItem: RentalItem | null;
  isBookingOpen: boolean;
  openBooking: (item: RentalItem) => void;
  closeBooking: () => void;
}

export const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<RentalItem | null>(null);

  useEffect(() => {
    if (isBookingOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isBookingOpen]);


  const openBooking = (item: RentalItem) => {
    setBookingItem(item);
    setIsBookingOpen(true);
  };

  const closeBooking = () => {
    setIsBookingOpen(false);
    // Delay clearing the item to allow for exit animation
    setTimeout(() => {
        setBookingItem(null);
    }, 300);
  };
  
  const value = useMemo(() => ({
    bookingItem,
    isBookingOpen,
    openBooking,
    closeBooking,
  }), [bookingItem, isBookingOpen]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};