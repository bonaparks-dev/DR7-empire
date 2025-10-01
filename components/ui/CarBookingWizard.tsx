// src/components/booking/CarBookingWizard.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/supabaseClient";

type UploadKind = "id" | "license";

type BookingForm = {
  vehicleType: "car" | "yacht" | "" | undefined;
  vehicleName: string;
  vehicleImageUrl?: string | null;

  pickupDate: string;    // ISO string (YYYY-MM-DDTHH:mm)
  dropoffDate: string;   // ISO string (YYYY-MM-DDTHH:mm)
  pickupLocation: string;
  dropoffLocation?: string | null;

  priceTotal: number;    // calculé côté front, envoyé en backup
  currency: "usd" | "eur";

  // KYC
  idFileUrl?: string | null;
  licenseFileUrl?: string | null;

  // Divers
  termsAccepted: boolean;
  ageBucket?: string | null;
  countryIso2?: string | null;
  yearsLicensedBucket?: string | null;
};

type PriceInputs = {
  days: number;
  basePerDay: number;
  mandatoryWash: number; // 30$
};

const STEP_TITLES = ["Date & Lieux", "Infos conducteur", "Options & assurances", "Paiement & Confirmation"] as const;

function formatIsoLocal(dt: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(
    dt.getMinutes()
  )}`;
}

function daysBetween(aIso: string, bIso: string) {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  const one = 24 * 60 * 60 * 1000;
  const d = Math.ceil((b - a) / one);
  return Math.max(d, 0);
}

async function uploadToNetlify(opts: {
  file: File;
  kind: UploadKind;
  userId: string;
}): Promise<string> {
  // Retourne l’URL publique si le bucket est public, sinon la path
  const form = new FormData();
  form.append("file", opts.file);
  form.append("bucket", opts.kind === "id" ? "driver-ids" : "driver-licenses");
  form.append("userId", opts.userId);
  form.append("prefix", opts.kind === "id" ? "driver_id" : "driver_license");

  const res = await fetch("/.netlify/functions/upload-file", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}) ${txt}`);
  }

  const json = (await res.json()) as { ok: boolean; publicUrl?: string | null; path?: string };
  if (!json.ok) throw new Error("Upload failed: bad response");
  return json.publicUrl ?? json.path ?? "";
}

const CarBookingWizard: React.FC<{
  // Si ton parent connaît le véhicule courant, tu peux passer ces props :
  vehicleNameProp?: string;
  vehicleImageUrlProp?: string;
  baseDailyPrice?: number; // $/day
}> = ({ vehicleNameProp, vehicleImageUrlProp, baseDailyPrice = 132 }) => {
  const location = useLocation();

  // 1) Détection automatique du type via la route
  const typeFromRoute: "car" | "yacht" = useMemo(
    () => (location.pathname.includes("/yachts") ? "yacht" : "car"),
    [location.pathname]
  );

  // 2) State global du wizard
  const [step, setStep] = useState(0);

  const [form, setForm] = useState<BookingForm>({
    vehicleType: "car", // valeur par défaut UI
    vehicleName: vehicleNameProp ?? "",
    vehicleImageUrl: vehicleImageUrlProp ?? null,

    pickupDate: formatIsoLocal(new Date()),
    dropoffDate: formatIsoLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    pickupLocation: "",
    dropoffLocation: null,

    priceTotal: 0,
    currency: "usd",

    idFileUrl: null,
    licenseFileUrl: null,

    termsAccepted: false,
    ageBucket: null,
    countryIso2: null,
    yearsLicensedBucket: null,
  });

  // 3) Aligner vehicleType sur la route (et garder un fallback si form.vehicleType est vide)
  useEffect(() => {
    setForm((f) => ({ ...f, vehicleType: typeFromRoute }));
  }, [typeFromRoute]);

  // 4) Récupérer l’utilisateur courant
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // 5) Calcul prix (simple, à adapter selon ta grille)
  const priceInputs = useMemo<PriceInputs>(() => {
    const days = daysBetween(form.pickupDate, form.dropoffDate);
    return {
      days,
      basePerDay: baseDailyPrice,
      mandatoryWash: 30,
    };
  }, [form.pickupDate, form.dropoffDate, baseDailyPrice]);

  const priceTotal = useMemo(() => {
    const base = priceInputs.days * priceInputs.basePerDay;
    return base + priceInputs.mandatoryWash;
  }, [priceInputs]);

  useEffect(() => {
    setForm((f) => ({ ...f, priceTotal }));
  }, [priceTotal]);

  // 6) Upload handlers
  const [uploading, setUploading] = useState<UploadKind | null>(null);
  const onSelectFile = useCallback(
    async (kind: UploadKind, file?: File | null) => {
      if (!userId) {
        alert("Veuillez vous connecter avant d’uploader des documents.");
        return;
      }
      if (!file) return;
      try {
        setUploading(kind);
        const url = await uploadToNetlify({ file, userId, kind });
        if (kind === "id") {
          setForm((f) => ({ ...f, idFileUrl: url }));
        } else {
          setForm((f) => ({ ...f, licenseFileUrl: url }));
        }
      } catch (e: any) {
        console.error(e);
        alert(e?.message ?? "Upload error");
      } finally {
        setUploading(null);
      }
    },
    [userId]
  );

  // 7) Navigation
  const canNext = useMemo(() => {
    if (step === 0) {
      return Boolean(form.pickupDate && form.dropoffDate && form.pickupLocation);
    }
    if (step === 1) {
      return Boolean(form.idFileUrl && form.licenseFileUrl);
    }
    if (step === 2) {
      return true; // options…
    }
    if (step === 3) {
      return form.termsAccepted;
    }
    return true;
  }, [step, form]);

  const next = () => setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // 8) Confirm booking (INSERT)
  const [saving, setSaving] = useState(false);
  const confirmBooking = useCallback(async () => {
    if (!userId) {
      alert("Veuillez vous connecter.");
      return;
    }

    // Sécurité : calculer un vehicleType **garanti** valable
    const vehicleType = (form.vehicleType || typeFromRoute || "car").toLowerCase().trim();
    const vt: "car" | "yacht" = vehicleType === "yacht" ? "yacht" : "car";

    // Petit log de debug : vérifie dans la console que vehicle_type part bien non-null
    console.log("Payload booking =>", {
      user_id: userId,
      vehicle_type: vt,
      vehicle_name: form.vehicleName || "(unknown)",
      pickup_date: form.pickupDate,
      dropoff_date: form.dropoffDate,
      pickup_location: form.pickupLocation,
      dropoff_location: form.dropoffLocation ?? null,
      price_total: priceTotal,
      currency: form.currency,
      license_file_url: form.licenseFileUrl ?? null,
      id_file_url: form.idFileUrl ?? null,
      terms_accepted: !!form.termsAccepted,
    });

    setSaving(true);
    try {
      const { error } = await supabase.from("bookings").insert([
        {
          user_id: userId,
          vehicle_type: vt, // ✅ JAMAIS NULL
          vehicle_name: form.vehicleName || null,
          vehicle_image_url: form.vehicleImageUrl ?? null,

          pickup_date: form.pickupDate,
          dropoff_date: form.dropoffDate,
          pickup_location: form.pickupLocation,
          dropoff_location: form.dropoffLocation ?? null,

          price_total: priceTotal,
          currency: form.currency,

          // KYC
          license_file_url: form.licenseFileUrl ?? null,
          // (si tu veux stocker aussi ID/CNI)
          booking_details: {
            idFileUrl: form.idFileUrl ?? null,
            ageBucket: form.ageBucket ?? null,
            countryIso2: form.countryIso2 ?? null,
            yearsLicensedBucket: form.yearsLicensedBucket ?? null,
          },

          status: "pending",
          payment_status: "pending",
          terms_accepted: !!form.termsAccepted,
        },
      ]);

      if (error) {
        console.error(error);
        alert(`DB insert failed: ${error.message}`);
        return;
      }
      alert("Réservation créée !");
      // rediriger ou reset
      setStep(0);
    } finally {
      setSaving(false);
    }
  }, [form, priceTotal, typeFromRoute, userId]);

  // 9) UI
  return (
    <div className="mx-auto max-w-5xl p-4 text-white">
      <h1 className="text-xl font-semibold mb-3">Réserver – {form.vehicleName || "Sélection"}</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {STEP_TITLES.map((t, i) => (
          <div
            key={t}
            className={`px-3 py-2 rounded-full text-sm border ${
              i === step ? "bg-white text-black" : "border-white/30 text-white/80"
            }`}
          >
            {i + 1}. {t}
          </div>
        ))}
      </div>

      {/* Résumé rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2 space-y-6">
          {/* STEP 0 */}
          {step === 0 && (
            <div className="rounded-2xl border border-white/10 p-4">
              <h2 className="mb-3 font-medium">Date & Lieux</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase opacity-70">Type</span>
                  <select
                    className="bg-black/30 border border-white/20 rounded-xl px-3 py-2"
                    value={form.vehicleType ?? "car"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, vehicleType: (e.target.value as "car" | "yacht") ?? "car" }))
                    }
                  >
                    <option value="car">Car</option>
                    <option value="yacht">Yacht</option>
                  </select>
                  <span className="text-[11px] opacity-60">
                    Détecté via l’URL: <b>{typeFromRoute}</b>
                  </span>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase opacity-70">Modèle / Nom</span>
                  <input
                    className="bg-black/30 border border-white/20 rounded-xl px-3 py-2"
                    placeholder="Mercedes C63, Porsche 992…"
                    value={form.vehicleName}
                    onChange={(e) => setForm((f) => ({ ...f, vehicleName: e.target.value }))}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase opacity-70">Départ</span>
                  <input
                    type="datetime-local"
                    className="bg-black/30 border border-white/20 rounded-xl px-3 py-2"
                    value={form.pickupDate}
                    onChange={(e) => setForm((f) => ({ ...f, pickupDate: e.target.value }))}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase opacity-70">Retour</span>
                  <input
                    type="datetime-local"
                    className="bg-black/30 border border-white/20 rounded-xl px-3 py-2"
                    value={form.dropoffDate}
                    onChange={(e) => setForm((f) => ({ ...f, dropoffDate: e.target.value }))}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase opacity-70">Lieu de prise</span>
                  <input
                    className="bg-black/30 border border-white/20 rounded-xl px-3 py-2"
                    placeholder="Cagliari Elmas Airport…"
                    value={form.pickupLocation}
                    onChange={(e) => setForm((f) => ({ ...f, pickupLocation: e.target.value }))}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase opacity-70">Lieu de dépôt (optionnel)</span>
                  <input
                    className="bg-black/30 border border-white/20 rounded-xl px-3 py-2"
                    placeholder="Même que prise…"
                    value={form.dropoffLocation ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, dropoffLocation: e.target.value || null }))}
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="rounded-2xl border border-white/10 p-4 space-y-4">
              <h2 className="mb-3 font-medium">Documents conducteur</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm opacity-80 mb-2">Carte d’identité (recto/verso ou PDF)</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => onSelectFile("id", e.target.files?.[0])}
                  />
                  {uploading === "id" && <p className="text-xs mt-1 opacity-60">Upload…</p>}
                  {form.idFileUrl && (
                    <p className="text-xs mt-1 text-green-400 break-all">OK : {form.idFileUrl}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm opacity-80 mb-2">Permis de conduire</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => onSelectFile("license", e.target.files?.[0])}
                  />
                  {uploading === "license" && <p className="text-xs mt-1 opacity-60">Upload…</p>}
                  {form.licenseFileUrl && (
                    <p className="text-xs mt-1 text-green-400 break-all">OK : {form.licenseFileUrl}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="rounded-2xl border border-white/10 p-4 space-y-4">
              <h2 className="mb-3 font-medium">Options & Assurances</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase opacity-70">Pays (ISO-2)</span>
                  <input
                    className="bg-black/30 border border-white/20 rounded-xl px-3 py-2"
                    placeholder="FR, IT, …"
                    value={form.countryIso2 ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, countryIso2: e.target.value || null }))}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase opacity-70">Tranche d’âge</span>
                  <select
                    className="bg-black/30 border border-white/20 rounded-xl px-3 py-2"
                    value={form.ageBucket ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, ageBucket: e.target.value || null }))}
                  >
                    <option value="">—</option>
                    <option value="18-24">18-24</option>
                    <option value="25-29">25-29</option>
                    <option value="30-39">30-39</option>
                    <option value="40+">40+</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase opacity-70">Années de permis</span>
                  <select
                    className="bg-black/30 border border-white/20 rounded-xl px-3 py-2"
                    value={form.yearsLicensedBucket ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, yearsLicensedBucket: e.target.value || null }))}
                  >
                    <option value="">—</option>
                    <option value="0-1">0-1</option>
                    <option value="2-3">2-3</option>
                    <option value="4-5">4-5</option>
                    <option value="6+">6+</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="rounded-2xl border border-white/10 p-4 space-y-4">
              <h2 className="mb-3 font-medium">Paiement & Confirmation</h2>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(e) => setForm((f) => ({ ...f, termsAccepted: e.target.checked }))}
                />
                <span className="text-sm opacity-80">
                  J’accepte les conditions générales et la politique de confidentialité.
                </span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={back}
              disabled={step === 0}
              className="px-4 py-2 rounded-xl border border-white/20 disabled:opacity-50"
            >
              Retour
            </button>

            {step < STEP_TITLES.length - 1 ? (
              <button
                onClick={next}
                disabled={!canNext}
                className="px-4 py-2 rounded-xl bg-white text-black disabled:opacity-50"
              >
                Continuer
              </button>
            ) : (
              <button
                onClick={confirmBooking}
                disabled={!canNext || saving}
                className="px-4 py-2 rounded-xl bg-white text-black disabled:opacity-50"
              >
                {saving ? "Confirmation…" : "Confirmer la réservation"}
              </button>
            )}
          </div>
        </section>

        {/* Récapitulatif prix */}
        <aside className="rounded-2xl border border-white/10 p-4 h-fit">
          <h3 className="font-medium mb-3">Récapitulatif</h3>
          <div className="space-y-2 text-sm opacity-90">
            <div className="flex justify-between">
              <span>Jours</span>
              <span>{priceInputs.days}</span>
            </div>
            <div className="flex justify-between">
              <span>Tarif / jour</span>
              <span>${priceInputs.basePerDay.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Lavaggio obbligatorio</span>
              <span>${priceInputs.mandatoryWash.toLocaleString()}</span>
            </div>
            <hr className="border-white/10 my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${priceTotal.toLocaleString()}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CarBookingWizard;

