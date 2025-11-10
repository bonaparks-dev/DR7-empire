// Test WhatsApp notification with CallMeBot
// Run this with: node test-whatsapp-notification.js

const CALLMEBOT_PHONE = "393457905205"; // Your phone number
const CALLMEBOT_API_KEY = "6526748";

const testMessage = `🚗 *TEST NOTIFICA DR7 EMPIRE*

*Cliente:* Mario Rossi
*Email:* mario@test.com
*Telefono:* +39 333 123 4567
*Veicolo:* BMW M4 Competition
*Ritiro:* 15/01/2025 alle 10:30
*Riconsegna:* 18/01/2025 alle 10:00
*Totale:* €240
*Stato:* Test`;

async function sendTestNotification() {
  try {
    const encodedMessage = encodeURIComponent(testMessage);
    const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodedMessage}&apikey=${CALLMEBOT_API_KEY}`;

    console.log('🚀 Invio notifica test...');
    console.log('URL:', callmebotUrl);

    const response = await fetch(callmebotUrl);
    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ Errore:', response.status, responseText);
      return;
    }

    console.log('✅ Notifica inviata con successo!');
    console.log('Risposta:', responseText);
    console.log('\n📱 Controlla WhatsApp sul numero:', CALLMEBOT_PHONE);
  } catch (error) {
    console.error('❌ Errore durante l\'invio:', error.message);
  }
}

sendTestNotification();
