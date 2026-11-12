
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Leave = require("../models/Leave");
const auth = require("../middleware/auth");

const router = express.Router();

// Calculate working days (Monday-Friday)
function calculateDays(start, end) {
    let count = 0;
    const date = new Date(start);
    const last = new Date(end);

    while (date <= last) {
        const day = date.getDay();
        if (day !== 0 && day !== 6) count++;
        date.setDate(date.getDate() + 1);
    }
    return count;
}

// Get leave balance
router.get("/balance", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select("casualLeave medicalLeave");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Could not fetch balance" });
    }
});

// Apply for leave
router.post("/apply", auth, async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;

        if (!["Casual", "Medical"].includes(leaveType) ||
            !startDate || !endDate || !reason?.trim()) {
            return res.status(400).json({ message: "Invalid application details" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) || end < start) {
            return res.status(400).json({ message: "Invalid leave dates" });
        }

        const days = calculateDays(start, end);

        if (days < 1) {
            return res.status(400).json({ message: "Select at least one working day" });
        }

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const balance = leaveType === "Casual"
            ? user.casualLeave : user.medicalLeave;

        const alreadyPending = await Leave.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.userId),
                    leaveType,
                    status: "Pending"
                }
            },
            { $group: { _id: null, total: { $sum: "$days" } } }
        ]);

        const pendingDays = alreadyPending[0]?.total || 0;

        if (days + pendingDays > balance) {
            return res.status(400).json({
                message: "Insufficient leave balance after pending applications"
            });
        }

        const leave = await Leave.create({
            userId: req.userId,
            leaveType,
            startDate: start,
            endDate: end,
            days,
            reason: reason.trim()
        });

        res.status(201).json({
            message: "Leave application submitted",
            leave
        });
    } catch (error) {
        res.status(500).json({ message: "Could not submit application" });
    }
});

// Get leave history
router.get("/history", auth, async (req, res) => {
    try {
        const leaves = await Leave.find({ userId: req.userId })
            .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: "Could not fetch leave history" });
    }
});

module.exports = router;
