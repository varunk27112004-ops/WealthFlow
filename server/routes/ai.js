
const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;

    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 1000
    ) {
      return res.status(400).json({
        message: "Enter a question of up to 1000 characters.",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: question.trim(),
      config: {
        systemInstruction:
          "You are WealthFlow, a friendly personal budgeting assistant. " +
          "Give clear, practical guidance about budgeting, saving, and expenses. " +
          "Use simple language. Do not claim to be a licensed financial adviser. " +
          "Never ask for passwords, bank account numbers, or other sensitive details.",
        maxOutputTokens: 500,
      },
    });

    return res.json({
      answer: response.text || "Sorry, I couldn't generate an answer.",
    });
  } catch (error) {
    console.error("WealthFlow Gemini error:", error.message);

    return res.status(500).json({
      message: "The AI assistant could not respond. Please try again.",
    });
  }
});

module.exports = router;
