import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancelPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Pagamento Annullato
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Il pagamento è stato annullato. Nessun addebito è stato effettuato.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                        >
                            Torna alla Home
                        </button>

                        <button
                            onClick={() => window.history.back()}
                            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                        >
                            Riprova il Pagamento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancelPage;
