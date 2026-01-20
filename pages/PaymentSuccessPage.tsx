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

    // URL base per le Netlify Functions
    const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_BASE ?? (window.location.hostname === 'localhost' ? 'http://localhost:8888' : window.location.origin);
    const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

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

                    // --- SEND NOTIFICATIONS ---
                    // 1. Email Confirmation
                    fetch(`${FUNCTIONS_BASE}/.netlify/functions/send-booking-confirmation`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ booking: { ...booking, payment_status: 'completed' } }), // ensure status is current
                    }).catch(e => console.error('Email error', e));

                    // 2. WhatsApp Admin Notification
                    fetch(`${FUNCTIONS_BASE}/.netlify/functions/send-whatsapp-notification`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ booking: { ...booking, payment_status: 'completed' } }),
                    }).catch(e => console.error('WhatsApp error', e));

                    // 3. Prepare Customer WhatsApp Message (for button)
                    if (booking.booking_details?.customer) {
                        const bId = booking.id.substring(0, 8).toUpperCase();
                        const customer = booking.booking_details.customer;
                        const pDate = new Date(booking.pickup_date);
                        const dDate = new Date(booking.dropoff_date);
                        const price = (booking.price_total / 100).toFixed(2);

                        const msg = `Ciao! Ho appena completato il pagamento per la prenotazione.\n\n` +
                            `📋 *Dettagli Prenotazione*\n` +
                            `*ID:* DR7-${bId}\n` +
                            `*Nome:* ${customer.fullName}\n` +
                            `*Veicolo:* ${booking.vehicle_name}\n` +
                            `*Ritiro:* ${pDate.toLocaleDateString('it-IT')} ${pDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n` +
                            `*Riconsegna:* ${dDate.toLocaleDateString('it-IT')} ${dDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n` +
                            `*Totale:* €${price}\n\n` +
                            `Grazie!`;

                        const officeNum = '393457905205';
                        setWhatsappUrl(`https://wa.me/${officeNum}?text=${encodeURIComponent(msg)}`);
                    }
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

                        {whatsappUrl && (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-[#25D366] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.698c1.09.587 2.107.89 3.037.89h.007c3.181 0 5.768-2.587 5.768-5.776 0-1.545-.6-2.994-1.692-4.085-1.096-1.09-2.55-1.693-4.316-1.693l.002.015zm6.814 10.373c-1.045 1.049-2.227 1.58-3.567 1.458-1.5-.138-3.037-1.127-4.436-2.527-1.4-1.4-2.39-2.936-2.527-4.436-.122-1.341.408-2.523 1.458-3.567l.156-.155c.319-.317.76-.325 1.082-.016l1.373 1.346c.321.319.311.751.01.996l-.974.795c-.295.241-.482.72.064 1.266.545.546 1.023.36 1.265.064l.795-.974c.245-.301.677-.311.996.01l1.347 1.373c.31.322.302.763-.017 1.082l-.155.156z" />
                                </svg>
                                Conferma su WhatsApp
                            </a>
                        )}

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
