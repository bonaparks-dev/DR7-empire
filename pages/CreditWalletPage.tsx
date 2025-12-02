import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
      className={`relative bg-gray-900/50 backdrop-blur-sm border ${
        pkg.popular ? 'border-[#D4AF37]' : 'border-gray-800'
      } rounded-lg p-6 flex flex-col transition-all duration-300 hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#D4AF37]/20`}
    >
      {pkg.popular && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black px-4 py-1 rounded-full text-sm font-semibold">
          PIÙ SCELTO
        </div>
      )}

      <div className="text-xs text-gray-400 font-semibold mb-2">{pkg.series}</div>
      <h3 className="text-2xl font-bold text-white mb-4">{pkg.name}</h3>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">Ricarichi</div>
        <div className="text-3xl font-bold text-white">€{pkg.rechargeAmount.toLocaleString()}</div>
      </div>

      <div className="flex items-center justify-center py-2">
        <svg className="w-6 h-6 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-700">
        <div className="text-sm text-gray-400 mb-1">Ricevi</div>
        <div className="text-4xl font-extrabold text-[#D4AF37]">€{pkg.receivedAmount.toLocaleString()}</div>
        <div className="text-sm text-green-400 mt-2 font-semibold">
          +{pkg.bonusPercentage}% Bonus (€{pkg.bonus})
        </div>
      </div>

      <button
        onClick={onSelect}
        className={`w-full mt-auto py-3 px-6 font-bold rounded-full transition-all duration-300 transform hover:scale-105 ${
          pkg.popular
            ? 'bg-[#D4AF37] text-black hover:bg-[#C19B2B]'
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
      >
        Ricarica Ora
      </button>
    </motion.div>
  );
};

const CreditWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSeries, setSelectedSeries] = useState<string>('all');

  const handleSelectPackage = (packageId: string) => {
    if (user) {
      // TODO: Navigate to payment page or open payment modal
      console.log('Selected package:', packageId);
      alert('Funzionalità di pagamento in fase di implementazione');
    } else {
      navigate('/signin', { state: { from: { pathname: '/credit-wallet' } } });
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
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4">
              DR7 CREDIT WALLET
            </h1>
            <p className="text-2xl text-[#D4AF37] font-semibold mb-6">
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
            className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/30 rounded-lg p-8 mb-16"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Il credito può essere utilizzato per:
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Noleggio auto, lavaggi, meccanica, carrozzeria, diagnostica, ricambi e tutti i nostri servizi premium.
              <br />
              <span className="text-[#D4AF37] font-semibold">Il credito non ha scadenza</span> e rimane sempre disponibile nel proprio profilo personale.
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
                  className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                    selectedSeries === s
                      ? 'bg-[#D4AF37] text-black'
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
              className="bg-[#D4AF37] text-black px-12 py-4 rounded-full text-xl font-bold hover:bg-[#C19B2B] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#D4AF37]/50"
            >
              Scegli il Tuo Pacchetto
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreditWalletPage;
