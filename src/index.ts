import {
	Client,
	Events,
	GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from "discord.js";
import dotenv from "dotenv";

dotenv.config();

import { slashCommandsArr } from "./commands";
import interactionCreate from "./events/interactionCreate";
import messageCreate from "./events/messageCreate";

const token: string = process.env.DISCORD_TOKEN || "";
const client_id: string = process.env.DISCORD_CLIENT_ID || "";

if(!token || !client_id) throw new Error("You need to set the token and the client id!");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

const rest = new REST({ version: "10" }).setToken(token);
rest.put(Routes.applicationCommands(client_id), {
  body: slashCommandsArr.map(command => command.toJSON()),
}).then((data: Array<object> | object | unknown): void => {
  console.log(`Successfully load ${data instanceof Array? data.length : data} slash command(s)`);
}).catch(e => {
  console.error(e instanceof Error ? e.message : e);
});

client.on(Events.InteractionCreate, interactionCreate);

client.on(Events.MessageCreate, messageCreate);
/*
client.on(Events.MessageCreate, async interaction => {
  if (interaction.author.bot) return;

  const isMentioned = interaction.mentions.has(interaction.client.user);
  const isReplyToBot = interaction.reference?.messageId &&
    (await interaction.channel.messages.fetch(interaction.reference.messageId))
  .author.id === interaction.client.user.id;
  if (isMentioned || isReplyToBot) {
    await handleMessage(interaction);
  }
});
*/
/*
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}
*/
// Log in to Discord with your client's token
client.login(process.env.BOT_TOKEN).catch((error) => console.error("Discord.Client.Login.Error", error));
