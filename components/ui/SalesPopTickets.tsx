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
];

const SalesPopTickets: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosed, setIsClosed] = useState(false);

  const handleClose = () => {
    setIsClosed(true);
  };

  if (isClosed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100, y: 20 }}
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
            <div className="max-h-80 overflow-y-auto">
              {TICKET_PURCHASES.map((purchase, index) => {
                const bigliettiText = purchase.quantity === 1 ? "biglietto" : "biglietti";
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
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
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-white/5 border-t border-white/10">
              <p className="text-xs text-white/60 text-center">
                Acquisti in tempo reale
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SalesPopTickets;
