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
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 uppercase tracking-wider">
                LOTTERIA
              </h2>

              {/* Main message */}
              <div className="mb-6 text-white">
                <p className="text-xl md:text-2xl font-bold mb-3">
                  Ultimi biglietti disponibili.
                </p>
                <p className="text-lg md:text-xl mb-2">
                  Con 25€ puoi vincere un'auto da 50.000€.
                </p>
                <p className="text-base md:text-lg text-white/90 mb-6">
                  Ne restano pochissimi: la fortuna adesso è questione di attimi.
                </p>
              </div>

              {/* Promo packages */}
              <div className="mb-6 text-left">
                <p className="text-lg font-bold text-white mb-3 text-center">Promo pacchetti:</p>
                <div className="space-y-2 text-white/90">
                  <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg">
                    <span className="text-sm md:text-base">10 biglietti → 250€</span>
                    <span className="text-base md:text-lg font-bold text-dr7-gold">in promo 220€</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg">
                    <span className="text-sm md:text-base">50 biglietti → 1250€</span>
                    <span className="text-base md:text-lg font-bold text-dr7-gold">in promo 1100€</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg">
                    <span className="text-sm md:text-base">100 biglietti → 2500€</span>
                    <span className="text-base md:text-lg font-bold text-dr7-gold">in promo 1999€</span>
                  </div>
                </div>
              </div>

              {/* Urgency message */}
              <p className="text-base md:text-lg font-semibold text-white/90 mb-6">
                Affrettati prima che finiscano.
              </p>

              {/* CTA Button */}
              <button
                onClick={handleParticipate}
                className="w-full bg-white text-black font-bold text-lg py-4 px-8 rounded-full hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                PARTECIPA ORA
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LotteriaPopup;
