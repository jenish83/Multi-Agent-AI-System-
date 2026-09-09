import mongoose from "mongoose";
import dns from "node:dns";

// Node on Windows often uses 127.0.0.1 as DNS, which refuses Atlas SRV lookups.
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { family: 4 });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;