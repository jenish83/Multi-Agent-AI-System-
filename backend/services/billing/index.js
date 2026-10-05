import "dotenv/config";
import express from "express";

import connectDB from "./config/db.js";
import router from "./routes/billing.route.js";

const port = process.env.PORT || 8001;

const app = express();

app.use(express.json());
app.use("/", router)

app.get("/", (req, res) => {
    res.json({
        message: "Billing service is running"
    });
});

app.listen(port, async () => {
    console.log(`Billing service is running on port ${port}`);

    await connectDB();
});