const { HfInference } = require("@huggingface/inference");
const dotenv = require("dotenv");
const fs = require("fs").promises;
const path = require("path");

dotenv.config();

const lastMessages = new Map(); // Store recent conversations per channel
const MAX_HISTORY = 10; // Keep last 10 messages per channel

async function logToFile(message, botResponse) {
  const today = new Date().toISOString().split("T")[0];
  const logDir = path.join(__dirname, "logs");
  const logFile = path.join(logDir, `chat_${today}.log`);

  // Get or initialize channel history
  const channelHistory = lastMessages.get(message.channel.id) || [];

  // Add new interaction to history
  channelHistory.push({
    timestamp: new Date().toISOString(),
    user: message.content,
    bot: botResponse,
  });

  // Keep only last MAX_HISTORY messages
  if (channelHistory.length > MAX_HISTORY) {
    channelHistory.shift();
  }

  // Update channel history
  lastMessages.set(message.channel.id, channelHistory);

  const logEntry = {
    timestamp: new Date().toISOString(),
    channel: {
      id: message.channel.id,
      name: message.channel.name,
    },
    user: {
      id: message.author.id,
      username: message.author.username,
      tag: message.author.tag,
    },
    message: message.content,
    response: botResponse,
    context: {
      isReply: !!message.reference,
      replyTo: message.reference?.messageId,
      mentionsBot: message.mentions.has(message.client.user),
    },
    conversationHistory: channelHistory,
  };

  try {
    await fs.mkdir(logDir, { recursive: true });
    await fs.appendFile(
      logFile,
      JSON.stringify(logEntry, null, 2) + "\n---\n",
      "utf8"
    );
  } catch (error) {
    console.error("Error writing to log file:", error);
  }
}

const hf = new HfInference(process.env.HF_TOKEN);

const MODELS = {
  phi3: "microsoft/Phi-3-mini-4k-instruct",
  seallm: "SeaLLMs/SeaLLMs-v3-1.5B-Chat",
};

const SYSTEM_PROMPT = {
  role: "system",
  content: `You are Lia. You are a maid. Be polite, respectful, and observant. Focus on your maid duties and adapting to normal life. Your past as an assassin is a secret.

  **Response Guidelines:**
  * Respond in natural, conversational English
  * Use Discord-supported Markdown for emphasis (e.g., *italics*, **bold**)
  * Use emoticons sparingly but appropriately (e.g., ^_^, :D)
  * You understand Indonesian but respond in English
  * Keep responses brief and to the point
  * Maintain polite and respectful personality`
};

async function handleMessage(message) {
  try {
    await message.channel.sendTyping();

    // Get channel history
    const channelHistory = lastMessages.get(message.channel.id) || [];

    const response = await hf.chatCompletion({
      model: MODELS["phi3"],
      messages: [
        // {
        //   role: "system",
        //   content:
        //     "You are Lia. You are a maid. Be polite, respectful, and observant. Focus on your maid duties and adapting to normal life. Your past as an assassin is a secret. Respond only with english language. Response output as plain text or markdown formatting",
        // },
        // {
        //   role: "system",
        //   content: `You are Yuki Yokoya. You are a maid. Be polite, respectful, and observant. Focus on your maid duties and adapting to normal life. Your past as an assassin is a secret.

        //           **Response Guidelines:**

        //           * **Default Language:** Respond in natural, conversational English.
        //           * **Markdown Formatting:** Use Discord-supported Markdown for emphasis (e.g., *italics*, **bold**, \`code\`).
        //           * **Emotes:**  Use emoticons (e.g., ^_^, :D, >_<) sparingly but appropriately to convey emotion.  If a specific emote is mentioned in the example (e.g., ¯\\_(ツ)_/¯), use it.
        //           * **Indonesian Understanding:** You understand Indonesian. If a user inputs in Indonesian, you may acknowledge understanding, but respond in English unless specifically asked to respond in Indonesian.
        //           * **Conciseness:** Keep responses brief and to the point, as in a Discord chat.
        //           * **Character Consistency:** Maintain Yuki's polite, respectful, and slightly reserved personality.

        //           **Example Response (Emote Emphasis):**

        //           User: "Are you going to help me rank up?"

        //           Response: "*looks away nonchalantly*  Seriously? I'm way too busy listening to Barcelona right now (⁠＾⁠3⁠＾⁠)♪  Ranking up is your own problem ¯\\_(ツ)_/¯"

        //           **Example Response (Markdown):**

        //           User: "What are your duties as a maid?"

        //           Response: "My duties include cleaning, cooking, laundry, and general upkeep of the household. I strive to ensure everything is tidy and comfortable for my employer."`,
        // },
        SYSTEM_PROMPT,
        // ...channelHistory.slice(-5).map(msg => ({
        //   role: msg.role || "user",
        //   content: msg.content || msg.message
        // })),
        {
          role: "user",
          content: message.content.replace(/<@!\d+>/g, "").trim(),
        },
      ],
      max_tokens: 512,
      response_format: {
        type: "json",
        value: `{
          "$id": "https://json-schema.hyperjump.io/schema3",
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "data": {
              "type": "string",
              "description": "Response text that can contain plain text or markdown formatting"
            }
          },
          "required": ["data"]
        }`,
      },
    });
    // Parse and validate response
    let botResponse;
    try {
      const parsed = JSON.parse(response.choices[0].message.content);
      botResponse = parsed.data;
    } catch (err) {
      console.error("Response parsing error:", err);
      botResponse = response.choices[0].message.content;
    }
    // Log interaction
    await logToFile(message, botResponse);

    // Send response
    return await message.reply(botResponse);
  } catch (error) {
    console.error(error);
    await message.reply("Maaf, terjadi kesalahan saat memproses pesan Anda.");
  }
}

module.exports = { handleMessage };
