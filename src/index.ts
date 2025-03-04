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
  console.log(`Logged in as ${c.user.tag}`);
});

const rest = new REST({ version: "10" }).setToken(token);
if (process.env.ENV == 'prod') {
  rest.put(Routes.applicationCommands(client_id), {
    body: slashCommandsArr.map(command => command.toJSON()),
  }).then((data: Array<object> | object | unknown): void => {
    console.log(`Successfully load ${data instanceof Array? data.length : data} slash command(s)`);
  }).catch(e => {
    console.error(e instanceof Error ? e.message : e);
  });
}else{
  // rest.put(Routes.applicationCommands(client_id), {
  rest.put(Routes.applicationGuildCommands(client_id, guild_id), {
    body: slashCommandsArr.map(command => command.toJSON()),
  }).then((data: Array<object> | object | unknown): void => {
    console.log(`Successfully load ${data instanceof Array? data.length : data} slash command(s)`);
  }).catch(e => {
    console.error(e instanceof Error ? e.message : e);
  });

}

client.on(Events.InteractionCreate, interactionCreate);

client.on(Events.MessageCreate, messageCreate);

// Log in to Discord with your client's token
client.login(process.env.BOT_TOKEN).catch((error) => console.error("Discord.Client.Login.Error", error));

