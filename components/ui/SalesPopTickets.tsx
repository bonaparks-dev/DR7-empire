import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '../icons/Icons';

interface TicketPurchase {
  name: string;
  location: string;
  quantity: number;
  timeAgo: string;
}

const TICKET_PURCHASES: TicketPurchase[] = [
  { name: "Alessandro", location: "Cagliari", quantity: 1, timeAgo: "2 minuti fa" },
  { name: "Giulia", location: "Olbia", quantity: 3, timeAgo: "4 minuti fa" },
  { name: "Francesco", location: "Quartucciu", quantity: 2, timeAgo: "5 minuti fa" },
  { name: "Valeria", location: "Villasimius", quantity: 1, timeAgo: "7 minuti fa" },
  { name: "Lorenzo", location: "Sassari", quantity: 4, timeAgo: "8 minuti fa" },
  { name: "Marta", location: "Oristano", quantity: 2, timeAgo: "10 minuti fa" },
  { name: "Nicola", location: "Carbonia", quantity: 1, timeAgo: "11 minuti fa" },
  { name: "Serena", location: "Pula", quantity: 3, timeAgo: "13 minuti fa" },
  { name: "Davide", location: "Iglesias", quantity: 2, timeAgo: "15 minuti fa" },
  { name: "Chiara", location: "Nuoro", quantity: 1, timeAgo: "3 minuti fa" },
  { name: "Marco", location: "Alghero", quantity: 2, timeAgo: "6 minuti fa" },
  { name: "Sofia", location: "Quartu Sant'Elena", quantity: 4, timeAgo: "9 minuti fa" },
  { name: "Luca", location: "Selargius", quantity: 1, timeAgo: "12 minuti fa" },
  { name: "Elena", location: "Assemini", quantity: 3, timeAgo: "14 minuti fa" },
  { name: "Andrea", location: "Porto Torres", quantity: 2, timeAgo: "16 minuti fa" },
  { name: "Federica", location: "Monserrato", quantity: 1, timeAgo: "1 minuto fa" },
  { name: "Simone", location: "Capoterra", quantity: 2, timeAgo: "5 minuti fa" },
  { name: "Alessia", location: "Sant'Antioco", quantity: 3, timeAgo: "8 minuti fa" },
];

const SalesPopTickets: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (isClosed) return;

    // Rotate notification every 6-7 seconds
    const rotationInterval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % TICKET_PURCHASES.length);
        setIsVisible(true);
      }, 500); // Wait for fade out before showing next
    }, 6500);

    return () => clearInterval(rotationInterval);
  }, [isClosed]);

  const handleClose = () => {
    setIsClosed(true);
  };

  if (isClosed) return null;

  const currentPurchase = TICKET_PURCHASES[currentIndex];
  const bigliettiText = currentPurchase.quantity === 1 ? "biglietto" : "biglietti";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-6 z-50 max-w-xs"
        >
          <div className="bg-black/90 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl p-4 relative">
            {/* Gold accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-dr7-gold via-yellow-400 to-dr7-gold rounded-t-2xl" />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <XIcon className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="pr-6">
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-dr7-gold to-yellow-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                  </svg>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium leading-tight">
                    <span className="font-bold">{currentPurchase.name}</span>
                    <span className="text-white/80"> ({currentPurchase.location})</span>
                  </p>
                  <p className="text-sm text-white/90 mt-1">
                    ha acquistato <span className="font-semibold text-dr7-gold">{currentPurchase.quantity} {bigliettiText}</span>
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {currentPurchase.timeAgo}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SalesPopTickets;
