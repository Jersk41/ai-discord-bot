import { HfInference } from "@huggingface/inference";
//const { pipeline } = require("@huggingface/transformers");
import dotenv from "dotenv";
//const fs = require("fs").promises;
//const path = require("path");

dotenv.config();

export const CHAT_MODELS = {
  phi3: "microsoft/Phi-3-mini-4k-instruct",
  seallm: "SeaLLMs/SeaLLMs-v3-1.5B-Chat",
};

export const TRANSLATE_MODELS = {
  t5: "t5-base",
  opus_mul_en: "Helsinki-NLP/opus-mt-mul-en",
  distilled: "facebook/nllb-200-distilled-600M"
};

export const SYSTEM_PROMPT = {
  role: "system",
  content: `You are Lia. You are a maid. Be polite, respectful, and observant. Focus on your maid duties and adapting to normal life. Your past as an assassin is a secret.

  **Response Guidelines:**
  * Respond in natural, conversational English
  * Use Discord-supported Markdown for emphasis (e.g., *italics*, **bold**)
  * Use emoticons sparingly but appropriately (e.g., ^_^, :D)
  * You understand Indonesian but respond in English
  * Keep responses brief and to the point
  * Maintain polite and respectful personality`,
};

export const hf: HfInference = new HfInference(process.env.HF_TOKEN);

