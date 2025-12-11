import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import type { Stripe, StripeElements } from '@stripe/stripe-js';
import { addCredits } from '../utils/creditWallet';

interface CreditPackage {
  id: string;
  series: string;
  name: string;
  rechargeAmount: number;
  receivedAmount: number;
  bonus: number;
  bonusPercentage: number;
  popular?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  // STARTER SERIES
  {
    id: 'starter-50',
    series: 'STARTER SERIES',
    name: 'Starter 50',
    rechargeAmount: 50,
    receivedAmount: 60,
    bonus: 10,
    bonusPercentage: 20
  },
  {
    id: 'starter-100',
    series: 'STARTER SERIES',
    name: 'Starter 100',
    rechargeAmount: 100,
    receivedAmount: 120,
    bonus: 20,
    bonusPercentage: 20
  },
  // BOOSTER SERIES
  {
    id: 'booster-200',
    series: 'BOOSTER SERIES',
    name: 'Booster 200',
    rechargeAmount: 200,
    receivedAmount: 240,
    bonus: 40,
    bonusPercentage: 20
  },
  {
    id: 'booster-300',
    series: 'BOOSTER SERIES',
    name: 'Booster 300',
    rechargeAmount: 300,
    receivedAmount: 370,
    bonus: 70,
    bonusPercentage: 23,
    popular: true
  },
  // POWER SERIES
  {
    id: 'power-500',
    series: 'POWER SERIES',
    name: 'Power 500',
    rechargeAmount: 500,
    receivedAmount: 650,
    bonus: 150,
    bonusPercentage: 30
  },
  {
    id: 'power-750',
    series: 'POWER SERIES',
    name: 'Power 750',
    rechargeAmount: 750,
    receivedAmount: 1000,
    bonus: 250,
    bonusPercentage: 33
  },
  // PREMIUM SERIES
  {
    id: 'premium-1000',
    series: 'PREMIUM SERIES',
    name: 'Premium 1.000',
    rechargeAmount: 1000,
    receivedAmount: 1500,
    bonus: 500,
    bonusPercentage: 50
  },
  {
    id: 'premium-2000',
    series: 'PREMIUM SERIES',
    name: 'Premium 2.000',
    rechargeAmount: 2000,
    receivedAmount: 3200,
    bonus: 1200,
    bonusPercentage: 60
  },
  // ELITE SERIES
  {
    id: 'elite-5000',
    series: 'ELITE SERIES',
    name: 'Elite 5.000',
    rechargeAmount: 5000,
    receivedAmount: 9000,
    bonus: 4000,
    bonusPercentage: 80
  }
];

const PackageCard: React.FC<{ pkg: CreditPackage; onSelect: () => void }> = ({ pkg, onSelect }) => {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      variants={cardVariants}
      className={`relative bg-gray-900/50 backdrop-blur-sm border ${pkg.popular ? 'border-white' : 'border-gray-800'
        } rounded-lg p-6 flex flex-col transition-all duration-300 hover:border-white hover:shadow-xl hover:shadow-white/20`}
    >
      {pkg.popular && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-sm font-semibold">
          PIÙ SCELTO
        </div>
      )}

      <div className="text-xs text-gray-400 font-semibold mb-2">{pkg.series}</div>
      <h3 className="text-2xl font-bold text-white mb-4">{pkg.name}</h3>

      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1">Ricarichi</div>
        <div className="text-xl font-semibold text-gray-300">{pkg.rechargeAmount.toLocaleString()}</div>
      </div>

      <div className="flex items-center justify-center py-2">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-700">
        <div className="text-sm text-gray-400 mb-1">Ricevi</div>
        <div className="text-5xl font-extrabold text-white">{pkg.receivedAmount.toLocaleString()}</div>
        <div className="text-lg text-white mt-3 font-bold">
          +{pkg.bonusPercentage}% Bonus ({pkg.bonus})
        </div>
      </div>

      <button
        onClick={onSelect}
        className={`w-full mt-auto py-3 px-6 font-bold rounded-full transition-all duration-300 transform hover:scale-105 ${pkg.popular
            ? 'bg-white text-black hover:bg-gray-200'
            : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
      >
        Ricarica Ora
      </button>
    </motion.div>
  );
};

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51S3dDjQcprtTyo8tBfBy5mAZj8PQXkxfZ1RCnWskrWFZ2WEnm1u93ZnE2tBi316Gz2CCrvLV98IjSoiXb0vSDpOQ003fNG69Y2';

const CreditWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isClientSecretLoading, setIsClientSecretLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Customer info
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    codiceFiscale: '',
    indirizzo: '',
    numeroCivico: '',
    cittaResidenza: '',
    codicePostale: '',
    provinciaResidenza: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(true);

  // Initialize Stripe
  useEffect(() => {
    if ((window as any).Stripe) {
      if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('YOUR_')) {
        console.error("Stripe.js has loaded, but the publishable key is not set.");
        setStripeError("Payment service is not configured correctly. Please contact support.");
        return;
      }
      const stripeInstance = (window as any).Stripe(STRIPE_PUBLISHABLE_KEY);
      setStripe(stripeInstance);
      setElements(stripeInstance.elements());
    }
  }, []);

  // Pre-fill user data from customers_extended table
  useEffect(() => {
    if (user) {
      const fetchCustomerData = async () => {
        try {
          // Try to get customer data from customers_extended table
          const { data: customerData, error } = await supabase
            .from('customers_extended')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!error && customerData) {
            // Pre-fill all fields from database
            setFormData({
              fullName: customerData.tipo_cliente === 'azienda'
                ? customerData.denominazione || ''
                : `${customerData.nome || ''} ${customerData.cognome || ''}`.trim(),
              email: customerData.email || user.email || '',
              phone: customerData.telefono || user.phone || '',
              codiceFiscale: customerData.codice_fiscale || customerData.codice_fiscale_pa || customerData.partita_iva || '',
              indirizzo: customerData.indirizzo || customerData.indirizzo_azienda || '',
              numeroCivico: '',
              cittaResidenza: customerData.citta || '',
              codicePostale: '',
              provinciaResidenza: ''
            });

            // Check if essential data is present
            const isComplete =
              (customerData.tipo_cliente === 'azienda' ? customerData.denominazione : (customerData.nome && customerData.cognome)) &&
              (customerData.email || user.email) &&
              (customerData.telefono || user.phone) &&
              (customerData.codice_fiscale || customerData.codice_fiscale_pa || customerData.partita_iva) &&
              (customerData.indirizzo || customerData.indirizzo_azienda) &&
              customerData.citta;

            if (isComplete) {
              setIsEditing(false);
            }
          } else {
            // Fallback to basic user data
            setFormData(prev => ({
              ...prev,
              fullName: user.fullName || '',
              email: user.email || '',
              phone: user.phone || ''
            }));
          }
        } catch (err) {
          console.error('Error fetching customer data:', err);
          // Fallback to basic user data
          setFormData(prev => ({
            ...prev,
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || ''
          }));
        }
      };

      fetchCustomerData();
    }
  }, [user]);

  // Create payment intent when modal opens
  useEffect(() => {
    if (showPaymentModal && selectedPackage) {
      setIsClientSecretLoading(true);
      setStripeError(null);
      setClientSecret(null);

      fetch('/.netlify/functions/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPackage.rechargeAmount,
          currency: 'eur',
          email: user?.email,
          purchaseType: 'credit-wallet',
          metadata: {
            packageId: selectedPackage.id,
            packageName: selectedPackage.name,
            receivedAmount: selectedPackage.receivedAmount,
            bonus: selectedPackage.bonus
          }
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setStripeError(data.error);
          } else {
            setClientSecret(data.clientSecret);
          }
        })
        .catch(error => {
          console.error('Failed to fetch client secret:', error);
          setStripeError('Could not connect to payment server.');
        })
        .finally(() => {
          setIsClientSecretLoading(false);
        });
    }
  }, [showPaymentModal, selectedPackage, user]);

  // Mount Stripe card element
  useEffect(() => {
    if (elements && clientSecret && cardElementRef.current && showPaymentModal) {
      const existingCard = elements.getElement('card');
      if (existingCard) {
        existingCard.unmount();
      }

      const timer = setTimeout(() => {
        if (cardElementRef.current) {
          const card = elements.create('card', {
            style: {
              base: {
                color: '#ffffff',
                fontFamily: '"Exo 2", sans-serif',
                fontSize: '16px',
                '::placeholder': { color: '#a0aec0' }
              },
              invalid: { color: '#ef4444', iconColor: '#ef4444' }
            }
          });

          try {
            card.mount(cardElementRef.current);
            card.on('change', (event) => {
              setStripeError(event.error ? event.error.message : null);
            });
          } catch (error) {
            console.error('Error mounting Stripe card element:', error);
            setStripeError('Failed to load payment form. Please refresh the page.');
          }
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        const card = elements.getElement('card');
        if (card) {
          card.unmount();
        }
      };
    }
  }, [elements, clientSecret, showPaymentModal]);

  // Validation functions
  const validateCodiceFiscale = (cf: string): boolean => {
    const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
    return cf.length === 16 && cfRegex.test(cf.toUpperCase());
  };

  const validateItalianPhone = (phone: string): boolean => {
    const phoneRegex = /^(\+39|0039)?[\s]?[0-9]{9,13}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'codiceFiscale' || name === 'provinciaResidenza') {
      newValue = value.toUpperCase();
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Il nome è obbligatorio';
    if (!formData.email) newErrors.email = 'L\'email è obbligatoria';
    if (!formData.phone) {
      newErrors.phone = 'Il telefono è obbligatorio';
    } else if (!validateItalianPhone(formData.phone)) {
      newErrors.phone = 'Formato telefono non valido';
    }
    if (!formData.codiceFiscale) {
      newErrors.codiceFiscale = 'Codice Fiscale è obbligatorio';
    } else if (!validateCodiceFiscale(formData.codiceFiscale)) {
      newErrors.codiceFiscale = 'Codice Fiscale non valido (16 caratteri)';
    }
    if (!formData.indirizzo) newErrors.indirizzo = 'Indirizzo è obbligatorio';
    if (!formData.cittaResidenza) newErrors.cittaResidenza = 'Città è obbligatoria';
    if (!formData.codicePostale) newErrors.codicePostale = 'CAP è obbligatorio';
    if (!formData.provinciaResidenza) newErrors.provinciaResidenza = 'Provincia è obbligatoria';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectPackage = (packageId: string) => {
    if (user) {
      const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
      if (pkg) {
        setSelectedPackage(pkg);
        setShowPaymentModal(true);
      }
    } else {
      navigate('/signin', { state: { from: { pathname: '/credit-wallet' } } });
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!stripe || !elements || !clientSecret || !selectedPackage) {
      setStripeError("Payment system is not ready.");
      return;
    }

    setIsProcessing(true);
    setStripeError(null);

    try {
      const cardElement = elements.getElement('card');
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone
          }
        }
      });

      if (error) {
        setStripeError(error.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // Save credit wallet purchase to database
      const { data, error: dbError } = await supabase
        .from('credit_wallet_purchases')
        .insert([{
          user_id: user?.id || null,
          package_id: selectedPackage.id,
          package_name: selectedPackage.name,
          package_series: selectedPackage.series,
          recharge_amount: selectedPackage.rechargeAmount,
          received_amount: selectedPackage.receivedAmount,
          bonus_amount: selectedPackage.bonus,
          bonus_percentage: selectedPackage.bonusPercentage,
          payment_intent_id: paymentIntent?.id,
          payment_status: 'paid',
          currency: 'EUR',
          customer_name: formData.fullName,
          customer_email: formData.email,
          customer_phone: formData.phone,
          customer_codice_fiscale: formData.codiceFiscale,
          customer_indirizzo: formData.indirizzo,
          customer_numero_civico: formData.numeroCivico,
          customer_citta: formData.cittaResidenza,
          customer_cap: formData.codicePostale,
          customer_provincia: formData.provinciaResidenza,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save purchase record');
      }

      // Add credits to user's balance
      if (user?.id) {
        const creditResult = await addCredits(
          user.id,
          selectedPackage.receivedAmount,
          `Ricarica ${selectedPackage.name}`,
          data?.id,
          'credit_purchase'
        );

        if (!creditResult.success) {
          console.error('Failed to add credits:', creditResult.error);
          throw new Error('Failed to add credits to balance');
        }
      }

      // Show success message
      alert(`Ricarica completata con successo!\n\nHai ricaricato: €${selectedPackage.rechargeAmount}\nRiceverai: €${selectedPackage.receivedAmount}\nBonus: €${selectedPackage.bonus} (+${selectedPackage.bonusPercentage}%)`);

      setShowPaymentModal(false);
      setSelectedPackage(null);
      setIsProcessing(false);

      // Redirect to account page
      if (user?.role === 'business') {
        navigate('/partner/dashboard');
      } else {
        navigate('/account');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setStripeError(error.message || 'Payment processing failed');
      setIsProcessing(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const series = ['all', 'STARTER SERIES', 'BOOSTER SERIES', 'POWER SERIES', 'PREMIUM SERIES', 'ELITE SERIES'];
  const filteredPackages = selectedSeries === 'all'
    ? CREDIT_PACKAGES
    : CREDIT_PACKAGES.filter(pkg => pkg.series === selectedSeries);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="pt-32 pb-24 bg-black min-h-screen">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-4">
              DR7 CREDIT WALLET
            </h1>
            <p className="text-2xl text-white font-semibold mb-6">
              Ricarica. Guadagna. Vivi l'esperienza DR7.
            </p>
            <p className="text-gray-300 text-lg max-w-4xl mx-auto leading-relaxed">
              Il DR7 Credit Wallet è il sistema esclusivo che permette ai nostri clienti di ricaricare il proprio credito e ottenere immediatamente un valore aggiuntivo significativo.
              Una soluzione innovativa, sicura e trasparente, pensata per offrire vantaggi concreti a chi utilizza con frequenza i servizi DR7.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Fino all'80% Extra</h3>
              <p className="text-gray-400">Credito bonus a seconda del pacchetto scelto</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Nessuna Scadenza</h3>
              <p className="text-gray-400">Il credito rimane sempre disponibile nel tuo profilo</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">100% Sicuro</h3>
              <p className="text-gray-400">Pagamenti certificati e controllati</p>
            </div>
          </motion.div>

          {/* Services Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-r from-white/10 to-transparent border border-white/30 rounded-lg p-8 mb-16"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Il credito può essere utilizzato per:
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Noleggio auto, lavaggi, meccanica, carrozzeria, diagnostica, ricambi e tutti i nostri servizi premium.
              <br />
              <span className="text-white font-semibold">Il credito non ha scadenza</span> e rimane sempre disponibile nel proprio profilo personale.
            </p>
          </motion.div>

          {/* Series Filter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white text-center mb-6">
              PACCHETTI DI RICARICA LINEA UFFICIALE DR7
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {series.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeries(s)}
                  className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${selectedSeries === s
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  {s === 'all' ? 'Tutti i Pacchetti' : s}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Packages Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          >
            {filteredPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSelect={() => handleSelectPackage(pkg.id)}
              />
            ))}
          </motion.div>

          {/* Advantages Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-8 mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              VANTAGGI DEL DR7 CREDIT WALLET
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Fino all'80% di credito extra</h3>
                <p className="text-gray-400">A seconda del pacchetto scelto</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Pagamenti più rapidi</h3>
                <p className="text-gray-400">Senza pensieri e completamente automatici</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Nessuna scadenza del credito</h3>
                <p className="text-gray-400">Usa il credito quando vuoi</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Maggior convenienza</h3>
                <p className="text-gray-400">Per chi utilizza spesso i nostri servizi</p>
              </div>
            </div>
          </motion.div>

          {/* Transparency Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg p-8 mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              TRASPARENZA E SICUREZZA
            </h2>
            <div className="space-y-4 text-gray-300 max-w-3xl mx-auto">
              <p>• Tutti i pagamenti vengono gestiti tramite sistemi certificati e controllati.</p>
              <p>• Ogni ricarica viene registrata, accreditata in tempo reale e visibile nel proprio profilo cliente.</p>
              <p>• Il credito non scade e può essere utilizzato in qualsiasi momento presso tutte le sedi DR7 S.p.A.</p>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center"
          >
            <h2 className="text-4xl font-extrabold text-white mb-6">
              ATTIVA ORA IL TUO WALLET DR7
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Scegli il pacchetto più adatto a te e inizia subito a risparmiare sui servizi DR7.
            </p>
            <button
              onClick={() => {
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="bg-white text-black px-12 py-4 rounded-full text-xl font-bold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-white/50"
            >
              Scegli il Tuo Pacchetto
            </button>
          </motion.div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedPackage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full my-8"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Completa la Ricarica
                    </h2>
                    <p className="text-gray-400">
                      {selectedPackage.name} - {selectedPackage.series}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handlePayment} className="p-6 space-y-6">
                {/* Package Summary */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-xs">Ricarichi</span>
                    <span className="text-gray-300 font-semibold">{selectedPackage.rechargeAmount}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Bonus (+{selectedPackage.bonusPercentage}%)</span>
                    <span className="text-white font-bold text-xl">{selectedPackage.bonus}</span>
                  </div>
                  <div className="border-t border-gray-700 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold text-lg">Ricevi</span>
                    <span className="text-white font-bold text-3xl">{selectedPackage.receivedAmount}</span>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Informazioni Cliente</h3>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-gray-400 hover:text-white underline transition-colors"
                      >
                        Modifica
                      </button>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Intestatario</p>
                          <p className="text-white font-medium">{formData.fullName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Codice Fiscale / P.IVA</p>
                          <p className="text-white font-medium">{formData.codiceFiscale}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Contatti</p>
                          <div className="text-white/80 text-sm">
                            <p>{formData.email}</p>
                            <p>{formData.phone}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Indirizzo</p>
                          <p className="text-white/80 text-sm">
                            {formData.indirizzo} {formData.numeroCivico}<br />
                            {formData.codicePostale} {formData.cittaResidenza} ({formData.provinciaResidenza})
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        />
                        {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        />
                        {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Telefono *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+39 320 1234567"
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        />
                        {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Codice Fiscale *</label>
                        <input
                          type="text"
                          name="codiceFiscale"
                          value={formData.codiceFiscale}
                          onChange={handleChange}
                          maxLength={16}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white uppercase"
                        />
                        {errors.codiceFiscale && <p className="text-xs text-red-400 mt-1">{errors.codiceFiscale}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Indirizzo *</label>
                        <input
                          type="text"
                          name="indirizzo"
                          value={formData.indirizzo}
                          onChange={handleChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        />
                        {errors.indirizzo && <p className="text-xs text-red-400 mt-1">{errors.indirizzo}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">N. Civico</label>
                        <input
                          type="text"
                          name="numeroCivico"
                          value={formData.numeroCivico}
                          onChange={handleChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Città *</label>
                        <input
                          type="text"
                          name="cittaResidenza"
                          value={formData.cittaResidenza}
                          onChange={handleChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        />
                        {errors.cittaResidenza && <p className="text-xs text-red-400 mt-1">{errors.cittaResidenza}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">CAP *</label>
                        <input
                          type="text"
                          name="codicePostale"
                          value={formData.codicePostale}
                          onChange={handleChange}
                          maxLength={5}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                        />
                        {errors.codicePostale && <p className="text-xs text-red-400 mt-1">{errors.codicePostale}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Provincia *</label>
                        <input
                          type="text"
                          name="provinciaResidenza"
                          value={formData.provinciaResidenza}
                          onChange={handleChange}
                          maxLength={2}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white uppercase"
                        />
                        {errors.provinciaResidenza && <p className="text-xs text-red-400 mt-1">{errors.provinciaResidenza}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Informazioni di Pagamento</h3>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-h-[56px] flex items-center">
                    {isClientSecretLoading ? (
                      <div className="flex items-center text-gray-400 text-sm">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-t-white border-gray-600 rounded-full mr-2"
                        />
                        <span>Inizializzazione pagamento...</span>
                      </div>
                    ) : (
                      <div ref={cardElementRef} className="w-full" />
                    )}
                  </div>
                  {stripeError && <p className="text-xs text-red-400 mt-2">{stripeError}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-full font-bold hover:bg-gray-700 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || isClientSecretLoading}
                    className="flex-1 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Elaborazione...' : `Paga €${selectedPackage.rechargeAmount}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CreditWalletPage;
