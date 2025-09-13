import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CheckEmailPage: React.FC = () => {
    const location = useLocation();
    const email = location.state?.email;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8"
        >
            <div className="w-full max-w-md space-y-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-2xl shadow-black/50 p-8 space-y-6"
                >
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-700">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white">Check your email</h2>
                    <p className="text-gray-300">
                        We've sent a confirmation link to your email address
                        {email && <strong className="block font-medium text-white mt-2">{email}</strong>}
                    </p>
                    <p className="text-sm text-gray-400">
                        Please click the link in the email to complete your registration.
                    </p>
                    <div className="pt-2">
                        <Link to="/" className="font-medium text-white hover:text-gray-300 underline">
                            Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default CheckEmailPage;
