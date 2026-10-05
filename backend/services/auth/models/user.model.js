import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    avatar: {
        type: String,
    },
    plan: {
        type: String,
        default: "free",
    },
    credits: {
        type: Number,
        default: 100,
    },
    totalCredits: {
        type: Number,
        default: 100,
    },
    planExpiersAt: {
        type: Date,
    }

}, { timestamps: true });


const User = mongoose.model("User", userSchema);

export default User;