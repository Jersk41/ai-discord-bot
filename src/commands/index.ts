import { Collection, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

// Import all the commands file
import pingCommand from "./ping";
import chatCommand from "./chat";

// Register all slash command here
export const slashCommands = new Collection<string, SlashCommand>();
slashCommands.set(pingCommand.command.name, pingCommand);
slashCommands.set(chatCommand.command.name, chatCommand);

// Put slashCommands in array
export const slashCommandsArr: SlashCommandBuilder[] = [
  pingCommand.command,
  chatCommand.command
]
