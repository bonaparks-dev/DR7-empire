// src/components/PayButton.tsx
import { useState } from "react";

interface PayButtonProps {
  carName: string;
  priceInCents: number;
}

export default function PayButton({ carName, priceInCents }: PayButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    try {
      setLoading(true);
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carName, priceInCents }),
      });
      if (!res.ok) throw new Error("Failed to create checkout session");
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition"
    >
      {loading ? "Processing…" : `Pay for ${carName}`}
    </button>
  );
}
