import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { TicketIcon } from '../icons/Icons';
import type { LotteryTicket } from '../../types';

const TicketDisplay: React.FC<{ ticket: LotteryTicket }> = ({ ticket }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-yellow-400/30 rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-2xl shadow-yellow-400/10 h-full"
            style={{
                background: 'radial-gradient(ellipse at top right, rgba(253, 224, 71, 0.1), transparent 50%), radial-gradient(ellipse at bottom left, rgba(253, 224, 71, 0.1), transparent 50%), #1a1a1a'
            }}
        >
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
            <div className="flex justify-between items-center mb-4 z-10">
                <div className="flex items-center gap-3">
                    <img src="/DR7logo.png" alt="DR7 Logo" className="w-10 h-10 rounded-full border-2 border-yellow-400/50" />
                    <div>
                        <p className="text-sm text-yellow-400 font-bold tracking-wider">DR7 Grand Giveaway</p>
                        <p className="text-xs text-gray-400">Official Entry Ticket</p>
                    </div>
                </div>
                <TicketIcon className="w-8 h-8 text-yellow-400/70" />
            </div>

            <div className="text-center my-6 flex-grow flex flex-col justify-center z-10">
                <p className="text-xl text-gray-300 tracking-widest font-light">YOUR NUMBER</p>
                <p className="text-7xl font-black text-white tracking-wider my-3" style={{ textShadow: '0 0 20px rgba(253, 224, 71, 0.5)' }}>
                    {ticket.number.toString().padStart(6, '0')}
                </p>
            </div>
            
            <div className="border-t-2 border-dashed border-yellow-400/20 my-4 relative z-10">
                <div className="absolute -top-3 -left-8 w-6 h-6 rounded-full bg-gray-900"></div>
                <div className="absolute -top-3 -right-8 w-6 h-6 rounded-full bg-gray-900"></div>
            </div>

            <div className="text-center mb-6 z-10">
                <p className="text-sm text-gray-400 uppercase tracking-wider">Ticket Holder</p>
                <p className="text-2xl font-bold text-white truncate font-playfair">{ticket.ownerName}</p>
            </div>

            <div className="mt-auto pt-4 text-center z-10">
                <div className="bg-white p-2 inline-block rounded-lg shadow-lg mx-auto transform transition-transform hover:scale-105">
                    <QRCodeCanvas
                        value={ticket.uuid}
                        size={100}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"H"}
                        includeMargin={false}
                        imageSettings={{
                            src: "/DR7logo.png",
                            x: undefined,
                            y: undefined,
                            height: 24,
                            width: 24,
                            excavate: true,
                        }}
                    />
                </div>
                <p className="text-xs text-gray-500 font-mono mt-3 break-all opacity-70">ID: {ticket.uuid}</p>
            </div>
        </motion.div>
    );
};

export default TicketDisplay;