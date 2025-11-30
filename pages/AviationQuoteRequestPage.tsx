import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

const AviationQuoteRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Customer info
    customer_name: '',
    customer_email: '',
    customer_phone: '',

    // 1. Flight Details
    departure_location: '',
    arrival_location: '',
    flight_type: 'one_way',
    departure_date: '',
    departure_time: '',
    return_date: '',
    return_time: '',
    direct_flight: 'yes',
    intermediate_stops: '',
    has_flexibility: 'no',
    flexibility_details: '',
    day_night_flight: 'day',

    // 2. Passengers
    passenger_count: 1,
    has_children: 'no',
    children_details: '',
    has_pets: 'no',
    pet_details: '',
    needs_hostess: 'no',
    is_vip: 'no',
    vip_details: '',

    // 3. Luggage
    luggage_count: '',
    luggage_dimensions: '',
    has_special_equipment: 'no',
    special_equipment_details: '',
    needs_bulky_space: 'no',

    // 4. Flight Type & Preferences
    flight_purpose: '',
    main_priority: '',
    preferred_model: '',
    needs_logo: 'no',
    logo_details: '',
    needs_wifi: 'no',
    needs_catering: 'no',
    catering_details: '',
    needs_ground_transfer: 'no',
    transfer_details: '',

    // 5. Technical & Logistics
    knows_airport: 'yes',
    airport_details: '',
    is_international: 'no',
    needs_luggage_assistance: 'no',

    // 6. Economic & Administrative
    billing_type: 'individual',
    vat_number: '',
    fiscal_code: '',
    payment_method: '',
    vat_included: 'yes',
    needs_contract: 'no',

    // 7. Optional Services
    needs_insurance: 'no',
    needs_security: 'no',
    needs_crew_accommodation: 'no',
    needs_nda: 'no',

    // General notes
    notes: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Save to database
      const { error } = await supabase
        .from('aviation_quotes')
        .insert([{
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          departure_location: formData.departure_location,
          arrival_location: formData.arrival_location,
          flight_type: formData.flight_type,
          departure_date: formData.departure_date,
          return_date: formData.return_date,
          passenger_count: formData.passenger_count,
          notes: formData.notes,
          customer_type: formData.billing_type,
          direct_flight: formData.direct_flight === 'yes',
          flight_flexibility: formData.has_flexibility === 'yes' ? 'flexible' : 'fixed',
          flight_time: formData.day_night_flight,
          has_children: formData.has_children === 'yes',
          has_pets: formData.has_pets === 'yes',
          needs_hostess: formData.needs_hostess === 'yes',
          is_vip: formData.is_vip === 'yes',
          luggage_count: parseInt(formData.luggage_count) || 0,
          bulky_luggage: formData.needs_bulky_space === 'yes',
          purpose: formData.flight_purpose || 'business',
          priority: formData.main_priority || 'speed',
          needs_wifi: formData.needs_wifi === 'yes',
          needs_catering: formData.needs_catering === 'yes',
          needs_ground_transfer: formData.needs_ground_transfer === 'yes',
          known_airport: formData.knows_airport === 'yes',
          international_flight: formData.is_international === 'yes',
          needs_luggage_assistance: formData.needs_luggage_assistance === 'yes',
          payment_method: formData.payment_method || 'bank_transfer',
          vat_included: formData.vat_included === 'yes',
          needs_contract: formData.needs_contract === 'yes',
          needs_insurance: formData.needs_insurance === 'yes',
          needs_security: formData.needs_security === 'yes',
          needs_crew_accommodation: formData.needs_crew_accommodation === 'yes',
          needs_nda: formData.needs_nda === 'yes',
          status: 'pending'
        }]);

      if (error) throw error;

      // Send WhatsApp notification to office
      try {
        await fetch('/.netlify/functions/send-aviation-quote-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } catch (notificationError) {
        console.error('Failed to send WhatsApp notification:', notificationError);
      }

      // Generate comprehensive WhatsApp message for customer
      let msg = `Ciao DR7 Empire 👋\nVorrei prenotare un volo in jet privato.\n\n`;

      msg += `📇 DATI CLIENTE\n`;
      msg += `Nome: ${formData.customer_name}\n`;
      msg += `Email: ${formData.customer_email}\n`;
      msg += `Telefono / WhatsApp: ${formData.customer_phone}\n\n`;

      msg += `📍 1. DETTAGLI DEL VOLO\n`;
      msg += `• Da: ${formData.departure_location}\n`;
      msg += `• A: ${formData.arrival_location}\n`;
      msg += `• Tipo: ${formData.flight_type === 'round_trip' ? 'Andata e Ritorno' : 'Solo Andata'}\n`;
      msg += `• Data partenza: ${formData.departure_date}${formData.departure_time ? ' alle ' + formData.departure_time : ''}\n`;
      if (formData.flight_type === 'round_trip' && formData.return_date) {
        msg += `• Data ritorno: ${formData.return_date}${formData.return_time ? ' alle ' + formData.return_time : ''}\n`;
      }
      msg += `• Volo diretto: ${formData.direct_flight === 'yes' ? 'Sì' : 'No'}\n`;
      if (formData.direct_flight === 'no' && formData.intermediate_stops) {
        msg += `• Tappe intermedie: ${formData.intermediate_stops}\n`;
      }
      msg += `• Flessibilità orario/giorno: ${formData.has_flexibility === 'yes' ? 'Sì' : 'No'}\n`;
      if (formData.has_flexibility === 'yes' && formData.flexibility_details) {
        msg += `• Dettagli flessibilità: ${formData.flexibility_details}\n`;
      }
      msg += `• Volo: ${formData.day_night_flight === 'day' ? 'Diurno' : 'Notturno'}\n\n`;

      msg += `👥 2. PASSEGGERI\n`;
      msg += `• Numero passeggeri: ${formData.passenger_count}\n`;
      msg += `• Bambini/neonati: ${formData.has_children === 'yes' ? 'Sì - ' + formData.children_details : 'No'}\n`;
      msg += `• Animali: ${formData.has_pets === 'yes' ? 'Sì - ' + formData.pet_details : 'No'}\n`;
      msg += `• Assistente/hostess: ${formData.needs_hostess === 'yes' ? 'Sì' : 'No'}\n`;
      msg += `• Ospite VIP: ${formData.is_vip === 'yes' ? 'Sì - ' + (formData.vip_details || 'richiede riservatezza') : 'No'}\n\n`;

      msg += `💼 3. BAGAGLI\n`;
      msg += `• Numero bagagli: ${formData.luggage_count || 'Non specificato'}\n`;
      if (formData.luggage_dimensions) {
        msg += `• Dimensioni/peso: ${formData.luggage_dimensions}\n`;
      }
      msg += `• Attrezzature speciali: ${formData.has_special_equipment === 'yes' ? 'Sì - ' + formData.special_equipment_details : 'No'}\n`;
      msg += `• Bagagli ingombranti: ${formData.needs_bulky_space === 'yes' ? 'Sì' : 'No'}\n\n`;

      msg += `🛫 4. TIPOLOGIA VOLO E PREFERENZE\n`;
      if (formData.flight_purpose) {
        msg += `• Scopo volo: ${formData.flight_purpose}\n`;
      }
      if (formData.main_priority) {
        msg += `• Priorità principale: ${formData.main_priority}\n`;
      }
      if (formData.preferred_model) {
        msg += `• Modello preferito: ${formData.preferred_model}\n`;
      }
      msg += `• Logo aziendale: ${formData.needs_logo === 'yes' ? 'Sì - ' + formData.logo_details : 'No'}\n`;
      msg += `• Wi-Fi: ${formData.needs_wifi === 'yes' ? 'Sì' : 'No'}\n`;
      msg += `• Catering: ${formData.needs_catering === 'yes' ? 'Sì' + (formData.catering_details ? ' - ' + formData.catering_details : '') : 'No'}\n`;
      msg += `• Transfer a terra: ${formData.needs_ground_transfer === 'yes' ? 'Sì' + (formData.transfer_details ? ' - ' + formData.transfer_details : '') : 'No'}\n\n`;

      msg += `⚙️ 5. DETTAGLI TECNICI E LOGISTICI\n`;
      msg += `• Aeroporto noto: ${formData.knows_airport === 'yes' ? 'Sì' : 'No'}\n`;
      if (formData.airport_details) {
        msg += `• Dettagli: ${formData.airport_details}\n`;
      }
      msg += `• Volo internazionale: ${formData.is_international === 'yes' ? 'Sì' : 'No'}\n`;
      msg += `• Assistenza bagagli: ${formData.needs_luggage_assistance === 'yes' ? 'Sì' : 'No'}\n\n`;

      msg += `6. CONDIZIONI ECONOMICHE E AMMINISTRATIVE\n`;
      msg += `• Tipo fatturazione: ${formData.billing_type === 'company' ? 'Società' : 'Persona fisica'}\n`;
      if (formData.vat_number) {
        msg += `• P.IVA: ${formData.vat_number}\n`;
      }
      if (formData.fiscal_code) {
        msg += `• Codice fiscale: ${formData.fiscal_code}\n`;
      }
      if (formData.payment_method) {
        msg += `• Metodo pagamento: ${formData.payment_method}\n`;
      }
      msg += `• IVA: ${formData.vat_included === 'yes' ? 'Inclusa' : 'Esclusa'}\n`;
      msg += `• Contratto sub-noleggio: ${formData.needs_contract === 'yes' ? 'Sì' : 'No'}\n\n`;

      msg += `7. SERVIZI OPZIONALI O PREMIUM\n`;
      msg += `• Assicurazione full risk: ${formData.needs_insurance === 'yes' ? 'Sì' : 'No'}\n`;
      msg += `• Sicurezza privata: ${formData.needs_security === 'yes' ? 'Sì' : 'No'}\n`;
      msg += `• Pernottamento equipaggio: ${formData.needs_crew_accommodation === 'yes' ? 'Sì' : 'No'}\n`;
      msg += `• NDA richiesto: ${formData.needs_nda === 'yes' ? 'Sì' : 'No'}\n`;

      if (formData.notes) {
        msg += `\n💬 NOTE AGGIUNTIVE\n${formData.notes}\n`;
      }

      msg += `\nPotete confermare disponibilità e prezzo? Grazie 🙏`;

      const officeWhatsAppNumber = '393457905205';
      const whatsappUrl = `https://wa.me/${officeWhatsAppNumber}?text=${encodeURIComponent(msg)}`;

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
        className="max-w-5xl mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Richiedi un Preventivo Jet Privato
          </h1>
          <p className="text-xl text-gray-400">
            Voli Privati su Misura
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Compila il form e ti contatteremo entro 24 ore con un preventivo personalizzato
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 border border-gray-800 space-y-8">
          {/* Customer Info Section */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              📇 Dati Cliente
            </h3>
            <div className="space-y-4">
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
                    Telefono / WhatsApp *
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
          </div>

          {/* 1. Flight Details */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              📍 1. Dettagli del Volo
            </h3>
            <div className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Orario Partenza
                  </label>
                  <input
                    type="time"
                    value={formData.departure_time}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  />
                </div>
              </div>

              {formData.flight_type === 'round_trip' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Orario Ritorno
                    </label>
                    <input
                      type="time"
                      value={formData.return_time}
                      onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferisce un volo diretto?
                </label>
                <select
                  value={formData.direct_flight}
                  onChange={(e) => setFormData({ ...formData, direct_flight: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="yes">Sì, volo diretto</option>
                  <option value="no">No, con tappe intermedie</option>
                </select>
              </div>

              {formData.direct_flight === 'no' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Specificare tappe intermedie
                  </label>
                  <input
                    type="text"
                    value={formData.intermediate_stops}
                    onChange={(e) => setFormData({ ...formData, intermediate_stops: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                    placeholder="es. Tappa a Parigi"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Esiste flessibilità di orario o giorno?
                </label>
                <select
                  value={formData.has_flexibility}
                  onChange={(e) => setFormData({ ...formData, has_flexibility: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">No, data fissa</option>
                  <option value="yes">Sì, flessibile</option>
                </select>
              </div>

              {formData.has_flexibility === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dettagli flessibilità
                  </label>
                  <input
                    type="text"
                    value={formData.flexibility_details}
                    onChange={(e) => setFormData({ ...formData, flexibility_details: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                    placeholder="es. Disponibile anche 2-3 giorni prima/dopo"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Volo diurno o notturno?
                </label>
                <select
                  value={formData.day_night_flight}
                  onChange={(e) => setFormData({ ...formData, day_night_flight: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="day">Diurno</option>
                  <option value="night">Notturno</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Passengers */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              👥 2. Passeggeri
            </h3>
            <div className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  È previsto un bambino o un neonato?
                </label>
                <select
                  value={formData.has_children}
                  onChange={(e) => setFormData({ ...formData, has_children: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Sì</option>
                </select>
              </div>

              {formData.has_children === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dettagli bambini (età, numero)
                  </label>
                  <input
                    type="text"
                    value={formData.children_details}
                    onChange={(e) => setFormData({ ...formData, children_details: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                    placeholder="es. 1 bambino di 3 anni"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ci sono animali a bordo?
                </label>
                <select
                  value={formData.has_pets}
                  onChange={(e) => setFormData({ ...formData, has_pets: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Sì</option>
                </select>
              </div>

              {formData.has_pets === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dettagli animali (razza, dimensione, peso)
                  </label>
                  <input
                    type="text"
                    value={formData.pet_details}
                    onChange={(e) => setFormData({ ...formData, pet_details: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                    placeholder="es. Labrador, 30 kg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  È necessario un assistente personale / hostess?
                </label>
                <select
                  value={formData.needs_hostess}
                  onChange={(e) => setFormData({ ...formData, needs_hostess: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Sì</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ospite VIP o figura pubblica?
                </label>
                <select
                  value={formData.is_vip}
                  onChange={(e) => setFormData({ ...formData, is_vip: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Sì</option>
                </select>
              </div>

              {formData.is_vip === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dettagli VIP (misure di riservatezza o sicurezza)
                  </label>
                  <input
                    type="text"
                    value={formData.vip_details}
                    onChange={(e) => setFormData({ ...formData, vip_details: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                    placeholder="es. Richiesta massima discrezione"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Luggage */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              💼 3. Bagagli
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quanti bagagli avete in totale?
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.luggage_count}
                  onChange={(e) => setFormData({ ...formData, luggage_count: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="es. 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dimensione e peso approssimativo
                </label>
                <input
                  type="text"
                  value={formData.luggage_dimensions}
                  onChange={(e) => setFormData({ ...formData, luggage_dimensions: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="es. 2 valigie medie (20kg ciascuna), 1 zaino"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Avete attrezzature speciali?
                </label>
                <select
                  value={formData.has_special_equipment}
                  onChange={(e) => setFormData({ ...formData, has_special_equipment: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Sì</option>
                </select>
              </div>

              {formData.has_special_equipment === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dettagli attrezzature speciali
                  </label>
                  <input
                    type="text"
                    value={formData.special_equipment_details}
                    onChange={(e) => setFormData({ ...formData, special_equipment_details: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                    placeholder="es. Mazze da golf, strumenti musicali"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Serve spazio per bagagli ingombranti?
                </label>
                <select
                  value={formData.needs_bulky_space}
                  onChange={(e) => setFormData({ ...formData, needs_bulky_space: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Sì</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Flight Type & Preferences */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🛫 4. Tipologia di Volo e Preferenze
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo di volo
                </label>
                <input
                  type="text"
                  value={formData.flight_purpose}
                  onChange={(e) => setFormData({ ...formData, flight_purpose: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="es. Business, turistico, evento speciale"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priorità principale
                </label>
                <input
                  type="text"
                  value={formData.main_priority}
                  onChange={(e) => setFormData({ ...formData, main_priority: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="es. Velocità, lusso, risparmio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Modello di velivolo preferito (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.preferred_model}
                  onChange={(e) => setFormData({ ...formData, preferred_model: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="es. Phenom 300, Citation, Gulfstream"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Serve un logo aziendale a bordo?
                </label>
                <select
                  value={formData.needs_logo}
                  onChange={(e) => setFormData({ ...formData, needs_logo: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Sì</option>
                </select>
              </div>

              {formData.needs_logo === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dettagli logo
                  </label>
                  <input
                    type="text"
                    value={formData.logo_details}
                    onChange={(e) => setFormData({ ...formData, logo_details: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                    placeholder="Nome azienda / brand"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wi-Fi a bordo
                </label>
                <select
                  value={formData.needs_wifi}
                  onChange={(e) => setFormData({ ...formData, needs_wifi: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">Non necessario</option>
                  <option value="yes">Sì, richiesto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Catering di bordo
                </label>
                <select
                  value={formData.needs_catering}
                  onChange={(e) => setFormData({ ...formData, needs_catering: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">Non necessario</option>
                  <option value="yes">Sì, richiesto</option>
                </select>
              </div>

              {formData.needs_catering === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dettagli catering
                  </label>
                  <input
                    type="text"
                    value={formData.catering_details}
                    onChange={(e) => setFormData({ ...formData, catering_details: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                    placeholder="es. Champagne, snack, pasto completo"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transfer a terra (auto di lusso)
                </label>
                <select
                  value={formData.needs_ground_transfer}
                  onChange={(e) => setFormData({ ...formData, needs_ground_transfer: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">Non necessario</option>
                  <option value="yes">Sì, richiesto</option>
                </select>
              </div>

              {formData.needs_ground_transfer === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dettagli transfer
                  </label>
                  <input
                    type="text"
                    value={formData.transfer_details}
                    onChange={(e) => setFormData({ ...formData, transfer_details: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                    placeholder="es. Da aeroporto a hotel"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 5. Technical & Logistics */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              ⚙️ 5. Dettagli Tecnici e Logistici
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Conoscete già l'aeroporto di arrivo?
                </label>
                <select
                  value={formData.knows_airport}
                  onChange={(e) => setFormData({ ...formData, knows_airport: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="yes">Sì</option>
                  <option value="no">No, serve individuare quello più vicino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dettagli aeroporto
                </label>
                <input
                  type="text"
                  value={formData.airport_details}
                  onChange={(e) => setFormData({ ...formData, airport_details: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                  placeholder="Nome aeroporto, codice ICAO/IATA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Volo internazionale (richiede controllo passaporti)?
                </label>
                <select
                  value={formData.is_international}
                  onChange={(e) => setFormData({ ...formData, is_international: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Sì</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Serve assistenza bagagli / sicurezza all'imbarco?
                </label>
                <select
                  value={formData.needs_luggage_assistance}
                  onChange={(e) => setFormData({ ...formData, needs_luggage_assistance: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Sì</option>
                </select>
              </div>
            </div>
          </div>

          {/* 6. Economic & Administrative */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              6. Condizioni Economiche e Amministrative
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preventivo intestato a
                </label>
                <select
                  value={formData.billing_type}
                  onChange={(e) => setFormData({ ...formData, billing_type: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="individual">Persona fisica</option>
                  <option value="company">Società</option>
                </select>
              </div>

              {formData.billing_type === 'company' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Partita IVA
                  </label>
                  <input
                    type="text"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                    placeholder="IT..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Codice fiscale (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.fiscal_code}
                  onChange={(e) => setFormData({ ...formData, fiscal_code: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Metodo di pagamento preferito
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="">Seleziona</option>
                  <option value="Carta">Carta</option>
                  <option value="Bonifico">Bonifico</option>
                  <option value="Contanti">Contanti</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preventivo IVA
                </label>
                <select
                  value={formData.vat_included}
                  onChange={(e) => setFormData({ ...formData, vat_included: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="yes">Inclusa</option>
                  <option value="no">Esclusa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Serve contratto di sub-noleggio?
                </label>
                <select
                  value={formData.needs_contract}
                  onChange={(e) => setFormData({ ...formData, needs_contract: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Sì</option>
                </select>
              </div>
            </div>
          </div>

          {/* 7. Optional Services */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              7. Servizi Opzionali o Premium
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assicurazione full risk
                </label>
                <select
                  value={formData.needs_insurance}
                  onChange={(e) => setFormData({ ...formData, needs_insurance: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">Non necessario</option>
                  <option value="yes">Sì, richiesto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sicurezza privata o scorta a terra
                </label>
                <select
                  value={formData.needs_security}
                  onChange={(e) => setFormData({ ...formData, needs_security: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">Non necessario</option>
                  <option value="yes">Sì, richiesto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pernottamento equipaggio (rientro posticipato)
                </label>
                <select
                  value={formData.needs_crew_accommodation}
                  onChange={(e) => setFormData({ ...formData, needs_crew_accommodation: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">Non necessario</option>
                  <option value="yes">Sì, necessario</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Richiesta NDA (Non Disclosure Agreement)
                </label>
                <select
                  value={formData.needs_nda}
                  onChange={(e) => setFormData({ ...formData, needs_nda: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white"
                >
                  <option value="no">Non necessario</option>
                  <option value="yes">Sì, richiesto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              💬 Note Aggiuntive
            </h3>
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
            {loading ? 'Invio in corso...' : 'Richiedi Preventivo Gratuito'}
          </button>

          <p className="text-xs text-center text-gray-500">
            Verrai reindirizzato su WhatsApp con tutti i dettagli precompilati. Ti contatteremo entro 24 ore.
          </p>
        </form>

        {/* Trust Badges */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="text-xs text-gray-400">Risposta in 24h</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="text-xs text-gray-400">Preventivo Gratuito</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="text-xs text-gray-400">Voli Personalizzati</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AviationQuoteRequestPage;
