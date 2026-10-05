import { api } from "../../utils/axois";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const getPlans = async () => {
  const { data } = await api.get("/api/billing/plans");
  return data.plans || [];
};

export const createOrder = async (plan) => {
  const { data } = await api.post("/api/billing/create", { plan });
  return data;
};

export const verifyPayment = async (payload) => {
  const { data } = await api.post("/api/billing/verify", payload);
  return data;
};
