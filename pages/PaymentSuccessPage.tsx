import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const orderId = searchParams.get('codTrans') || searchParams.get('orderId');
    const amount = searchParams.get('importo');
    const authCode = searchParams.get('codAut');

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Pagamento Riuscito!
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Il tuo pagamento è stato elaborato con successo.
                    </p>

                    {orderId && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                            <h3 className="font-semibold text-gray-700 mb-3">Dettagli Transazione</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ID Ordine:</span>
                                    <span className="font-mono text-gray-900">{orderId}</span>
                                </div>
                                {amount && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Importo:</span>
                                        <span className="font-semibold text-gray-900">€{(parseInt(amount) / 100).toFixed(2)}</span>
                                    </div>
                                )}
                                {authCode && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Codice Autorizzazione:</span>
                                        <span className="font-mono text-gray-900">{authCode}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                        >
                            Torna alla Home
                        </button>

                        <button
                            onClick={() => navigate('/account/bookings')}
                            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                        >
                            Vedi le Mie Prenotazioni
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
