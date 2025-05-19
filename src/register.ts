import { REST, Routes, DiscordAPIError  } from "discord.js";
import "dotenv/config";
import { slashCommandsArr } from "./commands";

// env
const token: string = process.env.DISCORD_TOKEN || "";
const client_id: string = process.env.DISCORD_CLIENT_ID || "";
const guild_id: string = process.env.DISCORD_GUILD_ID || "";

// Validate environment variables
if (!client_id || !guild_id || !token) {
  console.error("Required environment variables missing:");
  console.error(`DISCORD_CLIENT_ID: ${client_id ? "✓" : "✗"}`);
  console.error(`DISCORD_GUILD_ID: ${guild_id ? "✓" : "✗"}`);
  console.error(`DISCORD_TOKEN: ${token ? "✓" : "✗"}`);
  process.exit(1);
}

/*
const commands = [];

// Grab all command files
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".ts"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  //const command = require(filePath);
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing required properties.`
    );
  }
}
*/

const commands = slashCommandsArr.map(command => command.toJSON())

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(token);

// Deploy commands
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data: Array<object> | object | unknown = await rest.put(
      Routes.applicationCommands(client_id),
      { body: commands }
    );
    //console.log("Debug slash/commands array: ", data);

    console.log(
      `Successfully reloaded ${data instanceof Array? data.length : data} application (/) commands.`
    );
    process.exit(0);
  } catch (error: DiscordAPIError | unknown) {
    if (error instanceof DiscordAPIError && error.status === 401) {
      console.error("Connection refused. Please check:");
      console.error("1. Your internet connection");
      console.error("2. Discord API status: https://discordstatus.com");
      console.error("3. Bot token validity");
    }else{
      console.error("Deployment error:", error);
    }
    process.exit(1);
  }
})();
