import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HelicopterBookingForm: React.FC = () => {
  const navigate = useNavigate();
  const WHATSAPP_NUMBER = "393457905205";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    flightDate: "",
    flightTime: "",
    passengers: "",
    flightType: "",
    departure: "",
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
    if (!formData.flightDate.trim()) newErrors.flightDate = "Seleziona la data del volo";
    if (!formData.passengers.trim()) newErrors.passengers = "Inserisci il numero di passeggeri";
    if (!formData.flightType.trim()) newErrors.flightType = "Seleziona il tipo di volo";
    if (!formData.departure.trim()) newErrors.departure = "Seleziona la località di partenza";
    if (!formData.terms) newErrors.terms = "Devi accettare i termini e le condizioni";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Build WhatsApp message
    const msg = `
Ciao DR7 Empire 👋
Vorrei prenotare un volo in elicottero.

📇 Dati cliente
Nome: ${formData.firstName}
Cognome: ${formData.lastName}
Email: ${formData.email}
Telefono / WhatsApp: ${formData.phone}

🚁 Dettagli volo
Data: ${formData.flightDate}
Orario: ${formData.flightTime || "non specificato"}
Numero passeggeri: ${formData.passengers}
Tipo di volo: ${formData.flightType}
Partenza da: ${formData.departure}
Note / Richieste: ${formData.notes || "nessuna"}

Partenza dalla Sardegna Nord – Costa Smeralda.
Potete confermare disponibilità e prezzo? Grazie 🙏
    `.trim();

    const encoded = encodeURIComponent(msg);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto bg-black/60 border border-zinc-800 rounded-xl p-6 md:p-8 text-white">
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
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* First Name and Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
        </div>

        {/* Email and Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block mb-1 text-sm font-medium">Data Preferita *</label>
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
            <label className="block mb-1 text-sm font-medium">Orario Preferito</label>
            <input
              type="time"
              name="flightTime"
              value={formData.flightTime}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-white"
            />
          </div>
        </div>

        {/* Number of Passengers */}
        <div>
          <label className="block mb-1 text-sm font-medium">Numero di Passeggeri *</label>
          <input
            type="number"
            name="passengers"
            min={1}
            value={formData.passengers}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
            placeholder="es. 2"
          />
          {errors.passengers && <p className="text-red-400 text-xs mt-1">{errors.passengers}</p>}
        </div>

        {/* Flight Type */}
        <div>
          <label className="block mb-1 text-sm font-medium">Tipo di Volo *</label>
          <select
            name="flightType"
            value={formData.flightType}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
          >
            <option value="">Seleziona un'opzione</option>
            <option value="Volo Panoramico Costa Smeralda (20 min)">
              Volo Panoramico Costa Smeralda (20 min)
            </option>
            <option value="Arcipelago La Maddalena (30 min)">
              Arcipelago La Maddalena (30 min)
            </option>
            <option value="Sardegna Nord Deluxe (60 min)">Sardegna Nord Deluxe (60 min)</option>
            <option value="Trasferimento Privato">Trasferimento Privato</option>
            <option value="Tour Personalizzato">Tour Personalizzato</option>
          </select>
          {errors.flightType && <p className="text-red-400 text-xs mt-1">{errors.flightType}</p>}
        </div>

        {/* Departure Location */}
        <div>
          <label className="block mb-1 text-sm font-medium">Località di Partenza *</label>
          <select
            name="departure"
            value={formData.departure}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
          >
            <option value="">Seleziona</option>
            <option value="Olbia – eliporto / aeroporto">Olbia – eliporto / aeroporto</option>
            <option value="Porto Cervo">Porto Cervo</option>
            <option value="Arzachena">Arzachena</option>
            <option value="Altro (specificare nelle note)">Altro (specificare nelle note)</option>
          </select>
          {errors.departure && <p className="text-red-400 text-xs mt-1">{errors.departure}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-1 text-sm font-medium">Note / Richieste Speciali</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
            placeholder="es. fotografia aerea, proposta di matrimonio, sosta pranzo, ecc."
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
          className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-2.5 rounded-md transition"
        >
          Invia Richiesta via WhatsApp
        </button>
      </form>
    </div>
  );
};

export default HelicopterBookingForm;
