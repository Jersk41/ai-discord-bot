import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import dotenv from "dotenv";
dotenv.config();

const pingCommand: SlashCommand = {
  data: new SlashCommandBuilder()
  .setName("ping")
  .setDescription('Replies with Pong!'),
  execute: async (interaction) => {
    //const options: { [key:string]: string | number | boolean } = {};
    await interaction.reply("Pong!" + (process.env.DISCORD_GUILD_ID == interaction.guildId?.toString()) ? "Dev only mode" : "")
  }
};
export default pingCommand;
