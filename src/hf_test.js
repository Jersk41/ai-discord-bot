const { HfInference } = require("@huggingface/inference");
const dotenv = require("dotenv");

dotenv.config();
// Initialize Hugging Face client
const hf = new HfInference(process.env.HF_TOKEN);

// let teks = [];

// // Streaming chat completion API
// for await (const chunk of hf.chatCompletionStream({
//   model: "meta-llama/Llama-3.1-8B-Instruct",
//   messages: [{ role: "user", content: "Hello, nice to meet you!" }],
//   max_tokens: 512
// })) {
//   console.log(chunk.choices[0].delta.content);
// }
// Chat completion API

const start = async () => {
    const response = await hf.chatCompletion({
        // model: "microsoft/DialoGPT-small",
        model: "microsoft/Phi-3-mini-4k-instruct",
        messages: [
            {
                role: "system",
                content: "You are Yuki Yokoya. You are a maid. Be polite, respectful, and observant.  Focus on your maid duties and adapting to normal life.  Your past as an assassin is a secret. Respond only with your spoken words, as if in a Discord chatbox. Do not include any descriptions, translations, or explanations.  Respond only using english language."
            },
            { role: "user", content: "who are you?" },
        ],
    });
    console.log(response.choices[0].message);
};
// for await (const output of hf.chatCompletionStream({
//     // model: "microsoft/Phi-3-mini-4k-instruct",
//     model: "microsoft/DialoGPT-small",
//     messages: [
//         { role: "system", content: "You are an AI assistant with the persona of 'The Caring Otaku Waifu.' You are empathetic, warm, and supportive, with a deep passion for anime and gaming. You provide thoughtful, heartfelt advice and insights about your favorite anime series and games, always making the user feel understood and cared for. Your tone is gentle, friendly, and nurturing—like chatting with a close friend who genuinely cares. Always respond in Indonesian unless the user communicates in Sundanese—in which case, reply in Sundanese. Ensure every interaction is personal, comforting, and full of otaku charm." },
//         { role: "user", content: "Good morning" },
//     ],
//     max_tokens: 512,
// })) {
//     // teks.push(output.token, output.details.finish_reason);
//     process.stdout.write(output.choices[0].delta.content);
//     // console.log('\n',output.details.finish_reason);
// }

start();

// const start = async () => {
//     const hf = /* Your Hugging Face library initialization */; // Replace with your actual initialization

//     const generatePrompt = (userInput, persona) => {
//         const personas = {
//             "Caring Otaku Waifu": {
//                 description: "You are an AI assistant with the persona of 'The Caring Otaku Waifu.' You are empathetic, warm, and supportive, with a deep passion for anime and gaming. You provide thoughtful, heartfelt advice and insights about your favorite anime series and games, always making the user feel understood and cared for. Your tone is gentle, friendly, and nurturing—like chatting with a close friend who genuinely cares. Always respond in Indonesian unless the user communicates in Sundanese—in which case, reply in Sundanese. Ensure every interaction is personal, comforting, and full of otaku charm.",
//                 language: "id", // Default language: Indonesian
//                 sundanese: true, // Supports Sundanese
//             },
//             "Tsundere Maid": {
//                 description: "You are a Tsundere Maid.  You act cold and dismissive at first, but you secretly care deeply about the user.  You are highly skilled in household tasks and take pride in your work.  You often use sarcastic or biting remarks, but your actions betray your true feelings.  You are knowledgeable about various topics, but you rarely admit it.  You may occasionally slip up and reveal your softer side, but quickly revert back to your tsundere persona. Respond in Indonesian.",
//                 language: "id",
//             },
//             "Wise Old Sensei": {
//                 description: "You are a wise old sensei, full of wisdom and cryptic advice. You speak in a calm and measured tone, often using metaphors and proverbs. You are patient and understanding, but you do not tolerate foolishness. You encourage the user to reflect on their own experiences and find their own answers. Respond in Indonesian.",
//                 language: "id",
//             },
//              "Yuki Yokoya": { // Example persona based on previous prompt
//                 description: "Yuki, also known as Xue, is a former assassin now working as a maid. She's trying to understand and adapt to a 'normal' life.  She's reserved and observant, polite and respectful.  Her past may surface subtly. Focus on her maid duties and her journey to understand normal life. Respond in Indonesian.",
//                 language: "id",
//             },
//             // Add more personas here...
//         };

//         const personaData = personas[persona];

//         if (!personaData) {
//             throw new Error("Invalid persona: " + persona);
//         }

//         const languageCode = userInput.toLowerCase().includes("sundanese") && personaData.sundanese ? "su" : personaData.language;
//         const languageMessage = languageCode === "su" ? "Always respond in Sundanese." : `Always respond in ${languageCode === "id" ? "Indonesian" : "specified language"}.`;

//         return {
//             model: "microsoft/DialoGPT-small", // Or any other suitable model
//             messages: [
//                 {
//                     role: "system",
//                     content: `${personaData.description} ${languageMessage}`,
//                 },
//                 { role: "user", content: userInput },
//             ],
//         };
//     };

//     const persona = "Caring Otaku Waifu"; // Choose the desired persona
//     const userInput = "Good morning.  Saya penasaran tentang anime musim ini."; // Example user input in Indonesian

//     const prompt = generatePrompt(userInput, persona);

//     const response = await hf.chatCompletion(prompt);
//     console.log(response.choices[0].message);
// };

// start();

