
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    casualLeave: {
        type: Number,
        default: 10
    },
    medicalLeave: {
        type: Number,
        default: 10
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
