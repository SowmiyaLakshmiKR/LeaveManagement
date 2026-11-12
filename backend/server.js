
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://leavemanagement-frontend-pi.vercel.app",
        process.env.FRONTEND_URL
    ].filter(Boolean)
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Leave Management API is running" });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/leaves", require("./routes/leaves"));

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected");

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
