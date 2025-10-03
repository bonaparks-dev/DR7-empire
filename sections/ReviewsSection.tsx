import React from "react";
import { ReviewsMarquee } from "../components/ui/ReviewsMarquee";

const reviews = [
  {
    author: "Martina Montis",
    rating: 5,
    date: "2025-08-18",
    body:
      "I had the pleasure of renting a Mercedes GLE 63s AMG, a true masterpiece of luxury and power, and the experience was simply exhilarating. The car exceeded my every expectation, offering extraordinary performance and superior comfort, making every moment of driving a true pleasure.\n\nIt's also nice to indulge every now and then, and this Experience evening was truly special, adding a touch of exclusivity and style.\n\nThe service I received was impeccable; the team was courteous, professional, and attentive to every detail, creating an atmosphere of trust and relaxation. Definitely an experience worth repeating, and I recommend it to anyone who wants to experience the ultimate in elegance and power on four wheels.",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Mauro Lobina",
    rating: 5,
    date: "2025-05-18",
    body:
      "Sono un appassionato di auto di lusso, ho noleggiato più volte delle auto fantastiche, pulite e soprattutto affidabili. Lo staff cordiale e preciso nel loro lavoro, il titolare è una persona alla mano e difficilmente non si riesce a trovare un accordo sia per appuntamenti che per i loro prezzi competitivi e alla portata di tutti. Ci voleva proprio un autonoleggio che permette a chiunque di vivere esperienze da sogno. Spero di riuscire e continuare a provare la loro vasta scelta di parco auto che portano a divertimento e adrenalina pura. Grazie a tutto lo staff di Dubai Rent ❤️",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Alessandro Urracci",
    rating: 5,
    date: "2025-05-18",
    body:
      "Se volete vivere un’esperienza di guida straordinaria a prezzi davvero competitivi, Dubai Rent 7.0 Srl è la scelta perfetta! Ho noleggiato diverse auto da loro, tra cui l’Audi RS3, l’Alfa Romeo Stelvio Quadrifoglio, l’Audi R8, la Lamborghini Urus (per ben due volte!) e il Porsche Macan GTS. Auto impeccabili e pulitissime. Servizio clienti eccezionale: team super professionale, prenotazione rapida, consegna puntuale e attenzione ai dettagli. Emozioni indimenticabili e prezzi vantaggiosi. Il miglior autonoleggio!",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Fabio De Agostini",
    rating: 5,
    date: "2025-08-25",
    body:
      "Super positive experience, we had the €49 car wash and what can I say? The car was super clean down to the smallest detail... Thanks guys, see you next time... ❤️❤️",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Anna Maria Zucca",
    rating: 5,
    date: "2025-08-28",
    body:
      "Unique experience!!!! Impeccable wash. The car smelled great, sanitized, and spotless. Complimentary perfume, coffee, and water 😅. The guys were professional, kind, and super nice 💪. The rental? A super wow. Luxurious and impeccable cars. Dubai Rent is the best ❤️",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Alessandro Porcu",
    rating: 5,
    date: "2025-06-20",
    body:
      "Grazie mille dell'esperienza. Ho guidato su tratti lunghi e tecnici, anche su strade panoramiche. Perfetta per photoshooting/video. Supercar super pulita, esperienza super. Dubai Rent 7.0 il top!!!!!!",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Nicola Frongia",
    rating: 5,
    date: "2025-08-18",
    body:
      "Conosco Dubai Rent 7.0 dai tempi della sede di Via Santa Maria Chiara. Nella nuova sede di Viale Marconi l’eccellenza è ancora più evidente. Parco auto straordinario, veicoli curati nei minimi dettagli. Personale professionale e attento. Autolavaggio interno con risultati impeccabili. Sempre pienamente soddisfatto.",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Luca Scuto",
    rating: 5,
    date: "2025-06-20",
    body:
      "I have rented the Carrera 4S several times. The car is fantastic and the team even more so. Incredible customer service, super professional and always available. Car wash impeccable. Highly recommended, I will continue to rent from them ⭐⭐⭐⭐⭐",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Davide Congiu",
    rating: 5,
    date: "2025-08-18",
    body:
      "Esperienza SEMPRE fantastica. Ho noleggiato diverse supercar e mi sono sempre trovato benissimo. Team disponibile a qualsiasi ora, auto pulitissime e trattamento al cliente eccezionale, a un prezzo alla portata di tutti. Straconsigliato!!",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Andrea Frau",
    rating: 5,
    date: "2025-07-20",
    body:
      "Ottima esperienza con Dubai Rent 7.0. Le macchine sono spettacolari, pulizia e affidabilità al top e prezzi imbattibili. Accoglienza e assistenza al cliente impeccabili.",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Fabio Follese",
    rating: 5,
    date: "2024-11-10",
    body:
      "Auto pulitissima abbinato alla vostra super cortesia, per un giro di pura adrenalina con le vostre SUPER CAR nuovissime e splendide. Un ringraziamento a Valerio e a tutto lo staff.",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Matti Ciambotti",
    rating: 5,
    date: "2025-06-20",
    body:
      "Non sono vostro cliente, ma vi seguo sui social: non esiste un noleggio simile a voi, numeri uno. Se non fosse per la paura di danneggiare le super car l’avrei già noleggiata da tempo. Continuate così bravi!!",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Giuseppe Marongiu",
    rating: 5,
    date: "2025-05-18",
    body:
      "Ho preso tutte le macchine da loro, mi sono trovato benissimo. Personale gentile e accogliente, prezzi molto strepitosi. Consiglio a tutti quelli che vogliono noleggiare super car: loro sono il top del top.",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Andrea Pisano",
    rating: 5,
    date: "2025-08-18",
    body:
      "Esperienza super positiva, unica nel suo genere. Staff super gentile e premuroso, lavaggio super professionale. Possibilità di noleggiare una super car anche solo per poche ore a un prezzo davvero basso con un tocco di esclusività. Super consigliato.",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  },
  {
    author: "Giancarlo Lecca",
    rating: 5,
    date: "2025-08-18",
    body:
      "It's the first time I rent from them and I had a great time. I’d never driven an RS3 and was speechless at the beauty of the car and the care at delivery. Tried the complete wash: car came out better than when I bought it. I recommend both the wash and the rental. See you next time 💪💪❤️",
    sourceUrl: "https://share.google/o5c8DO8nmk3XMn0hF",
  }
];

export default function ReviewsSection() {
  return (
    <ReviewsMarquee
      reviews={reviews}
      business={{
        name: "DR7 Empire",
        url: "https://dr7empire.com",
        image: "https://dr7empire.com/logo.png",
        telephone: "+39 000 000 000",
        address: {
          streetAddress: "Viale Marconi",
          addressLocality: "Cagliari",
          addressRegion: "SU",
          postalCode: "09100",
          addressCountry: "IT",
        },
      }}
      ratingSummary={{ ratingValue: 4.9, reviewCount: 154 }}
      googleReviewsUrl="https://share.google/o5c8DO8nmk3XMn0hF"
      speedSeconds={25}
      speedSecondsMobile={15}
      gapPx={20}
      dark
    />
  );
}