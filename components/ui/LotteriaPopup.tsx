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
            className="relative bg-gradient-to-b from-gray-900 via-black to-black border-2 border-dr7-gold/50 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Gold accent bars */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-dr7-gold via-yellow-400 to-dr7-gold" />
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-dr7-gold via-yellow-400 to-dr7-gold" />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10 bg-white/10 hover:bg-white/20 rounded-full p-1.5"
              aria-label="Close popup"
            >
              <XIcon className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="px-6 py-8 text-center">
              {/* Icon */}
              <div className="mb-4 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-dr7-gold via-yellow-500 to-yellow-600 flex items-center justify-center shadow-xl ring-4 ring-dr7-gold/20">
                  <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                LOTTERIA
              </h2>

              {/* Subtitle */}
              <p className="text-lg md:text-xl font-semibold text-dr7-gold mb-8 leading-tight">
                Vinci un'Alfa Romeo<br />Stelvio Quadrifoglio
              </p>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="text-dr7-gold text-2xl font-bold mb-1">€50.000</div>
                  <div className="text-white/70 text-xs uppercase tracking-wider">Valore</div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="text-dr7-gold text-2xl font-bold mb-1">€25</div>
                  <div className="text-white/70 text-xs uppercase tracking-wider">Biglietto</div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="text-dr7-gold text-lg font-bold mb-1">24 Dicembre</div>
                  <div className="text-white/70 text-xs uppercase tracking-wider">Estrazione</div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="text-dr7-gold text-lg font-bold mb-1">2.000</div>
                  <div className="text-white/70 text-xs uppercase tracking-wider">Biglietti</div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleParticipate}
                className="w-full bg-gradient-to-r from-dr7-gold via-yellow-500 to-yellow-600 text-black font-bold text-lg py-4 px-8 rounded-full hover:from-yellow-600 hover:via-yellow-500 hover:to-dr7-gold transition-all duration-300 transform hover:scale-[1.02] shadow-xl hover:shadow-2xl mb-4"
              >
                PARTECIPA ORA
              </button>

              {/* Footer text */}
              <p className="text-xs text-white/50 leading-relaxed">
                Estrazione supervisionata da avvocato<br />
                Trasparenza totale garantita
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LotteriaPopup;
