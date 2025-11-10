import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

const AviationQuoteRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    departure_location: '',
    arrival_location: '',
    flight_type: 'one_way',
    departure_date: '',
    return_date: '',
    passenger_count: 1,
    notes: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('aviation_quotes')
        .insert([{
          ...formData,
          customer_type: 'individual',
          direct_flight: true,
          flight_flexibility: 'flexible',
          flight_time: 'day',
          has_children: false,
          has_pets: false,
          needs_hostess: false,
          is_vip: false,
          luggage_count: 0,
          bulky_luggage: false,
          purpose: 'business',
          priority: 'speed',
          needs_wifi: false,
          needs_catering: false,
          needs_ground_transfer: false,
          known_airport: true,
          international_flight: false,
          needs_luggage_assistance: false,
          payment_method: 'bank_transfer',
          vat_included: true,
          needs_contract: false,
          needs_insurance: false,
          needs_security: false,
          needs_crew_accommodation: false,
          needs_nda: false,
          status: 'pending'
        }]);

      if (error) throw error;

      // Send WhatsApp notification
      try {
        await fetch('/.netlify/functions/send-aviation-quote-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } catch (notificationError) {
        console.error('Failed to send WhatsApp notification:', notificationError);
        // Don't fail the whole process if notification fails
      }

      // Generate WhatsApp prefilled message for customer
      const flightType = formData.flight_type === 'round_trip' ? 'Andata/Ritorno' : 'Solo Andata';
      const customerName = formData.customer_name;

      let whatsappMessage = `Ciao! Ho appena richiesto un preventivo per un volo privato sul vostro sito.\n\n` +
        `🚁 *Richiesta Preventivo Jet/Elicottero*\n` +
        `*Nome:* ${customerName}\n` +
        `*Email:* ${formData.customer_email}\n` +
        `*Telefono:* ${formData.customer_phone}\n` +
        `*Da:* ${formData.departure_location}\n` +
        `*A:* ${formData.arrival_location}\n` +
        `*Tipo:* ${flightType}\n` +
        `*Data Partenza:* ${new Date(formData.departure_date).toLocaleDateString('it-IT')}\n`;

      if (formData.flight_type === 'round_trip' && formData.return_date) {
        whatsappMessage += `*Data Ritorno:* ${new Date(formData.return_date).toLocaleDateString('it-IT')}\n`;
      }

      whatsappMessage += `*Passeggeri:* ${formData.passenger_count}\n`;

      if (formData.notes) {
        whatsappMessage += `*Note:* ${formData.notes}\n`;
      }

      whatsappMessage += `\nGrazie!`;

      const officeWhatsAppNumber = '393457905205';
      const whatsappUrl = `https://wa.me/${officeWhatsAppNumber}?text=${encodeURIComponent(whatsappMessage)}`;

      // Open WhatsApp in a new tab after a short delay
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1000);

      // Show success message
      alert('Richiesta preventivo inviata con successo! Ti contatteremo entro 24 ore.');
      navigate('/');
    } catch (error) {
      console.error('Failed to submit quote request:', error);
      alert('Errore durante l\'invio della richiesta. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🚁 Richiedi un Preventivo
          </h1>
          <p className="text-xl text-gray-400">
            Elicotteri & Jet Privati
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Compila il form e ti contatteremo entro 24 ore con un preventivo personalizzato
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 border border-gray-800 space-y-6">
          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">📋 I Tuoi Dati</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                placeholder="Mario Rossi"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="mario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefono *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="+39 333 123 4567"
                />
              </div>
            </div>
          </div>

          {/* Flight Details */}
          <div className="space-y-4 border-t border-gray-800 pt-6">
            <h3 className="text-xl font-semibold text-white mb-4">✈️ Dettagli del Volo</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Da (Partenza) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.departure_location}
                  onChange={(e) => setFormData({ ...formData, departure_location: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="Milano Linate (LIN)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  A (Arrivo) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.arrival_location}
                  onChange={(e) => setFormData({ ...formData, arrival_location: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="Roma Fiumicino (FCO)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo di Volo *
              </label>
              <select
                value={formData.flight_type}
                onChange={(e) => setFormData({ ...formData, flight_type: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
              >
                <option value="one_way">Solo Andata</option>
                <option value="round_trip">Andata e Ritorno</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data Partenza *
                </label>
                <input
                  type="date"
                  required
                  value={formData.departure_date}
                  onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>

              {formData.flight_type === 'round_trip' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data Ritorno
                  </label>
                  <input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    min={formData.departure_date}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Numero Passeggeri *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={formData.passenger_count}
                onChange={(e) => setFormData({ ...formData, passenger_count: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4 border-t border-gray-800 pt-6">
            <h3 className="text-xl font-semibold text-white mb-4">💬 Note Aggiuntive</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
              placeholder="Eventuali richieste speciali, bagagli particolari, servizi extra..."
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">
              📞 Cosa succede dopo?
            </h4>
            <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
              <li>Riceverai una conferma via email</li>
              <li>Il nostro team ti contatterà entro 24 ore</li>
              <li>Ti invieremo un preventivo personalizzato</li>
              <li>Potrai richiedere modifiche o confermare il volo</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 px-6 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? 'Invio in corso...' : '🚁 Richiedi Preventivo Gratuito'}
          </button>

          <p className="text-xs text-center text-gray-500">
            Nessun pagamento richiesto ora. Riceverai il preventivo via email.
          </p>
        </form>

        {/* Trust Badges */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-xs text-gray-400">Risposta in 24h</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-xs text-gray-400">Preventivo Gratuito</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="text-2xl mb-2">✈️</div>
            <div className="text-xs text-gray-400">Voli Personalizzati</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AviationQuoteRequestPage;
