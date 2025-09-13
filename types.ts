
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

export interface Amenity {
  icon: React.FC<{ className?: string }>;
  title: { en: string; it: string };
  description: { en: string; it: string };
}

export interface RentalItem {
  id: string;
  name: string;
  image: string;
  pricePerDay?: {
    usd: number;
    eur: number;
    crypto: number;
  };
  specs: RentalSpec[];

  // New optional fields for villas
  location?: string;
  distanceToBeach?: string;
  size?: string;
  images?: string[];
  description?: { en: string; it: string };
  amenities?: Amenity[];
  features?: { en: string[]; it: string[] };
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
  phone?: string;
  profilePicture?: string; // base64 string
  membership?: {
    tierId: string;
    billingCycle: 'monthly' | 'annually';
    renewalDate: string;
  };
  verification?: {
    idStatus: 'none' | 'pending' | 'verified';
    idFrontImage?: string;
    idBackImage?: string;
    cardStatus: 'none' | 'verified';
    cardLast4?: string;
    cardExpiry?: string;
    cardholderName?: string;
    phoneStatus: 'none' | 'verified';
  };
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

export interface Villa {
  id: number;
  title: string;
  location: string;
  distanceToBeach: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  description: string | { en: string; it: string };
  rating?: number;
  reviewCount?: number;
  size?: string;
  amenities?: Amenity[];
  features?: { en: string[]; it: string[] };
}
