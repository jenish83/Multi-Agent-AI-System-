// Must run before any module that reads process.env at import time (e.g. redis).
import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import router from "./routes/chat.routes.js";

const port = process.env.PORT || 8001;

const app = express();
app.use(express.json());
app.use('/', router);
app.get("/", (req, res) => {
    res.json({ message: "Chat service is running" });
});

app.listen(port, () => {
    console.log(`Chat service is running on port ${port}`);
    connectDB();
});