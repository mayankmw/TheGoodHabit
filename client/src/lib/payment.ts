// Shared with both the customer Orders page and AdminOrders — formats the
// Razorpay payment info captured in order.controller.js's verify step.

export type PaymentCardDetails = {
  network?: string | null;
  last4?: string | null;
  type?: string | null;
  issuer?: string | null;
};

export type PaymentDetails = {
  card?: PaymentCardDetails | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  international?: boolean;
  fee?: number | null;
  tax?: number | null;
} | null;

const METHOD_LABELS: Record<string, string> = {
  card: "Card",
  upi: "UPI",
  netbanking: "Netbanking",
  wallet: "Wallet",
  emi: "EMI",
  paylater: "Pay Later",
};

// e.g. "Card •••• 4242 (Visa Credit)", "UPI (name@okhdfcbank)", "Netbanking (HDFC)"
export const formatPaymentMethod = (
  method?: string | null,
  details?: PaymentDetails
): string => {
  if (!method) return "Not paid yet";
  const label = METHOD_LABELS[method] || method;

  if (method === "card" && details?.card) {
    const { network, last4, type } = details.card;
    const sub = [network, type].filter(Boolean).join(" ");
    return `${label}${last4 ? ` •••• ${last4}` : ""}${sub ? ` (${sub})` : ""}`;
  }

  if (method === "upi" && details?.vpa) return `${label} (${details.vpa})`;
  if (method === "netbanking" && details?.bank) return `${label} (${details.bank})`;
  if (method === "wallet" && details?.wallet) return `${label} (${details.wallet})`;

  return label;
};

export const paymentStatusLabel = (status?: string | null): string => {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const paymentStatusBadgeClass = (status?: string | null): string => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "refunded":
      return "bg-purple-100 text-purple-700";
    case "attempted":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};
