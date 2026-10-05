import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Check,
  Coins,
  Crown,
  Loader2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import {
  createOrder,
  getPlans,
  loadRazorpayScript,
  verifyPayment,
} from "../features/billing";
import { setUserData } from "../redux/userSlice";

const PLAN_META = {
  free: {
    icon: Sparkles,
    accent: "text-slate-300",
    badge: "bg-white/[0.06] text-slate-300 border-white/[0.08]",
    button: "bg-white/[0.06] text-slate-300",
  },
  starter: {
    icon: Zap,
    accent: "text-indigo-300",
    badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    button: "bg-indigo-500 text-white hover:bg-indigo-400",
  },
  pro: {
    icon: Crown,
    accent: "text-violet-300",
    badge: "bg-violet-500/15 text-violet-200 border-violet-500/25",
    button:
      "bg-linear-to-br from-indigo-500 to-violet-700 text-white hover:opacity-90",
  },
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const mergeBillingIntoUser = (userData, billing) => {
  if (!userData) return billing;
  if (userData.user) {
    return {
      ...userData,
      user: { ...userData.user, ...billing },
    };
  }
  return { ...userData, ...billing };
};

const BillingDrawer = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const user = userData?.user ?? userData;

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  const currentPlan = (user?.plan || "free").toLowerCase();
  const credits = user?.credits ?? 0;

  const sortedPlans = useMemo(() => {
    const order = ["free", "starter", "pro"];
    return [...plans].sort(
      (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
    );
  }, [plans]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape" && !checkoutPlanId) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, checkoutPlanId]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const loadPlans = async () => {
      setLoadingPlans(true);
      setError("");
      try {
        const data = await getPlans();
        if (!cancelled) setPlans(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load plans");
        }
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }
    };

    loadPlans();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStatus(null);
      setError("");
      setCheckoutPlanId(null);
    }
  }, [open]);

  const handleCheckout = async (plan) => {
    if (!plan?.id || plan.amount <= 0 || checkoutPlanId) return;

    setCheckoutPlanId(plan.id);
    setError("");
    setStatus("creating");

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout");
      }

      const { order, key } = await createOrder(plan.id);
      setStatus("checkout");

      const razorpay = new window.Razorpay({
        key,
        amount: order.amount,
        currency: order.currency,
        name: "NexoraAI",
        description: `${plan.name} plan · ${plan.credits} credits`,
        order_id: order.id,
        theme: { color: "#6366f1" },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        handler: async (response) => {
          try {
            setStatus("verifying");
            const result = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            dispatch(
              setUserData(
                mergeBillingIntoUser(userData, {
                  plan: result.plan,
                  credits: result.credits,
                  totalCredits: result.totalCredits,
                  planExpiersAt: result.planExpiersAt,
                }),
              ),
            );
            setStatus("success");
            setCheckoutPlanId(null);
          } catch (err) {
            setError(
              err.response?.data?.message || "Payment verification failed",
            );
            setStatus(null);
            setCheckoutPlanId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setError("Checkout was cancelled");
            setStatus(null);
            setCheckoutPlanId(null);
          },
        },
      });

      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Checkout failed");
      setStatus(null);
      setCheckoutPlanId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={() => {
          if (!checkoutPlanId) onClose();
        }}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-drawer-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-white/[0.08] bg-[#0d0f14] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2
              id="billing-drawer-title"
              className="text-[16px] font-semibold tracking-tight text-slate-100"
            >
              Plans & credits
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Upgrade anytime. Credits stack with each purchase.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close billing drawer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-slate-500 cursor-pointer hover:bg-white/[0.06] hover:text-slate-200 transition-colors duration-150"
            onClick={onClose}
            disabled={Boolean(checkoutPlanId)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">
          <div className="rounded-2xl border border-white/[0.08] bg-[#141821] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Current plan
                </p>
                <p className="mt-1 text-[18px] font-semibold capitalize text-slate-100">
                  {currentPlan}
                </p>
                <p className="mt-1 text-[12px] text-slate-500">
                  Valid until {formatDate(user?.planExpiersAt)}
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-right">
                <div className="flex items-center justify-end gap-1.5 text-amber-300">
                  <Coins size={14} />
                  <span className="text-[15px] font-semibold">{credits}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-amber-200/70">credits left</p>
              </div>
            </div>
          </div>

          {status === "success" && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-[13px] text-emerald-300">
              <Check size={15} />
              Credits added successfully
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-300">
              {error}
            </div>
          )}

          <div className="mt-5 space-y-3">
            {loadingPlans ? (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Loading plans…
              </div>
            ) : (
              sortedPlans.map((plan) => {
                const meta = PLAN_META[plan.id] || PLAN_META.free;
                const Icon = meta.icon;
                const isCurrent = currentPlan === plan.id;
                const isPaid = plan.amount > 0;
                const isBusy = checkoutPlanId === plan.id;
                const isPopular = plan.id === "pro";

                let buttonLabel = `Get ${plan.name}`;
                if (!isPaid) buttonLabel = "Included";
                else if (isCurrent) buttonLabel = "Add credits";
                if (isBusy) {
                  if (status === "creating") buttonLabel = "Creating order…";
                  else if (status === "checkout") buttonLabel = "Checkout open…";
                  else if (status === "verifying") buttonLabel = "Verifying…";
                }

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border p-4 transition-colors duration-150 ${
                      isPopular
                        ? "border-violet-500/30 bg-violet-500/[0.07]"
                        : "border-white/[0.08] bg-[#141821]"
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-2.5 right-4 rounded-full border border-violet-500/30 bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                        Popular
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${meta.badge}`}
                        >
                          <Icon size={16} className={meta.accent} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-semibold text-slate-100">
                              {plan.name}
                            </h3>
                            {isCurrent && (
                              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[12px] text-slate-500">
                            {plan.credits} credits · {plan.validity} days
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[18px] font-semibold text-slate-100">
                          {plan.amount > 0 ? `₹${plan.amount}` : "Free"}
                        </p>
                      </div>
                    </div>

                    <ul className="mt-3 space-y-1.5 text-[12.5px] text-slate-400">
                      <li className="flex items-center gap-2">
                        <Check size={13} className="text-indigo-400" />
                        {plan.credits} AI credits
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={13} className="text-indigo-400" />
                        Valid for {plan.validity} days
                      </li>
                      {isPaid && (
                        <li className="flex items-center gap-2">
                          <Check size={13} className="text-indigo-400" />
                          One-time purchase · credits stack
                        </li>
                      )}
                    </ul>

                    <button
                      type="button"
                      disabled={!isPaid || Boolean(checkoutPlanId)}
                      onClick={() => handleCheckout(plan)}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-none py-2.5 text-[13px] font-medium transition-all duration-150 ${
                        isPaid
                          ? `${meta.button} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`
                          : `${meta.button} cursor-default opacity-70`
                      }`}
                    >
                      {isBusy && <Loader2 size={14} className="animate-spin" />}
                      {buttonLabel}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default BillingDrawer;
