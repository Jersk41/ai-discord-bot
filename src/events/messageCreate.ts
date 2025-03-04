import { Message } from "discord.js";
import { handleMessage } from "../messageHandler";

const messageCreate = async (message: Message) => {
  if (message.author.bot) return;

  const isMentioned = message.mentions.has(message.client.user);
  const isReplyToBot = message.reference?.messageId &&
    (await message.channel.messages.fetch(message.reference.messageId))
      .author.id === message.client.user.id;

  if (isMentioned || isReplyToBot) {
    await handleMessage(message);
  }
}

export default messageCreate;
