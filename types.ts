export type Language = 'en' | 'it';
export type Currency = 'usd' | 'eur';

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

export interface HomePageService {
  id: string;
  label: { en: string, it: string };
  image: string;
  link: string;
  icon: React.FC<{ className?: string }>;
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

export interface PaymentMethod {
  id: string;
  brand: 'Visa' | 'Mastercard';
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface IDDocument {
  id: string;
  type: 'license' | 'passport';
  status: 'verified' | 'pending' | 'rejected' | 'not_uploaded';
  fileName?: string;
  uploadDate?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  profilePicture?: string; // base64 string
  membership?: {
    tierId: string;
    billingCycle: 'monthly' | 'annually';
    renewalDate: string;
  }
  paymentMethods?: PaymentMethod[];
  idDocuments?: IDDocument[];
}

export interface Booking {
  bookingId: string;
  userId: string;
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
    countryOfResidency: string;
  };
  driverLicenseImage: string; // base64 encoded string
  paymentMethod: 'stripe' | 'crypto';
  bookedAt: string;
  pickupLocation?: string;
  insuranceOption?: string; // e.g., 'premium'
  extras?: string[]; // e.g., ['gps', 'child_seat']
}

export interface Lottery {
  id: string;
  name: { en: string; it: string };
  description: { en: string; it: string };
  image: string;
  ticketPriceUSD: number;
  ticketPriceEUR: number;
  drawDate: string; // ISO string
}
