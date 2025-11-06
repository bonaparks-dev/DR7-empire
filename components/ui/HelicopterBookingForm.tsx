import React, { useState } from "react";

const HelicopterBookingForm: React.FC = () => {
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

    if (!formData.firstName.trim()) newErrors.firstName = "Please enter your first name";
    if (!formData.lastName.trim()) newErrors.lastName = "Please enter your last name";
    if (!formData.email.trim()) newErrors.email = "Please enter your email";
    if (!formData.phone.trim()) newErrors.phone = "Please enter your WhatsApp number";
    if (!formData.flightDate.trim()) newErrors.flightDate = "Please select flight date";
    if (!formData.passengers.trim()) newErrors.passengers = "Please enter number of passengers";
    if (!formData.flightType.trim()) newErrors.flightType = "Please select flight type";
    if (!formData.departure.trim()) newErrors.departure = "Please select departure location";
    if (!formData.terms) newErrors.terms = "You must accept the terms and conditions";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Build WhatsApp message
    const msg = `
Hello DR7 Empire 👋
I would like to book a helicopter flight.

📇 Customer Details
First Name: ${formData.firstName}
Last Name: ${formData.lastName}
Email: ${formData.email}
Phone / WhatsApp: ${formData.phone}

🚁 Flight Details
Date: ${formData.flightDate}
Time: ${formData.flightTime || "not specified"}
Number of passengers: ${formData.passengers}
Flight type: ${formData.flightType}
Departure from: ${formData.departure}
Notes / Requests: ${formData.notes || "none"}

Departure from North Sardinia – Costa Smeralda.
Can you confirm availability and pricing? Thank you 🙏
    `.trim();

    const encoded = encodeURIComponent(msg);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto bg-black/60 border border-zinc-800 rounded-xl p-6 md:p-8 text-white">
      <h2 className="text-2xl md:text-3xl font-semibold mb-4">Book Your Helicopter Flight</h2>
      <p className="text-sm mb-6 text-zinc-300">
        Fill out the form below and you'll be redirected to WhatsApp with your pre-filled request.
        Flights are subject to availability and weather conditions.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* First Name and Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block mb-1 text-sm font-medium">First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
              placeholder="e.g. Marco"
            />
            {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
              placeholder="e.g. Rossi"
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
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
              placeholder="youremail@mail.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Phone / WhatsApp *</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
              placeholder="+39 ..."
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block mb-1 text-sm font-medium">Preferred Date *</label>
            <input
              type="date"
              name="flightDate"
              value={formData.flightDate}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
            />
            {errors.flightDate && <p className="text-red-400 text-xs mt-1">{errors.flightDate}</p>}
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Preferred Time</label>
            <input
              type="time"
              name="flightTime"
              value={formData.flightTime}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Number of Passengers */}
        <div>
          <label className="block mb-1 text-sm font-medium">Number of Passengers *</label>
          <input
            type="number"
            name="passengers"
            min={1}
            value={formData.passengers}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
            placeholder="e.g. 2"
          />
          {errors.passengers && <p className="text-red-400 text-xs mt-1">{errors.passengers}</p>}
        </div>

        {/* Flight Type */}
        <div>
          <label className="block mb-1 text-sm font-medium">Flight Type *</label>
          <select
            name="flightType"
            value={formData.flightType}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
          >
            <option value="">Select an option</option>
            <option value="Costa Smeralda Panoramic Flight (20 min)">
              Costa Smeralda Panoramic Flight (20 min)
            </option>
            <option value="La Maddalena Archipelago (30 min)">
              La Maddalena Archipelago (30 min)
            </option>
            <option value="North Sardinia Deluxe (60 min)">North Sardinia Deluxe (60 min)</option>
            <option value="Private Transfer">Private Transfer</option>
            <option value="Custom Tour">Custom Tour</option>
          </select>
          {errors.flightType && <p className="text-red-400 text-xs mt-1">{errors.flightType}</p>}
        </div>

        {/* Departure Location */}
        <div>
          <label className="block mb-1 text-sm font-medium">Departure Location *</label>
          <select
            name="departure"
            value={formData.departure}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
          >
            <option value="">Select</option>
            <option value="Olbia – heliport / airport">Olbia – heliport / airport</option>
            <option value="Porto Cervo">Porto Cervo</option>
            <option value="Arzachena">Arzachena</option>
            <option value="Other (specify in notes)">Other (specify in notes)</option>
          </select>
          {errors.departure && <p className="text-red-400 text-xs mt-1">{errors.departure}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-1 text-sm font-medium">Notes / Special Requests</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400"
            placeholder="e.g. aerial photography, marriage proposal, lunch stop, etc."
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
            I accept the terms and conditions of service and understand that this request is subject to availability.
          </p>
        </div>
        {errors.terms && <p className="text-red-400 text-xs mt-1">{errors.terms}</p>}

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-md transition"
        >
          Send Request via WhatsApp
        </button>
      </form>
    </div>
  );
};

export default HelicopterBookingForm;
