//const { HfInference } = require("@huggingface/inference");
//const dotenv = require("dotenv");
const { hf, CHAT_MODELS, SYSTEM_PROMPT } = require("./utils/inferences");
const { translate } = require("./utils/translate");
const fs = require("fs").promises;
const path = require("path");

//dotenv.config();

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

async function handleMessage(message) {
  try {
    await message.channel.sendTyping();

    // Get channel history
    const channelHistory = lastMessages.get(message.channel.id) || [];

    let userInput = message.content.replace(/<@!\d+>/g, "").trim();
    userInput = await translate(userInput);
    const response = await hf.chatCompletion({
      model: CHAT_MODELS.phi3,
      messages: [
        SYSTEM_PROMPT,
        {
          role: "user",
          content: userInput,
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
    // await logToFile(message, botResponse);

    // Send response
    return await message.reply(botResponse);
  } catch (error) {
    console.error(error);
    await message.reply("Maaf, terjadi kesalahan saat memproses pesan Anda.");
  }
}

module.exports = { handleMessage };
