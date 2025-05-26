// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI } from "@google/genai";

export const geminiModel = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});
