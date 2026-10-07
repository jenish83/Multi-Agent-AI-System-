import { getAuth } from "firebase-admin/auth";
import app from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";
import crypto from "node:crypto";

const sessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
};

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const buildSessionPayload = (user) => ({
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    plan: user.plan,
    credits: user.credits,
    totalCredits: user.totalCredits,
    planExpiersAt: user.planExpiersAt,
});

// Login controller
export const login = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        const decodedToken = await getAuth(app).verifyIdToken(token);
        let user = await User.findOne({
            firebaseUid: decodedToken.uid,
        });

        if (!user) {
            user = await User.create({
                firebaseUid: decodedToken.uid,
                name: decodedToken.name || decodedToken.email,
                email: decodedToken.email,
                avatar: decodedToken.picture,
            });
        }

        const sessionId = crypto.randomUUID();
        const userId = user._id.toString();

        const previousSessionId = await redis.get(`user-session:${userId}`);
        if (previousSessionId) {
            await redis.del(`session:${previousSessionId}`);
        }

        await redis.set(
            `session:${sessionId}`,
            JSON.stringify(buildSessionPayload(user)),
            "EX",
            SESSION_TTL_SECONDS,
        );
        await redis.set(`user-session:${userId}`, sessionId, "EX", SESSION_TTL_SECONDS);

        res.cookie("sessionId", sessionId, {
            ...sessionCookieOptions,
            maxAge: SESSION_TTL_SECONDS * 1000,
        });

        return res.status(200).json({ message: "Login successful", user, sessionId });
    } catch (error) {
        console.error("Login error:", error);
        if (error.codePrefix === "auth") {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        return res.status(500).json({ message: error.message });
    }
};

// Logout controller
export const logout = async (req, res) => {
    try {
        const sessionId = req.cookies?.sessionId;
        if (sessionId) {
            const session = await redis.get(`session:${sessionId}`);
            if (session) {
                try {
                    const { userId } = JSON.parse(session);
                    if (userId) {
                        await redis.del(`user-session:${userId}`);
                    }
                } catch (_err) {
                    // ignore malformed session payloads
                }
            }
            await redis.del(`session:${sessionId}`);
        }

        // Options must match the original cookie or the browser will keep it
        res.clearCookie("sessionId", sessionCookieOptions);
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: error.message });
    }
};


export const updateUserPayment = async (req, res) => {
    try {
        const { plan, credits, userId } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.plan = plan;
        user.credits += credits;
        user.totalCredits += credits;
        user.planExpiersAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await user.save();

        const sessionId = await redis.get(`user-session:${userId}`);
        if (sessionId) {
            await redis.set(
                `session:${sessionId}`,
                JSON.stringify(buildSessionPayload(user)),
                "EX",
                SESSION_TTL_SECONDS,
            );
            await redis.set(`user-session:${userId}`, sessionId, "EX", SESSION_TTL_SECONDS);
        }

        return res.status(200).json({
            message: "User payment updated successfully",
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiersAt: user.planExpiersAt,
        });
    } catch (error) {
        console.error("Update user payment error:", error);
        return res.status(500).json({ message: error.message });
    }
};


export const deductCredits = async (req, res) => {
    try {
        const { credits, userId, agentType } = req.body;

        const COST = {
            chat: 1,
            search: 5,
            serach: 5,
            coding: 10,
            pdf: 10,
            ppt: 10,
            image: 10,
            imageGen: 10,
            imageAnalyzer: 10,
            "image-gen": 10,
            "pdf-rag": 10,
            pdfRAG: 10,
        };

        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({message: "User not found"})
        }
        const requiredCredits = COST[agentType] || 1;
        if(user.credits < requiredCredits){
            return res.status(400).json({message: "Insufficient credits"})
        }
        user.credits -= requiredCredits;
        await user.save();

        const sessionId = await redis.get(`user-session:${userId}`);
        if(sessionId){
            await redis.set(`session:${sessionId}`, JSON.stringify(buildSessionPayload(user)), "EX", SESSION_TTL_SECONDS);
            await redis.set(`user-session:${userId}`, sessionId, "EX", SESSION_TTL_SECONDS);
        }

        return res.status(200).json({message: "Credits deducted successfully", credits: user.credits})
    } catch (error) {
        console.error("Deduct credits error:", error);
        return res.status(500).json({message: error.message})
    }
}