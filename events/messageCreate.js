const { Events } = require('discord.js');
const { handleMessage } = require('../messageHandler');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const isMentioned = message.mentions.has(message.client.user);
        const isReplyToBot = message.reference?.messageId && 
            (await message.channel.messages.fetch(message.reference.messageId))
            .author.id === message.client.user.id;

        if (isMentioned || isReplyToBot) {
            await handleMessage(message);
        }
    },
};