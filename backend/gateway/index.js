import "dotenv/config";
import express from "express";
import proxy from "express-http-proxy";
import cors from "cors";
import cookieParser from "cookie-parser";
import { protect } from "./middleware/auth.middleware.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import morgan from "morgan";
const port = process.env.PORT || 8000;

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

app.use(morgan("dev"));
// cookie parser is used to parse the cookie header and make it available on req.cookies
app.use(cookieParser());
// Proxy before express.json() so the request body is not consumed first
app.use("/api/auth", proxy(process.env.AUTH_SERVICE));
app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE));
app.use("/api/me", protect, getCurrentUser);
app.use("/api/agent", protect, proxyWithHeader(process.env.AGENT_SERVICE));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Gateway is running" });
});

app.listen(port, () => {
    console.log(`Gateway is running on port ${port}`);
});
