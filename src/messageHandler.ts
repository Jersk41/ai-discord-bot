import { hf, CHAT_MODELS, SYSTEM_PROMPT } from "./utils/inferences";
import { translate } from "./utils/translate";
import type { ChatCompletionOutput } from "@huggingface/tasks";
import { Message, MessageCreateOptions, TextChannel } from "discord.js";
import type { MessageResponse, ErrorResponse } from "./types";
import { logger } from "./utils/logger";

//dotenv.config();

/*
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
*/
export const handleMessage = async (message: Message): Promise<void> => {
  try {
    // Start typing indicator using the new method
    if (message.channel.isTextBased()) {
      await (message.channel as TextChannel).sendTyping();
    }

    let userInput = message.content.replace(/<@!\d+>/g, "").trim();
    userInput = await translate(userInput);
    const response: ChatCompletionOutput = await hf.chatCompletion({
      model: CHAT_MODELS.phi3, //CHAT_MODELS[modelChoice.name] || CHAT_MODELS.phi3,
      messages: [SYSTEM_PROMPT, { role: "user", content: userInput }],
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

    let botResponse = response.choices[0].message;
    if (!botResponse || !botResponse.content) {
      logger.error("Respon bot tidak cocok", botResponse);
      return;
    }

    try {
      const content = JSON.parse(botResponse.content).data;
      botResponse = content;
    } catch (err: Error | unknown) {
      logger.error("Error parsing data: ", err instanceof Error ? err.message : String(err));
      return;
    }

    /* Parse and validate response
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
    */

    // Send response
    await message.reply(botResponse);
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : "Unknown error occurred",
      code: 500,
      details: error
    };
    logger.error("Message handling error:", errorResponse);
    await message.reply(errorResponse.message);
  }
}

export const processResponse = (messageData: MessageResponse): MessageCreateOptions => {
  const response: MessageCreateOptions = {
    content: messageData.content
  };

  if (messageData.attachments?.length) {
    response.files = messageData.attachments.map(attachment => ({
      name: attachment.name,
      attachment: attachment.data
    }));
  }

  return response;
}

export const handleError = (error: unknown): ErrorResponse => {
  const errorResponse: ErrorResponse = {
    message: error instanceof Error ? error.message : "An unknown error occurred",
    code: error instanceof Error ? 400 : 500,
    details: error
  };
  logger.error("Error occurred:", errorResponse);
  return errorResponse;
};
