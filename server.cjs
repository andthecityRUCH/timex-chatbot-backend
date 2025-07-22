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

// Gemini model setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/ask', async (req, res) => {
  try {
    const userMessage = req.body.message.toLowerCase();
    console.log("📩 Received from frontend:", userMessage);

    // 🧠 Fallback to Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
You are a helpful customer support chatbot for Timex so assume they are asking you about Timex policies and watches.

Your response MUST:
- Be short and concise in a paragraph
- Use 5 bullet points max *only* when necessary
- Avoid long paragraphs
- Skip generic/unnecessary advice unless directly asked
- Be polite and friendly
- Your answer should be full not assumptions like "it will take X days" don’t use X or placeholder values with the customer, just use common sense and information from timex’s website and policies
- Do not say Hi again and again just once is enough it makes it seems unatural do not say it in each sentence.
- When they ask for a link also assume its related to timex dont ask what are you refering to just understand the conversation and send things accordingly 

User question: "${req.body.message}"

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

// Fallback route - Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

