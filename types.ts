
export type Language = 'en' | 'it';

export interface Translations {
  [key: string]: {
    en: string;
    it: string;
  };
}

export interface RentalSpec {
  label: { en: string; it: string };
  value: string;
  icon: React.FC<{ className?: string }>;
}

export interface RentalItem {
  id: string;
  name: string;
  image: string;
  pricePerDay: {
    usd: number;
    eur: number;
    crypto: number;
  };
  specs: RentalSpec[];
}

export interface RentalCategory {
    id: 'cars' | 'yachts' | 'villas' | 'jets' | 'helicopters';
    label: { en: string, it: string };
    data: RentalItem[];
}

export interface MembershipTier {
  id: string;
  name: { en: string; it: string };
  price: {
    monthly: { usd: number; eur: number; crypto: number };
    annually: { usd: number; eur: number; crypto: number };
  };
  features: { en: string[]; it: string[] };
  isPopular?: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface Booking {
  bookingId: string;
  itemId: string;
  itemName: string;
  image: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  duration: string; // e.g., "2 days, 5 hours"
  totalPrice: number;
  currency: 'USD' | 'EUR';
  customer: {
    fullName: string;
    email: string;
    phone: string;
    age: number;
  };
  driverLicenseImage: string; // base64 encoded string
  paymentMethod: 'stripe' | 'crypto';
  bookedAt: string;
}
