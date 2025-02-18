const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config();

// env
const clientId = process.env.BOT_CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

// Validate environment variables
if (!clientId || !guildId || !token) {
  console.error("Required environment variables missing:");
  console.error(`BOT_CLIENT_ID: ${clientId ? "✓" : "✗"}`);
  console.error(`GUILD_ID: ${guildId ? "✓" : "✗"}`);
  console.error(`BOT_TOKEN: ${token ? "✓" : "✗"}`);
  process.exit(1);
}

const commands = [];

// Grab all command files
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js") &&
  !file.endsWith(".test.js") &&
  !file.endsWith(".spec.js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing required properties.`
    );
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy commands
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    if (error.code === "ConnectionRefused") {
      console.error("Connection refused. Please check:");
      console.error("1. Your internet connection");
      console.error("2. Discord API status: https://discordstatus.com");
      console.error("3. Bot token validity");
    } else {
      console.error("Deployment error:", error);
    }
  }
})();
