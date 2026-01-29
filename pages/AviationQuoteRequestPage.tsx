import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';

const AviationQuoteRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { lang } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  // Determine if jet or helicopter based on URL
  const isHelicopter = location.pathname.includes('helicopter');
  const serviceType = isHelicopter ? 'Elicottero' : 'Jet Privato';

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    departure_location: '',
    arrival_location: '',
    departure_date: '',
    return_date: '',
    passenger_count: 1,
    notes: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Generate WhatsApp message
      let msg = `Ciao DR7 Empire\nVorrei richiedere un preventivo per ${serviceType}.\n\n`;

      msg += `DATI CLIENTE\n`;
      msg += `Nome: ${formData.customer_name}\n`;
      msg += `Email: ${formData.customer_email}\n`;
      msg += `Telefono: ${formData.customer_phone}\n\n`;

      msg += `DETTAGLI RICHIESTA\n`;
      msg += `Partenza: ${formData.departure_location}\n`;
      msg += `Arrivo: ${formData.arrival_location}\n`;
      msg += `Data partenza: ${formData.departure_date}\n`;
      if (formData.return_date) {
        msg += `Data ritorno: ${formData.return_date}\n`;
      }
      msg += `Passeggeri: ${formData.passenger_count}\n`;

      if (formData.notes) {
        msg += `\nNote: ${formData.notes}\n`;
      }

      msg += `\nPotete fornirmi un preventivo? Grazie!`;

      const whatsappUrl = `https://wa.me/393457905205?text=${encodeURIComponent(msg)}`;
      window.open(whatsappUrl, '_blank');

      // Show success and redirect
      alert('Richiesta inviata! Ti contatteremo presto.');
      navigate('/');
    } catch (error) {
      console.error('Failed to submit quote request:', error);
      alert('Errore durante l\'invio della richiesta. Riprova.');
    } finally {
      setSubmitting(false);
    }
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black py-20 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">{lang === 'it' ? 'Caricamento...' : 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Require authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-black py-20 px-4">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
            <div className="mb-6">
              <svg className="w-20 h-20 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              {lang === 'it' ? 'Accesso Richiesto' : 'Login Required'}
            </h2>
            <p className="text-gray-400 mb-8">
              {lang === 'it'
                ? 'Devi essere registrato e aver effettuato l\'accesso per richiedere un preventivo.'
                : 'You must be registered and logged in to request a quote.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/signin', { state: { from: location.pathname } })}
                className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors"
              >
                {lang === 'it' ? 'Accedi' : 'Login'}
              </button>
              <button
                onClick={() => navigate('/signup', { state: { from: location.pathname } })}
                className="px-8 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
              >
                {lang === 'it' ? 'Registrati' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto pt-12"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Richiedi Preventivo {serviceType}
          </h1>
          <p className="text-gray-400">
            Compila il form e ti contatteremo con un preventivo personalizzato
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 space-y-6">
          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Dati Cliente</h3>

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
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-lg font-semibold text-white">Dettagli Viaggio</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Partenza da *
                </label>
                <input
                  type="text"
                  required
                  value={formData.departure_location}
                  onChange={(e) => setFormData({ ...formData, departure_location: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="Milano, Roma, Cagliari..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Arrivo a *
                </label>
                <input
                  type="text"
                  required
                  value={formData.arrival_location}
                  onChange={(e) => setFormData({ ...formData, arrival_location: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="Parigi, Londra, Ibiza..."
                />
              </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data Ritorno (opzionale)
                </label>
                <input
                  type="date"
                  value={formData.return_date}
                  onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  min={formData.departure_date || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>
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
          <div className="pt-4 border-t border-gray-800">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Note Aggiuntive
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
              placeholder="Richieste speciali, bagagli, preferenze..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-white text-black font-bold py-4 px-6 rounded-full hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {submitting ? 'Invio in corso...' : 'Richiedi Preventivo'}
          </button>

          <p className="text-xs text-center text-gray-500">
            Verrai reindirizzato su WhatsApp. Ti contatteremo entro 24 ore con un preventivo personalizzato.
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default AviationQuoteRequestPage;
