import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';

interface Preventivo {
  id: string;
  vehicle_name: string;
  vehicle_plate: string;
  vehicle_category: string;
  pickup_date: string;
  dropoff_date: string;
  rental_days: number;
  pickup_location: string;
  dropoff_location: string;
  base_daily_rate: number;
  insurance_option: string;
  insurance_total: number;
  km_limit: number;
  unlimited_km: boolean;
  total_final: number;
  deposit_amount: number;
  driver_tier: string;
  status: 'bozza' | 'inviato' | 'accettato' | 'rifiutato' | 'scaduto';
  expires_at: string;
  created_at: string;
  booking_id?: string;
  source?: string;
  events?: { event: string; ts: string; detail?: string }[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  bozza: { label: 'In attesa', color: 'bg-yellow-500/15 text-yellow-400' },
  inviato: { label: 'Inviato', color: 'bg-blue-500/15 text-blue-400' },
  accettato: { label: 'Accettato', color: 'bg-green-500/15 text-green-400' },
  rifiutato: { label: 'Rifiutato', color: 'bg-red-500/15 text-red-400' },
  scaduto: { label: 'Scaduto', color: 'bg-gray-500/15 text-gray-400' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Europe/Rome'
  });
}

const MyPreventivi: React.FC = () => {
  const { user } = useAuth();
  const [preventivi, setPreventivi] = useState<Preventivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadPreventivi();
  }, [user]);

  const loadPreventivi = async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch('/.netlify/functions/get-my-preventivi', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPreventivi(data.preventivi || []);
      }
    } catch (err) {
      console.error('Error loading preventivi:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">I Miei Preventivi</h2>

      {preventivi.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-800">
          <p className="text-gray-400 text-lg mb-2">Nessun preventivo salvato</p>
          <p className="text-gray-500 text-sm">Quando richiedi un preventivo dal configuratore, lo troverai qui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {preventivi.map((p) => {
            const statusInfo = STATUS_LABELS[p.status] || STATUS_LABELS.bozza;
            const isExpired = p.status === 'scaduto' || (p.expires_at && new Date(p.expires_at) < new Date());
            const isActive = p.status === 'bozza' || p.status === 'inviato';

            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-5 transition-all ${
                  isExpired ? 'border-gray-800 opacity-60' : 'border-gray-700 bg-gray-900/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{p.vehicle_name}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {formatDate(p.pickup_date)} — {formatDate(p.dropoff_date)} ({p.rental_days} {p.rental_days === 1 ? 'giorno' : 'giorni'})
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-gray-500 text-xs">Tariffa/giorno</p>
                    <p className="text-white font-medium">€{Number(p.base_daily_rate).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Assicurazione</p>
                    <p className="text-white font-medium">{p.insurance_option || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">KM</p>
                    <p className="text-white font-medium">{p.unlimited_km ? 'Illimitati' : `${p.km_limit} km`}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Cauzione</p>
                    <p className="text-white font-medium">€{Number(p.deposit_amount).toFixed(0)}</p>
                  </div>
                </div>

                {/* Total + actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div>
                    <p className="text-gray-500 text-xs">Totale preventivo</p>
                    <p className="text-xl font-bold text-white">€{Number(p.total_final).toFixed(2)}</p>
                  </div>

                  {isActive && !isExpired && (
                    <div className="flex gap-2">
                      <a
                        href={`/supercar-luxury?preventivo=${p.id}`}
                        className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-colors"
                      >
                        Prenota Ora
                      </a>
                    </div>
                  )}

                  {p.status === 'rifiutato' && (
                    <div className="flex flex-col items-end gap-2">
                      <a
                        href={`/supercar-luxury?preventivo=${p.id}`}
                        className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-colors"
                      >
                        Prenota Ora con Cauzione
                      </a>
                    </div>
                  )}

                  {p.status === 'accettato' && p.booking_id && (
                    <span className="text-green-400 text-sm font-medium">Prenotazione confermata</span>
                  )}
                </div>

                {/* Discount code for rejected no-cauzione */}
                {p.status === 'rifiutato' && (() => {
                  const rejectEvent = p.events?.find(e => e.event === 'no_cauzione_rifiutato');
                  const code = rejectEvent?.detail?.replace('discount_code: ', '');
                  if (!code) return null;
                  return (
                    <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                      <p className="text-green-400 text-sm font-semibold mb-1">Sconto del 5% attivato per te!</p>
                      <p className="text-white text-lg font-bold font-mono tracking-wider">{code}</p>
                      <p className="text-gray-400 text-xs mt-1">Inserisci il codice al checkout per ottenere lo sconto.</p>
                    </div>
                  );
                })()}

                {/* Expiry info */}
                {isActive && p.expires_at && !isExpired && (
                  <p className="text-xs text-gray-500 mt-3">
                    Valido fino al {formatDate(p.expires_at)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyPreventivi;
