import redis from "../../shared/redis/redis.js";

export const protect = async (req, res, next) => {
    try{
        const sessionId = req.cookies?.sessionId; 
        if(!sessionId){
            return res.status(401).json({ message: "Unauthorized" });
        }
        const session = await redis.get(`session:${sessionId}`);
        if(!session){
            return res.status(401).json({ message: "Session Expired" });
        }
        req.user = JSON.parse(session)
        next();
    }catch(error){
        console.error("Auth middleware error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
} 