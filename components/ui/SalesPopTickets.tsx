import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '../icons/Icons';

interface TicketPurchase {
  id: string;
  name: string;
  location: string;
  quantity: number;
  timeAgo: string;
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

const generateRandomPurchase = (): TicketPurchase => {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const quantity = Math.floor(Math.random() * 4) + 1; // 1-4 tickets
  const minutes = Math.floor(Math.random() * 15) + 1; // 1-15 minutes
  const timeAgo = minutes === 1 ? "1 minuto fa" : `${minutes} minuti fa`;

  return {
    id: `${Date.now()}-${Math.random()}`,
    name,
    location,
    quantity,
    timeAgo
  };
};

const INITIAL_PURCHASES: TicketPurchase[] = [
  { id: "1", name: "Alessandro", location: "Cagliari", quantity: 1, timeAgo: "2 minuti fa" },
  { id: "2", name: "Giulia", location: "Olbia", quantity: 3, timeAgo: "4 minuti fa" },
  { id: "3", name: "Francesco", location: "Quartucciu", quantity: 2, timeAgo: "5 minuti fa" },
  { id: "4", name: "Valeria", location: "Villasimius", quantity: 1, timeAgo: "7 minuti fa" },
  { id: "5", name: "Lorenzo", location: "Sassari", quantity: 4, timeAgo: "8 minuti fa" },
  { id: "6", name: "Marta", location: "Oristano", quantity: 2, timeAgo: "10 minuti fa" },
  { id: "7", name: "Nicola", location: "Carbonia", quantity: 1, timeAgo: "11 minuti fa" },
  { id: "8", name: "Serena", location: "Pula", quantity: 3, timeAgo: "13 minuti fa" },
];

const SalesPopTickets: React.FC = () => {
  const [purchases, setPurchases] = useState<TicketPurchase[]>(INITIAL_PURCHASES);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (isClosed) return;

    // Add a new purchase every 8-12 seconds
    const interval = setInterval(() => {
      const newPurchase = generateRandomPurchase();
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -100, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-6 left-6 z-50 max-w-sm"
    >
      <div className="bg-black/95 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Gold accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-dr7-gold via-yellow-400 to-dr7-gold" />

        {/* Header */}
        <div className="px-4 py-3 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dr7-gold to-yellow-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-white">Acquisti Recenti</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Close notification"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* List of buyers */}
        <div className="max-h-80 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {purchases.map((purchase) => {
              const bigliettiText = purchase.quantity === 1 ? "biglietto" : "biglietti";
              return (
                <motion.div
                  key={purchase.id}
                  layout
                  initial={{ opacity: 0, height: 0, x: -20 }}
                  animate={{ opacity: 1, height: "auto", x: 0 }}
                  exit={{ opacity: 0, height: 0, x: 20 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    height: { duration: 0.3 },
                    layout: { duration: 0.3 }
                  }}
                  className="px-4 py-3 border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium leading-tight">
                        <span className="font-bold">{purchase.name}</span>
                        <span className="text-white/70 text-xs"> ({purchase.location})</span>
                      </p>
                      <p className="text-xs text-white/80 mt-1">
                        <span className="font-semibold text-dr7-gold">{purchase.quantity} {bigliettiText}</span>
                      </p>
                    </div>
                    <div className="ml-3 text-right">
                      <p className="text-xs text-white/60 whitespace-nowrap">
                        {purchase.timeAgo}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-white/5 border-t border-white/10">
          <p className="text-xs text-white/60 text-center">
            Acquisti in tempo reale
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SalesPopTickets;
