import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const PaymentSuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [updating, setUpdating] = useState(true);
    const [updateError, setUpdateError] = useState<string | null>(null);

    const orderId = searchParams.get('codTrans') || searchParams.get('orderId') || searchParams.get('paymentid');
    const amount = searchParams.get('importo');
    const authCode = searchParams.get('codAut');

    // Update booking status to completed immediately
    useEffect(() => {
        const updateBookingStatus = async () => {
            if (!orderId) {
                console.warn('No orderId found in URL parameters');
                setUpdating(false);
                return;
            }

            try {
                console.log('Updating booking status for orderId:', orderId);

                // Find booking by nexi_order_id or id
                const { data: bookings, error: fetchError } = await supabase
                    .from('bookings')
                    .select('*')
                    .or(`id.eq.${orderId},nexi_order_id.eq.${orderId}`)
                    .limit(1);

                if (fetchError) {
                    console.error('Error fetching booking:', fetchError);
                    setUpdateError('Could not find booking');
                    setUpdating(false);
                    return;
                }

                if (!bookings || bookings.length === 0) {
                    console.error('Booking not found for orderId:', orderId);
                    setUpdateError('Booking not found');
                    setUpdating(false);
                    return;
                }

                const booking = bookings[0];
                console.log('Found booking:', booking.id);

                // Update to completed
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update({
                        payment_status: 'completed',
                        nexi_payment_id: orderId,
                        nexi_authorization_code: authCode || null,
                        payment_completed_at: new Date().toISOString()
                    })
                    .eq('id', booking.id);

                if (updateError) {
                    console.error('Error updating booking:', updateError);
                    setUpdateError('Could not update booking status');
                } else {
                    console.log('✅ Booking marked as completed:', booking.id);
                }
            } catch (error) {
                console.error('Unexpected error:', error);
                setUpdateError('An error occurred');
            } finally {
                setUpdating(false);
            }
        };

        updateBookingStatus();
    }, [orderId, authCode]);

    if (updating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center">
                        <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Completamento Pagamento...
                        </h1>
                        <p className="text-gray-600">
                            Stiamo confermando il tuo pagamento
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <span className="text-5xl">✅</span>
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
