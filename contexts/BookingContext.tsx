// contexts/BookingContext.tsx
import React, { createContext, useState, useMemo, useEffect, useCallback, useContext } from "react";
import type { RentalItem } from "../types";

interface BookingContextType {
  bookingItem: RentalItem | null;
  isBookingOpen: boolean;
  openBooking: (item: RentalItem) => void;
  closeBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<RentalItem | null>(null);

  // body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = isBookingOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = prev; };
  }, [isBookingOpen]);

  const openBooking = useCallback((item: RentalItem) => {
    setBookingItem(item);
    setIsBookingOpen(true);
  }, []);

  const closeBooking = useCallback(() => {
    setIsBookingOpen(false);
    // allow exit animation before clearing
    setTimeout(() => setBookingItem(null), 300);
  }, []);

  const value = useMemo(
    () => ({ bookingItem, isBookingOpen, openBooking, closeBooking }),
    [bookingItem, isBookingOpen, openBooking, closeBooking]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export function useBooking(): BookingContextType {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within <BookingProvider>");
  return ctx;
}
