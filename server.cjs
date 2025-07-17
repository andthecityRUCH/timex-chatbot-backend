const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { GoogleGenerativeAI } = require('@google/generative-ai');
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// API Route - Chatbot interaction
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/ask', async (req, res) => {
  try {
    const userMessage = req.body.message;
    console.log("📩 Received from frontend:", userMessage);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
    You are a helpful customer support chatbot for Timex so assume they are asking you about timex policies and timex watches.
    
    Your response MUST:
    - Be short and concise in a paragraph but make it small
    - Be under 5 concise bullet points if there is a requirement for bullet points otherwise do not use them
    - Avoid long paragraphs at all cost 
    - Skip generic/unnecessary advice unless directly asked
    - Be polite and friendly 
    - Your answer should be full not assumptions like "it will take X days" don’t use X or placeholder values with the customer, just use common sense and information from timex’s website and policies
  
    User question: "${userMessage}"
    
    Now respond:
    `;
    
    const result = await model.generateContent([prompt]);
    const text = result.response.text();

    console.log("🤖 Gemini response:", text);
    res.json({ reply: text });
  } catch (err) {
    console.error("❌ Gemini API error:", err);
    res.json({ reply: "Sorry, something went wrong." });
  }
});

// Fallback route - Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});


