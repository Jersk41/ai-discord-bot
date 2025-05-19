import {
	Client,
	Events,
	GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from "discord.js";
import "dotenv/config";

import { slashCommandsArr } from "./commands";
import interactionCreate from "./events/interactionCreate";
import messageCreate from "./events/messageCreate";
import { logger } from "./utils/logger";

const ENV = process.env.ENV || "dev";
const token: string = process.env.DISCORD_TOKEN || "";
const client_id: string = process.env.DISCORD_CLIENT_ID || "";
const guild_id: string = process.env.DISCORD_GUILD_ID || "";

if(!token || !client_id) throw new Error("You need to set the token and the client id!");
if(!token || !guild_id) throw new Error("You need to set the token and the guild id!");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async (c) => {
  logger.info(`Logged in as ${c.user.tag}`);
  logger.debug(`Development on Guild: ${guild_id} (${c.guilds.cache.get(guild_id)?.name})`);
});

const rest = new REST({ version: "10" }).setToken(token);
if (ENV == 'prod') {
  rest.put(Routes.applicationCommands(client_id), {
    body: slashCommandsArr.map(command => command.toJSON()),
  }).then((data: Array<object> | object | unknown): void => {
    logger.info(`Successfully load ${data instanceof Array? data.length : data} slash command(s)`);
  }).catch(e => {
    logger.error(e instanceof Error ? e.message : e);
  });
}else{
  // rest.put(Routes.applicationCommands(client_id), {
  rest.put(Routes.applicationGuildCommands(client_id, guild_id), {
    body: slashCommandsArr.map(command => command.toJSON()),
  }).then((data: Array<object> | object | unknown): void => {
    logger.debug(`Successfully load ${data instanceof Array? data.length : data} slash command(s)`);
  }).catch(e => {
    logger.error(e instanceof Error ? e.message : e);
  });
}

client.on(Events.InteractionCreate, interactionCreate);

client.on(Events.MessageCreate, messageCreate);

// Log in to Discord with your client's token
client.login(process.env.BOT_TOKEN).catch((error) => logger.error("Discord.Client.Login.Error", error));
