import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '../icons/Icons';

interface TicketPurchase {
  id: string;
  name: string;
  location: string;
  quantity: number;
  minutesAgo: number;
}

const NAMES = [
  "Alessandro", "Giulia", "Francesco", "Valeria", "Lorenzo", "Marta",
  "Nicola", "Serena", "Davide", "Chiara", "Marco", "Sofia",
  "Luca", "Elena", "Andrea", "Federica", "Simone", "Alessia",
  "Matteo", "Martina", "Gabriele", "Beatrice", "Riccardo", "Camilla",
  "Tommaso", "Elisa", "Federico", "Giorgia", "Antonio", "Sara"
];

const LOCATIONS = [
  "Cagliari", "Olbia", "Quartucciu", "Villasimius", "Sassari",
  "Oristano", "Carbonia", "Pula", "Iglesias", "Nuoro",
  "Alghero", "Quartu Sant'Elena", "Selargius", "Assemini",
  "Porto Torres", "Monserrato", "Capoterra", "Sant'Antioco",
  "Arzachena", "La Maddalena", "Tempio Pausania", "Siniscola"
];

const generateRandomPurchase = (minutesAgo: number): TicketPurchase => {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const quantity = Math.floor(Math.random() * 4) + 1; // 1-4 tickets

  return {
    id: `${Date.now()}-${Math.random()}`,
    name,
    location,
    quantity,
    minutesAgo
  };
};

const INITIAL_PURCHASES: TicketPurchase[] = [
  { id: "1", name: "Alessandro", location: "Cagliari", quantity: 1, minutesAgo: 2 },
  { id: "2", name: "Giulia", location: "Olbia", quantity: 3, minutesAgo: 4 },
  { id: "3", name: "Francesco", location: "Quartucciu", quantity: 2, minutesAgo: 5 },
  { id: "4", name: "Valeria", location: "Villasimius", quantity: 1, minutesAgo: 7 },
  { id: "5", name: "Lorenzo", location: "Sassari", quantity: 4, minutesAgo: 8 },
  { id: "6", name: "Marta", location: "Oristano", quantity: 2, minutesAgo: 10 },
  { id: "7", name: "Nicola", location: "Carbonia", quantity: 1, minutesAgo: 11 },
  { id: "8", name: "Serena", location: "Pula", quantity: 3, minutesAgo: 13 },
];

const SalesPopTickets: React.FC = () => {
  const [purchases, setPurchases] = useState<TicketPurchase[]>(INITIAL_PURCHASES);
  const [isClosed, setIsClosed] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  // Update all timestamps every minute
  useEffect(() => {
    if (isClosed) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const minutesElapsed = Math.floor((now - lastUpdateTime) / 60000);

      if (minutesElapsed >= 1) {
        setPurchases(prev =>
          prev.map(purchase => ({
            ...purchase,
            minutesAgo: purchase.minutesAgo + minutesElapsed
          }))
        );
        setLastUpdateTime(now);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isClosed, lastUpdateTime]);

  // Add new purchases
  useEffect(() => {
    if (isClosed) return;

    // Add a new purchase every 8-12 seconds
    const interval = setInterval(() => {
      const newPurchase = generateRandomPurchase(0); // New purchase is "just now" (0 minutes ago)
      setPurchases(prev => {
        // Add new purchase at the beginning, keep only last 8
        return [newPurchase, ...prev].slice(0, 8);
      });
    }, Math.random() * 4000 + 8000); // Random between 8-12 seconds

    return () => clearInterval(interval);
  }, [isClosed]);

  const handleClose = () => {
    setIsClosed(true);
  };

  if (isClosed) return null;

  const formatTimeAgo = (minutes: number): string => {
    if (minutes === 0) return "adesso";
    if (minutes === 1) return "1 min fa";
    return `${minutes} min fa`;
  };

  // Only show the most recent purchase on mobile
  const displayPurchases = purchases.slice(0, 1);

  return (
    <AnimatePresence>
      {displayPurchases.map((purchase) => {
        const bigliettiText = purchase.quantity === 1 ? "biglietto" : "biglietti";
        return (
          <motion.div
            key={purchase.id}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", damping: 20, stiffness: 150 }}
            onAnimationComplete={() => {
              // Auto-hide after 2 seconds
              setTimeout(() => {
                setPurchases(prev => prev.filter(p => p.id !== purchase.id));
              }, 2000);
            }}
            className="fixed bottom-4 left-4 z-50 max-w-[220px] md:max-w-xs"
          >
            <div className="bg-black/95 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl relative overflow-hidden">
              {/* Gold accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-dr7-gold via-yellow-400 to-dr7-gold" />

              {/* Content */}
              <div className="px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-dr7-gold to-yellow-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white font-semibold leading-tight truncate">
                      {purchase.name}
                    </p>
                    <p className="text-[9px] text-dr7-gold font-medium">
                      {purchase.quantity} {bigliettiText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
};

export default SalesPopTickets;
