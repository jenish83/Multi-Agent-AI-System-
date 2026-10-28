import redis from "../../shared/redis/redis.js";

const readSession = async (req) => {
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) return null;

    const session = await redis.get(`session:${sessionId}`);
    if (!session) return null;

    return JSON.parse(session);
};

// Session check for the login screen. A missing session is a normal logged-out visit.
export const loadUser = async (req, res, next) => {
    try {
        req.user = await readSession(req);
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const protect = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.sessionId;
        if (!sessionId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const session = await redis.get(`session:${sessionId}`);
        if (!session) {
            return res.status(401).json({ message: "Session Expired" });
        }

        req.user = JSON.parse(session);
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};