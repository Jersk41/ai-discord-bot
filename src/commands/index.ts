import { Collection } from "discord.js";
import { SlashCommand, SlashCommandBuilderTypes } from "../types";

// Import all the commands file
import pingCommand from "./ping";
import chatCommand from "./chat";
import inviteCommand from "./invite";
import {
  joinVc as joinCommand,
  outVc as outCommand,
  ttsCommand
} from "../commands/voice";

// Register all slash command here
export const slashCommands = new Collection<string, SlashCommand>();
slashCommands.set(pingCommand.data.name, pingCommand);
slashCommands.set(chatCommand.data.name, chatCommand);
slashCommands.set(joinCommand.data.name, joinCommand);
slashCommands.set(outCommand.data.name, outCommand);
slashCommands.set(ttsCommand.data.name, ttsCommand);
slashCommands.set(inviteCommand.data.name, inviteCommand);

// Put slashCommands in array - fix the type to accept all possible command data types
export const slashCommandsArr = [
  pingCommand.data,
  chatCommand.data,
  joinCommand.data,
  outCommand.data,
  ttsCommand.data,
  inviteCommand.data
] as const satisfies readonly SlashCommandBuilderTypes[];
