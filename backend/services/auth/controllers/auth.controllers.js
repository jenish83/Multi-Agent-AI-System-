import { getAuth } from "firebase-admin/auth";
import app from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";

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
        // 7 days
        const sessionTtlSeconds = 7 * 24 * 60 * 60;

        // Set the session in Redis
        await redis.set(`session:${sessionId}`, JSON.stringify({
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            avatar: user.avatar,
        }), "EX", sessionTtlSeconds);

        res.cookie("sessionId", sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: sessionTtlSeconds * 1000,
            sameSite: "lax",
            path: "/",
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
    try{
        const sessionId = req.cookies?.sessionId;
        await redis.del(`session:${sessionId}`);

        res.clearCookie("sessionId", { path: "/" });
        return res.status(200).json({ message: "Logout successful" });
    }catch(error){
        console.error("Logout error:", error);
        return res.status(500).json({ message: error.message });
    }
}