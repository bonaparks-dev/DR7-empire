import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HelicopterBookingForm: React.FC = () => {
  const navigate = useNavigate();
  const WHATSAPP_NUMBER = "393457905205";

  const [formData, setFormData] = useState({
    // Customer info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",

    // 1. Flight Details
    departureLocation: "",
    arrivalLocation: "",
    tripType: "one_way", // one_way, round_trip
    flightDate: "",
    flightTime: "",
    returnDate: "",
    returnTime: "",
    directFlight: "yes",
    intermediateStops: "",
    hasFlexibility: "no",
    flexibilityDetails: "",
    dayNightFlight: "day",

    // 2. Passengers
    passengerCount: "",
    hasChildren: "no",
    childrenDetails: "",
    hasPets: "no",
    petDetails: "",
    needsHostess: "no",
    isVIP: "no",
    vipDetails: "",

    // 3. Luggage
    luggageCount: "",
    luggageDimensions: "",
    hasSpecialEquipment: "no",
    specialEquipmentDetails: "",
    needsBulkySpace: "no",

    // 4. Flight Type & Preferences
    flightPurpose: "",
    mainPriority: "",
    preferredModel: "",
    needsLogo: "no",
    logoDetails: "",
    needsWifi: "no",
    needsCatering: "no",
    cateringDetails: "",
    needsGroundTransfer: "no",
    transferDetails: "",

    // 5. Technical & Logistics
    knowsAirport: "yes",
    airportDetails: "",
    needsRooftopLanding: "no",
    landingLocationDetails: "",
    needsLuggageAssistance: "no",

    // 6. Economic & Administrative
    billingType: "individual",
    vatNumber: "",
    fiscalCode: "",
    paymentMethod: "",
    vatIncluded: "yes",
    needsContract: "no",

    // 7. Optional Services
    needsInsurance: "no",
    needsSecurity: "no",
    needsCrewAccommodation: "no",
    needsNDA: "no",

    // General notes
    notes: "",
    terms: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Inserisci il tuo nome";
    if (!formData.lastName.trim()) newErrors.lastName = "Inserisci il tuo cognome";
    if (!formData.email.trim()) newErrors.email = "Inserisci la tua email";
    if (!formData.phone.trim()) newErrors.phone = "Inserisci il tuo numero WhatsApp";
    if (!formData.departureLocation.trim()) newErrors.departureLocation = "Inserisci il luogo di partenza";
    if (!formData.arrivalLocation.trim()) newErrors.arrivalLocation = "Inserisci il luogo di arrivo";
    if (!formData.flightDate.trim()) newErrors.flightDate = "Seleziona la data del volo";
    if (!formData.passengerCount.trim()) newErrors.passengerCount = "Inserisci il numero di passeggeri";
    if (!formData.terms) newErrors.terms = "Devi accettare i termini e le condizioni";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Build comprehensive WhatsApp message
    let msg = `Ciao DR7 Empire 👋\nVorrei prenotare un volo in elicottero.\n\n`;

    msg += `📇 DATI CLIENTE\n`;
    msg += `Nome: ${formData.firstName} ${formData.lastName}\n`;
    msg += `Email: ${formData.email}\n`;
    msg += `Telefono / WhatsApp: ${formData.phone}\n\n`;

    msg += `📍 1. DETTAGLI DEL VOLO\n`;
    msg += `• Da: ${formData.departureLocation}\n`;
    msg += `• A: ${formData.arrivalLocation}\n`;
    msg += `• Tipo: ${formData.tripType === 'round_trip' ? 'Andata e Ritorno' : 'Solo Andata'}\n`;
    msg += `• Data partenza: ${formData.flightDate}${formData.flightTime ? ' alle ' + formData.flightTime : ''}\n`;
    if (formData.tripType === 'round_trip' && formData.returnDate) {
      msg += `• Data ritorno: ${formData.returnDate}${formData.returnTime ? ' alle ' + formData.returnTime : ''}\n`;
    }
    msg += `• Volo diretto: ${formData.directFlight === 'yes' ? 'Sì' : 'No'}\n`;
    if (formData.directFlight === 'no' && formData.intermediateStops) {
      msg += `• Tappe intermedie: ${formData.intermediateStops}\n`;
    }
    msg += `• Flessibilità orario/giorno: ${formData.hasFlexibility === 'yes' ? 'Sì' : 'No'}\n`;
    if (formData.hasFlexibility === 'yes' && formData.flexibilityDetails) {
      msg += `• Dettagli flessibilità: ${formData.flexibilityDetails}\n`;
    }
    msg += `• Volo: ${formData.dayNightFlight === 'day' ? 'Diurno' : 'Notturno'}\n\n`;

    msg += `👥 2. PASSEGGERI\n`;
    msg += `• Numero passeggeri: ${formData.passengerCount}\n`;
    msg += `• Bambini/neonati: ${formData.hasChildren === 'yes' ? 'Sì - ' + formData.childrenDetails : 'No'}\n`;
    msg += `• Animali: ${formData.hasPets === 'yes' ? 'Sì - ' + formData.petDetails : 'No'}\n`;
    msg += `• Assistente/hostess: ${formData.needsHostess === 'yes' ? 'Sì' : 'No'}\n`;
    msg += `• Ospite VIP: ${formData.isVIP === 'yes' ? 'Sì - ' + (formData.vipDetails || 'richiede riservatezza') : 'No'}\n\n`;

    msg += `💼 3. BAGAGLI\n`;
    msg += `• Numero bagagli: ${formData.luggageCount || 'Non specificato'}\n`;
    if (formData.luggageDimensions) {
      msg += `• Dimensioni/peso: ${formData.luggageDimensions}\n`;
    }
    msg += `• Attrezzature speciali: ${formData.hasSpecialEquipment === 'yes' ? 'Sì - ' + formData.specialEquipmentDetails : 'No'}\n`;
    msg += `• Bagagli ingombranti: ${formData.needsBulkySpace === 'yes' ? 'Sì' : 'No'}\n\n`;

    msg += `4. TIPOLOGIA VOLO E PREFERENZE\n`;
    if (formData.flightPurpose) {
      msg += `• Scopo volo: ${formData.flightPurpose}\n`;
    }
    if (formData.mainPriority) {
      msg += `• Priorità principale: ${formData.mainPriority}\n`;
    }
    if (formData.preferredModel) {
      msg += `• Modello preferito: ${formData.preferredModel}\n`;
    }
    msg += `• Logo aziendale: ${formData.needsLogo === 'yes' ? 'Sì - ' + formData.logoDetails : 'No'}\n`;
    msg += `• Wi-Fi: ${formData.needsWifi === 'yes' ? 'Sì' : 'No'}\n`;
    msg += `• Catering: ${formData.needsCatering === 'yes' ? 'Sì' + (formData.cateringDetails ? ' - ' + formData.cateringDetails : '') : 'No'}\n`;
    msg += `• Transfer a terra: ${formData.needsGroundTransfer === 'yes' ? 'Sì' + (formData.transferDetails ? ' - ' + formData.transferDetails : '') : 'No'}\n\n`;

    msg += `5. DETTAGLI TECNICI E LOGISTICI\n`;
    msg += `• Aeroporto/eliporto noto: ${formData.knowsAirport === 'yes' ? 'Sì' : 'No'}\n`;
    if (formData.airportDetails) {
      msg += `• Dettagli: ${formData.airportDetails}\n`;
    }
    msg += `• Atterraggio su rooftop/terreno privato: ${formData.needsRooftopLanding === 'yes' ? 'Sì' : 'No'}\n`;
    if (formData.landingLocationDetails) {
      msg += `• Località atterraggio: ${formData.landingLocationDetails}\n`;
    }
    msg += `• Assistenza bagagli: ${formData.needsLuggageAssistance === 'yes' ? 'Sì' : 'No'}\n\n`;

    msg += `6. CONDIZIONI ECONOMICHE E AMMINISTRATIVE\n`;
    msg += `• Tipo fatturazione: ${formData.billingType === 'company' ? 'Società' : 'Persona fisica'}\n`;
    if (formData.vatNumber) {
      msg += `• P.IVA: ${formData.vatNumber}\n`;
    }
    if (formData.fiscalCode) {
      msg += `• Codice fiscale: ${formData.fiscalCode}\n`;
    }
    if (formData.paymentMethod) {
      msg += `• Metodo pagamento: ${formData.paymentMethod}\n`;
    }
    msg += `• IVA: ${formData.vatIncluded === 'yes' ? 'Inclusa' : 'Esclusa'}\n`;
    msg += `• Contratto sub-noleggio: ${formData.needsContract === 'yes' ? 'Sì' : 'No'}\n\n`;

    msg += `7. SERVIZI OPZIONALI O PREMIUM\n`;
    msg += `• Assicurazione full risk: ${formData.needsInsurance === 'yes' ? 'Sì' : 'No'}\n`;
    msg += `• Sicurezza privata: ${formData.needsSecurity === 'yes' ? 'Sì' : 'No'}\n`;
    msg += `• Pernottamento equipaggio: ${formData.needsCrewAccommodation === 'yes' ? 'Sì' : 'No'}\n`;
    msg += `• NDA richiesto: ${formData.needsNDA === 'yes' ? 'Sì' : 'No'}\n`;

    if (formData.notes) {
      msg += `\n💬 NOTE AGGIUNTIVE\n${formData.notes}\n`;
    }

    msg += `\nPotete confermare disponibilità e prezzo? Grazie 🙏`;

    const encoded = encodeURIComponent(msg);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto bg-black/60 border border-zinc-800 rounded-xl p-6 md:p-8 text-white">
      <button
        onClick={() => navigate('/helicopters')}
        className="mb-4 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Indietro
      </button>

      <h2 className="text-2xl md:text-3xl font-semibold mb-4">Prenota il Tuo Volo in Elicottero</h2>
      <p className="text-sm mb-6 text-zinc-300">
        Compila il modulo qui sotto e verrai reindirizzato su WhatsApp con la tua richiesta precompilata.
        I voli sono soggetti a disponibilità e condizioni meteorologiche.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Info Section */}
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📇 Dati Cliente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Nome *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                placeholder="es. Marco"
              />
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Cognome *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                placeholder="es. Rossi"
              />
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                placeholder="tuaemail@mail.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Telefono / WhatsApp *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                placeholder="+39 ..."
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* 1. Flight Details */}
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📍 1. Dettagli del Volo
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Da dove (partenza) *</label>
                <input
                  type="text"
                  name="departureLocation"
                  value={formData.departureLocation}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="es. Olbia aeroporto"
                />
                {errors.departureLocation && <p className="text-red-400 text-xs mt-1">{errors.departureLocation}</p>}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">A dove (arrivo) *</label>
                <input
                  type="text"
                  name="arrivalLocation"
                  value={formData.arrivalLocation}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="es. Porto Cervo"
                />
                {errors.arrivalLocation && <p className="text-red-400 text-xs mt-1">{errors.arrivalLocation}</p>}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Tipo di viaggio</label>
              <select
                name="tripType"
                value={formData.tripType}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="one_way">Solo Andata</option>
                <option value="round_trip">Andata e Ritorno</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Data partenza *</label>
                <input
                  type="date"
                  name="flightDate"
                  value={formData.flightDate}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                />
                {errors.flightDate && <p className="text-red-400 text-xs mt-1">{errors.flightDate}</p>}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Orario partenza</label>
                <input
                  type="time"
                  name="flightTime"
                  value={formData.flightTime}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                />
              </div>
            </div>

            {formData.tripType === 'round_trip' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Data ritorno</label>
                  <input
                    type="date"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleChange}
                    min={formData.flightDate}
                    disabled={!formData.flightDate}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Orario ritorno</label>
                  <input
                    type="time"
                    name="returnTime"
                    value={formData.returnTime}
                    onChange={handleChange}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Preferisce un volo diretto?</label>
              <select
                name="directFlight"
                value={formData.directFlight}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="yes">Sì, volo diretto</option>
                <option value="no">No, con tappe intermedie</option>
              </select>
            </div>

            {formData.directFlight === 'no' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Specificare tappe intermedie</label>
                <input
                  type="text"
                  name="intermediateStops"
                  value={formData.intermediateStops}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="es. Tappa a Cagliari"
                />
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Esiste flessibilità di orario o giorno?</label>
              <select
                name="hasFlexibility"
                value={formData.hasFlexibility}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">No, data fissa</option>
                <option value="yes">Sì, flessibile</option>
              </select>
            </div>

            {formData.hasFlexibility === 'yes' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Dettagli flessibilità</label>
                <input
                  type="text"
                  name="flexibilityDetails"
                  value={formData.flexibilityDetails}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="es. Disponibile anche 2-3 giorni prima/dopo"
                />
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Volo diurno o notturno?</label>
              <select
                name="dayNightFlight"
                value={formData.dayNightFlight}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="day">Diurno</option>
                <option value="night">Notturno</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Passengers */}
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            👥 2. Passeggeri
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Quante persone viaggeranno? *</label>
              <input
                type="number"
                name="passengerCount"
                min={1}
                value={formData.passengerCount}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                placeholder="es. 2"
              />
              {errors.passengerCount && <p className="text-red-400 text-xs mt-1">{errors.passengerCount}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">È previsto un bambino o un neonato?</label>
              <select
                name="hasChildren"
                value={formData.hasChildren}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">No</option>
                <option value="yes">Sì</option>
              </select>
            </div>

            {formData.hasChildren === 'yes' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Dettagli bambini (età, numero)</label>
                <input
                  type="text"
                  name="childrenDetails"
                  value={formData.childrenDetails}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="es. 1 bambino di 3 anni"
                />
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Ci sono animali a bordo?</label>
              <select
                name="hasPets"
                value={formData.hasPets}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">No</option>
                <option value="yes">Sì</option>
              </select>
            </div>

            {formData.hasPets === 'yes' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Dettagli animali (razza, dimensione, peso)</label>
                <input
                  type="text"
                  name="petDetails"
                  value={formData.petDetails}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="es. Labrador, 30 kg"
                />
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">È necessario un assistente personale / hostess?</label>
              <select
                name="needsHostess"
                value={formData.needsHostess}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">No</option>
                <option value="yes">Sì</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Ospite VIP o figura pubblica?</label>
              <select
                name="isVIP"
                value={formData.isVIP}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">No</option>
                <option value="yes">Sì</option>
              </select>
            </div>

            {formData.isVIP === 'yes' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Dettagli VIP (misure di riservatezza o sicurezza)</label>
                <input
                  type="text"
                  name="vipDetails"
                  value={formData.vipDetails}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="es. Richiesta massima discrezione"
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Luggage */}
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            💼 3. Bagagli
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Quanti bagagli avete in totale?</label>
              <input
                type="number"
                name="luggageCount"
                min={0}
                value={formData.luggageCount}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                placeholder="es. 3"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Dimensione e peso approssimativo</label>
              <input
                type="text"
                name="luggageDimensions"
                value={formData.luggageDimensions}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                placeholder="es. 2 valigie medie (20kg ciascuna), 1 zaino"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Avete attrezzature speciali?</label>
              <select
                name="hasSpecialEquipment"
                value={formData.hasSpecialEquipment}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">No</option>
                <option value="yes">Sì</option>
              </select>
            </div>

            {formData.hasSpecialEquipment === 'yes' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Dettagli attrezzature speciali</label>
                <input
                  type="text"
                  name="specialEquipmentDetails"
                  value={formData.specialEquipmentDetails}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="es. Mazze da golf, strumenti musicali"
                />
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Serve spazio per bagagli ingombranti?</label>
              <select
                name="needsBulkySpace"
                value={formData.needsBulkySpace}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">No</option>
                <option value="yes">Sì</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Flight Type & Preferences */}
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            4. Tipologia di Volo e Preferenze
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Tipo di volo</label>
              <input
                type="text"
                name="flightPurpose"
                value={formData.flightPurpose}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                placeholder="es. Business, turistico, evento speciale, transfer rapido"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Priorità principale</label>
              <input
                type="text"
                name="mainPriority"
                value={formData.mainPriority}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                placeholder="es. Velocità, lusso, risparmio"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Modello di velivolo preferito (opzionale)</label>
              <input
                type="text"
                name="preferredModel"
                value={formData.preferredModel}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                placeholder="es. AW109, Airbus H145"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Serve un logo aziendale a bordo?</label>
              <select
                name="needsLogo"
                value={formData.needsLogo}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">No</option>
                <option value="yes">Sì</option>
              </select>
            </div>

            {formData.needsLogo === 'yes' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Dettagli logo</label>
                <input
                  type="text"
                  name="logoDetails"
                  value={formData.logoDetails}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="Nome azienda / brand"
                />
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Wi-Fi a bordo</label>
              <select
                name="needsWifi"
                value={formData.needsWifi}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">Non necessario</option>
                <option value="yes">Sì, richiesto</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Catering di bordo</label>
              <select
                name="needsCatering"
                value={formData.needsCatering}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">Non necessario</option>
                <option value="yes">Sì, richiesto</option>
              </select>
            </div>

            {formData.needsCatering === 'yes' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Dettagli catering</label>
                <input
                  type="text"
                  name="cateringDetails"
                  value={formData.cateringDetails}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="es. Champagne, snack, pasto completo"
                />
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Transfer a terra (auto di lusso)</label>
              <select
                name="needsGroundTransfer"
                value={formData.needsGroundTransfer}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">Non necessario</option>
                <option value="yes">Sì, richiesto</option>
              </select>
            </div>

            {formData.needsGroundTransfer === 'yes' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Dettagli transfer</label>
                <input
                  type="text"
                  name="transferDetails"
                  value={formData.transferDetails}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="es. Da aeroporto a hotel"
                />
              </div>
            )}
          </div>
        </div>

        {/* 5. Technical & Logistics */}
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            5. Dettagli Tecnici e Logistici
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Conoscete già l'eliporto di arrivo?</label>
              <select
                name="knowsAirport"
                value={formData.knowsAirport}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="yes">Sì</option>
                <option value="no">No, serve individuare quello più vicino</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Dettagli eliporto / aeroporto</label>
              <input
                type="text"
                name="airportDetails"
                value={formData.airportDetails}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                placeholder="Nome eliporto o aeroporto, codice ICAO/IATA"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Serve atterraggio su rooftop / terreno privato?</label>
              <select
                name="needsRooftopLanding"
                value={formData.needsRooftopLanding}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">No</option>
                <option value="yes">Sì</option>
              </select>
            </div>

            {formData.needsRooftopLanding === 'yes' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Dettagli località atterraggio</label>
                <input
                  type="text"
                  name="landingLocationDetails"
                  value={formData.landingLocationDetails}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="es. Villa privata, hotel, zona urbana"
                />
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Serve assistenza bagagli / sicurezza all'imbarco?</label>
              <select
                name="needsLuggageAssistance"
                value={formData.needsLuggageAssistance}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">No</option>
                <option value="yes">Sì</option>
              </select>
            </div>
          </div>
        </div>

        {/* 6. Economic & Administrative */}
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            6. Condizioni Economiche e Amministrative
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Preventivo intestato a</label>
              <select
                name="billingType"
                value={formData.billingType}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="individual">Persona fisica</option>
                <option value="company">Società</option>
              </select>
            </div>

            {formData.billingType === 'company' && (
              <div>
                <label className="block mb-1 text-sm font-medium">Partita IVA</label>
                <input
                  type="text"
                  name="vatNumber"
                  value={formData.vatNumber}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
                  placeholder="IT..."
                />
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Codice fiscale (opzionale)</label>
              <input
                type="text"
                name="fiscalCode"
                value={formData.fiscalCode}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Metodo di pagamento preferito</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="">Seleziona</option>
                <option value="Carta">Carta</option>
                <option value="Bonifico">Bonifico</option>
                <option value="Contanti">Contanti</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Preventivo IVA</label>
              <select
                name="vatIncluded"
                value={formData.vatIncluded}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="yes">Inclusa</option>
                <option value="no">Esclusa</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Serve contratto di sub-noleggio?</label>
              <select
                name="needsContract"
                value={formData.needsContract}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">No</option>
                <option value="yes">Sì</option>
              </select>
            </div>
          </div>
        </div>

        {/* 7. Optional Services */}
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            7. Servizi Opzionali o Premium
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Assicurazione full risk</label>
              <select
                name="needsInsurance"
                value={formData.needsInsurance}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">Non necessario</option>
                <option value="yes">Sì, richiesto</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Sicurezza privata o scorta a terra</label>
              <select
                name="needsSecurity"
                value={formData.needsSecurity}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">Non necessario</option>
                <option value="yes">Sì, richiesto</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Pernottamento equipaggio (rientro posticipato)</label>
              <select
                name="needsCrewAccommodation"
                value={formData.needsCrewAccommodation}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">Non necessario</option>
                <option value="yes">Sì, necessario</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Richiesta NDA (Non Disclosure Agreement)</label>
              <select
                name="needsNDA"
                value={formData.needsNDA}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
              >
                <option value="no">Non necessario</option>
                <option value="yes">Sì, richiesto</option>
              </select>
            </div>
          </div>
        </div>

        {/* General Notes */}
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            💬 Note Aggiuntive
          </h3>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
            placeholder="Eventuali altre richieste, dettagli o informazioni..."
          />
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            name="terms"
            checked={formData.terms}
            onChange={handleChange}
            className="mt-1"
          />
          <p className="text-sm text-zinc-200">
            Accetto i termini e le condizioni del servizio e comprendo che questa richiesta è soggetta a disponibilità.
          </p>
        </div>
        {errors.terms && <p className="text-red-400 text-xs mt-1">{errors.terms}</p>}

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-md transition text-lg"
        >
          Invia Richiesta via WhatsApp
        </button>

        <p className="text-xs text-center text-zinc-400">
          Verrai reindirizzato su WhatsApp con tutti i dettagli precompilati.
          Ti contatteremo entro 24 ore con un preventivo personalizzato.
        </p>
      </form>
    </div>
  );
};

export default HelicopterBookingForm;
