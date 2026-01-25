import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '../icons/Icons';

interface MarketingConsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const MarketingConsentModal: React.FC<MarketingConsentModalProps> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-black border border-gray-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
                            aria-label="Close"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>

                        <div className="p-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Rimani Aggiornato</h2>
                                <p className="text-gray-400 text-sm">
                                    Non perdere le nostre offerte esclusive e novità.
                                </p>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-800">
                                <p className="text-gray-300 text-sm leading-relaxed text-center">
                                    "Acconsento a ricevere comunicazioni di marketing (promo, offerte, novità) da DR7 tramite email, SMS/telefono, WhatsApp e notifiche push. Consenso facoltativo, revocabile in qualsiasi momento. Ho letto l'Informativa Privacy."
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={onConfirm}
                                    className="w-full py-3.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                                >
                                    Acconsento
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 text-gray-500 font-medium hover:text-white transition-colors text-sm"
                                >
                                    Non accetto, grazie
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MarketingConsentModal;
