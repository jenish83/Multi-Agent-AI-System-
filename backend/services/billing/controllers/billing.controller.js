import crypto from "node:crypto";
import axios from "axios";
import razorpay from "../config/razorpay.js";
import { PLANS } from "../config/Plans.js";
import Payment from "../models/payment.model.js";

export const getPlans = async (req, res) => {
    try {
        return res.status(200).json({ plans: Object.values(PLANS) });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.headers["x-user-id"];
        const selectedPlan = PLANS[plan];

        if (!selectedPlan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        if (!selectedPlan.amount || selectedPlan.amount <= 0) {
            return res.status(400).json({ message: "Free plan cannot be purchased" });
        }

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const order = await razorpay.orders.create({
            amount: selectedPlan.amount * 100,
            currency: "INR",
            receipt: `receipt-${Date.now()}`,
        });

        await Payment.create({
            userId,
            orderId: order.id,
            amount: selectedPlan.amount,
            credits: selectedPlan.credits,
            plan: selectedPlan.id,
            currency: order.currency,
            status: "created",
        });

        return res.status(200).json({
            order,
            plan: selectedPlan,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        return res.status(500).json({ message: `create order error ${error}` });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        const payment = await Payment.findOne({ orderId: razorpay_order_id });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        payment.status = "paid";
        payment.paymentId = razorpay_payment_id;
        await payment.save();

        const { data } = await axios.post(`${process.env.AUTH_SERVICE}/update-plan`, {
            plan: payment.plan,
            credits: payment.credits,
            userId: payment.userId,
        });

        return res.status(200).json({
            message: "Payment verified successfully",
            plan: data.plan,
            credits: data.credits,
            totalCredits: data.totalCredits,
            planExpiersAt: data.planExpiersAt,
        });
    } catch (error) {
        console.error("Verify payment error:", error);
        return res.status(500).json({ message: error.message });
    }
};
