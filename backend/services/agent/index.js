// Must run first so backend/services/agent/.env wins over a stale Windows GROQ_API_KEY.
import "./config/env.js";
import express from "express";
import connectDB from "./config/db.js";
import router from "./routes/agent.route.js";

const port = process.env.PORT || 8002;

const app = express();
app.use(express.json());
app.use("/", router);
app.get("/", (req, res) => {
    res.json({ message: "Agent service is running" });
});

app.listen(port, () => {
    console.log(`Agent service is running on port ${port}`);
    connectDB();
});