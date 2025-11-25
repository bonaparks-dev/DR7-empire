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
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-dr7-gold to-yellow-600 flex items-center justify-center">
                  <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                LOTTERIA DR7 S.p.A.
              </h2>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl font-semibold text-dr7-gold mb-6">
                Vinci un'Alfa Romeo Stelvio Quadrifoglio
              </p>

              {/* Details */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-center gap-2 text-white/90">
                  <svg className="w-5 h-5 text-dr7-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg font-semibold">Valore: ¬50.000</span>
                </div>

                <div className="flex items-center justify-center gap-2 text-white/90">
                  <svg className="w-5 h-5 text-dr7-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                  </svg>
                  <span className="text-lg font-semibold">Biglietto: ¬25</span>
                </div>

                <div className="flex items-center justify-center gap-2 text-white/90">
                  <svg className="w-5 h-5 text-dr7-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg font-semibold">Estrazione: 24 Dicembre</span>
                </div>

                <div className="flex items-center justify-center gap-2 text-white/90">
                  <svg className="w-5 h-5 text-dr7-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg font-semibold">Solo 2.000 biglietti</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleParticipate}
                className="w-full bg-gradient-to-r from-dr7-gold to-yellow-600 text-black font-bold text-lg py-4 px-8 rounded-full hover:from-yellow-600 hover:to-dr7-gold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                PARTECIPA ORA
              </button>

              {/* Footer text */}
              <p className="text-xs text-white/60 mt-6">
                Estrazione supervisionata da avvocato " Trasparenza totale garantita
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LotteriaPopup;
