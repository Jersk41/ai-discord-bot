const fs = require("fs");
const path = require("path/posix");
const {
	Client,
	Collection,
	Events,
	GatewayIntentBits,
	MessageFlags,
} = require("discord.js");
const dotenv = require("dotenv");

dotenv.config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});
client.commands = new Collection();
const cmdPath = path.join(__dirname, "commands")
const cmdFiles = fs.readdirSync(cmdPath).filter((file) => file.endsWith(".js"));

for (const file of cmdFiles) {
	const filePath = path.join(cmdPath, file);
	const command = require(filePath);
	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(
			`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
		);
	}
}

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

// Log in to Discord with your client's token
client.login(process.env.BOT_TOKEN);
