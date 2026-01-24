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
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
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
                                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Rimani Aggiornato</h2>
                                <p className="text-gray-400 text-sm">
                                    Non perdere le nostre offerte esclusive e novità.
                                </p>
                            </div>

                            <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
                                <p className="text-gray-300 text-sm leading-relaxed text-center">
                                    "Acconsento a ricevere comunicazioni di marketing (promo, offerte, novità) da DR7 tramite email, SMS/telefono, WhatsApp e notifiche push. Consenso facoltativo, revocabile in qualsiasi momento. Ho letto l’Informativa Privacy."
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={onConfirm}
                                    className="w-full py-3.5 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20"
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
