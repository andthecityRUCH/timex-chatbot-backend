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

const fs = require("fs");
const dataPath = path.resolve(__dirname, 'data.json');
const data = fs.readFileSync(dataPath, 'utf-8');


app.post('/ask', async (req, res) => {
  try {
    const userMessage = req.body.message.toLowerCase();
    console.log("📩 Received from frontend:", userMessage);

    // 🔍 1. Check FAQ match
    const faqMatch = data.faqs.find(faq =>
      userMessage.includes(faq.question.toLowerCase())
    );    
    if (faqMatch) {
      console.log("✅ Matched FAQ");
      return res.json({ reply: faqMatch.answer });
    }

    // 🕵️‍♂️ 2. Check for category (men, women, unisex, kids)
    const categories = ["men", "women", "unisex", "kids"];
    const matchedCategory = categories.find(cat => userMessage.includes(cat));
    if (matchedCategory) {
      const matchingProducts = data.products.filter(p => p.category === matchedCategory);
      if (matchingProducts.length > 0) {
        const productText = matchingProducts.map(p =>
          `🕒 ${p.name}\n📖 ${p.description}\n🛒 Buy Now: ${p.url}`
        ).join('\n\n');
        console.log("✅ Matched product category");
        return res.json({ reply: productText });
      }
    }

    // 💬 3. Fallback to Gemini
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


// Fallback route - Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});


