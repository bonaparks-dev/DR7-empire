import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // ⚠️ Vérifiez bien le chemin
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface BookingForm {
  vehicleType: string;
  vehicleName: string;
  vehicleImageUrl?: string;
  pickupDate: string;
  dropoffDate: string;
  pickupLocation: string;
  dropoffLocation?: string;
  ageBucket?: string;
  countryIso2?: string;
  licenseIssueDate?: string;
  licenseFileUrl?: string;
  dateOfBirth?: string;
  yearsLicensedBucket?: string;
  termsAccepted: boolean;
}

export default function CarBookingWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingForm>({
    vehicleType: "car",
    vehicleName: "",
    pickupDate: "",
    dropoffDate: "",
    pickupLocation: "",
    termsAccepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Vérifie si l’utilisateur est connecté
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const uploadDocument = async (
    file: File,
    userId: string,
    prefix: string
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "documents"); // ⚠️ Nom du bucket Supabase
      formData.append("userId", userId);
      formData.append("prefix", prefix);

      const res = await fetch("/.netlify/functions/upload-file", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("Upload error:", await res.text());
        return null;
      }

      const data = await res.json();
      return data.publicUrl ?? null;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  };

  const finalizeBooking = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        setError("Vous devez être connecté pour réserver.");
        return;
      }

      // Upload document si fourni
      let licenseUrl: string | null = null;
      const fileInput = document.getElementById(
        "licenseFile"
      ) as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        licenseUrl = await uploadDocument(fileInput.files[0], user.id, "license");
      }

      // Insertion dans Supabase
      const { error: insertError } = await supabase.from("bookings").insert([
        {
          user_id: user.id,
          vehicle_type: form.vehicleType,
          vehicle_name: form.vehicleName,
          vehicle_image_url: form.vehicleImageUrl ?? null,
          pickup_date: form.pickupDate,
          dropoff_date: form.dropoffDate,
          pickup_location: form.pickupLocation,
          dropoff_location: form.dropoffLocation ?? null,
          price_total: 200, // ⚠️ À calculer dynamiquement
          currency: "usd",
          license_file_url: licenseUrl,
          terms_accepted: form.termsAccepted,
          booking_details: {
            ageBucket: form.ageBucket,
            countryIso2: form.countryIso2,
            yearsLicensedBucket: form.yearsLicensedBucket,
          },
        },
      ]);

      if (insertError) throw insertError;

      // Redirection Stripe (optionnel)
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe non disponible.");

      // Ici vous devriez appeler une fonction Netlify/Backend qui crée la session Stripe
      // Exemple : /create-checkout-session

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la réservation.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div>
        <h2>Accès requis</h2>
        <p>Veuillez vous connecter pour continuer.</p>
        <a href="/login">Se connecter</a> | <a href="/register">Créer un compte</a>
      </div>
    );
  }

  return (
    <div className="booking-wizard">
      <h1>Réserver une voiture</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>Réservation réussie ✅</p>}

      {step === 1 && (
        <div>
          <h2>Étape 1 - Infos</h2>
          <input
            type="text"
            name="vehicleName"
            placeholder="Nom du véhicule"
            value={form.vehicleName}
            onChange={handleChange}
          />
          <input
            type="datetime-local"
            name="pickupDate"
            value={form.pickupDate}
            onChange={handleChange}
          />
          <input
            type="datetime-local"
            name="dropoffDate"
            value={form.dropoffDate}
            onChange={handleChange}
          />
          <input
            type="text"
            name="pickupLocation"
            placeholder="Lieu de départ"
            value={form.pickupLocation}
            onChange={handleChange}
          />
          <input
            type="text"
            name="dropoffLocation"
            placeholder="Lieu de retour"
            value={form.dropoffLocation ?? ""}
            onChange={handleChange}
          />
          <button onClick={() => setStep(2)}>Continuer</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Étape 2 - Documents</h2>
          <label>
            Permis de conduire :
            <input type="file" id="licenseFile" />
          </label>
          <label>
            <input
              type="checkbox"
              name="termsAccepted"
              checked={form.termsAccepted}
              onChange={handleChange}
            />
            J’accepte les conditions
          </label>
          <button onClick={() => setStep(1)}>Retour</button>
          <button onClick={finalizeBooking} disabled={loading}>
            {loading ? "En cours..." : "Confirmer"}
          </button>
        </div>
      )}
    </div>
  );
}
