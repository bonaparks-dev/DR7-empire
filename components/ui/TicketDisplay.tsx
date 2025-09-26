import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TicketIcon } from '../icons/Icons';
import type { LotteryTicket } from '../../types';

declare global {
    interface Window {
        EasyQRCode: any;
    }
}

const TicketDisplay: React.FC<{ ticket: LotteryTicket }> = ({ ticket }) => {
    const qrCodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (qrCodeRef.current && window.EasyQRCode) {
            qrCodeRef.current.innerHTML = ''; // Clear previous QR code
            new window.EasyQRCode(qrCodeRef.current, {
                text: ticket.uuid,
                width: 100,
                height: 100,
                colorDark: "#FFFFFF",
                colorLight: "#000000",
                correctLevel: window.EasyQRCode.CorrectLevel.H,
                logo: '/DR7logo.png',
                logoWidth: 30,
                logoHeight: 30,
                logoBackgroundTransparent: true,
            });
        }
    }, [ticket.uuid]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 relative overflow-hidden flex flex-col"
        >
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-sm text-gray-400">DR7 Grand Giveaway</p>
                    <p className="text-lg font-bold text-white">Official Ticket</p>
                </div>
                <TicketIcon className="w-8 h-8 text-white/50" />
            </div>
            <div className="text-center my-4">
                <p className="text-lg text-gray-300 tracking-widest">YOUR NUMBER</p>
                <p className="text-5xl font-bold text-white tracking-wider my-2" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                    {ticket.number.toString().padStart(6, '0')}
                </p>
            </div>
            
            <div className="border-t border-dashed border-gray-600 my-4"></div>

            <div className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Ticket Holder</p>
                <p className="text-lg font-bold text-white truncate">{ticket.ownerName}</p>
            </div>

            <div className="mt-auto pt-4 text-center">
                <div className="bg-black p-1 inline-block rounded-md shadow-lg w-[108px] h-[108px] mx-auto">
                    <div ref={qrCodeRef} className="w-[100px] h-[100px] mx-auto">
                        {/* QR Code will be generated here */}
                    </div>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-2 break-all">ID: {ticket.uuid}</p>
            </div>
        </motion.div>
    );
};

export default TicketDisplay;