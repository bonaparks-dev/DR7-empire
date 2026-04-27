-- Mirror of the same seed in the admin repo so either side can apply it.
-- See admin repo for full comments.

INSERT INTO system_messages (message_key, label, description, message_body, is_automatic, is_enabled, trigger_event, target_category, target_status)
VALUES (
  'pro_fidelity_voucher',
  'Buono Fidelity Card',
  'Inviato automaticamente al cliente Prime Wash al raggiungimento di 250 punti — contiene il codice del buono di €25.',
  '🎉 Complimenti {nome}!

Hai raggiunto i {points} punti della tua Fidelity Card Prime Wash.

Ti abbiamo riservato un buono sconto di *€{amount}* utilizzabile su tutto il sito www.dr7empire.com:

*Codice:* {code}
*Validità:* {valid_days} giorni

Inseriscilo al check-out della tua prossima prenotazione per attivare lo sconto.

Con Stima
*DR7*',
  true,
  true,
  'on_fidelity_threshold',
  'all',
  'all'
)
ON CONFLICT (message_key) DO NOTHING;
