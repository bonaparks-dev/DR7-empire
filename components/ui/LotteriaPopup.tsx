import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { XIcon } from '../icons/Icons';

const LotteriaPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has already seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem('lotteriaPopupSeen');

    if (!hasSeenPopup) {
      // Show popup after 1 second delay
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('lotteriaPopupSeen', 'true');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleParticipate = () => {
    setIsOpen(false);
    navigate('/commercial-operation');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-black border-2 border-white/30 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            {/* Gold accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-dr7-gold via-yellow-400 to-dr7-gold" />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
              aria-label="Close popup"
            >
              <XIcon className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="p-8 text-center">
              {/* Title */}
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 uppercase tracking-wider">
                LOTTERIA
              </h2>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl font-semibold text-white/90 mb-8">
                Vinci un'Alfa Romeo Stelvio Quadrifoglio
              </p>

              {/* Details */}
              <div className="space-y-4 mb-8 text-white/80">
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-lg">
                  <span className="text-sm uppercase tracking-wider">Valore</span>
                  <span className="text-lg font-bold">€50.000</span>
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-lg">
                  <span className="text-sm uppercase tracking-wider">Biglietto</span>
                  <span className="text-lg font-bold">€25</span>
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-lg">
                  <span className="text-sm uppercase tracking-wider">Estrazione</span>
                  <span className="text-lg font-bold">24 Dicembre</span>
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-lg">
                  <span className="text-sm uppercase tracking-wider">Biglietti</span>
                  <span className="text-lg font-bold">2.000</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleParticipate}
                className="w-full bg-white text-black font-bold text-lg py-4 px-8 rounded-full hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                PARTECIPA ORA
              </button>

              {/* Footer text */}
              <p className="text-xs text-white/60 mt-6">
                Estrazione supervisionata da avvocato • Trasparenza totale garantita
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LotteriaPopup;
