
const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Add a new income or expense
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body || {};

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100 ||
      typeof category !== "string" ||
      !category.trim() ||
      category.trim().length > 50
    ) {
      return res.status(400).json({
        message: "Valid title and category are required.",
      });
    }

    if (
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        message: "Amount must be greater than zero.",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        message: "Type must be income or expense.",
      });
    }

    let transactionDate;

    if (date === undefined || date === "") {
      transactionDate = new Date();
    } else {
      transactionDate = new Date(date);

      if (Number.isNaN(transactionDate.getTime())) {
        return res.status(400).json({
          message: "Please provide a valid date.",
        });
      }
    }

    const transaction = await Transaction.create({
      title: title.trim(),
      amount: Number(amount),
      type,
      category: category.trim(),
      date: transactionDate,
      user: req.userId,
    });

    return res.status(201).json({
      message: "Transaction added successfully.",
      transaction,
    });
  } catch (error) {
    console.error("Add transaction error:", error.message);
    return res.status(500).json({
      message: "Failed to add transaction.",
    });
  }
});

// Fetch transactions belonging to the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.userId,
    }).sort({ date: -1, createdAt: -1 });

    return res.json({ transactions });
  } catch (error) {
    console.error("Fetch transactions error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch transactions.",
    });
  }
});

// Delete a transaction belonging to the logged-in user
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid transaction ID.",
      });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      user: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    return res.json({
      message: "Transaction deleted successfully.",
      transaction,
    });
  } catch (error) {
    console.error("Delete transaction error:", error.message);
    return res.status(500).json({
      message: "Failed to delete transaction.",
    });
  }
});

module.exports = router;
