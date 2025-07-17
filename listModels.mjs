import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
  const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    console.error("❌ Failed to fetch models:", response.status, await response.text());
    return;
  }

  const data = await response.json();
  console.log("📋 Available Models:");
  data.models.forEach(model => {
    console.log(`- ${model.name}`);
  });
}

listModels();
