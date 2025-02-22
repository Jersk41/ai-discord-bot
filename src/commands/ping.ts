import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

const pingCommand: SlashCommand = {
  command: new SlashCommandBuilder()
  .setName("ping")
  .setDescription('Replies with Pong!'),
  execute: async (interaction) => {
    //const options: { [key:string]: string | number | boolean } = {}; 
    await interaction.reply("Pong!")
  }
};
export default pingCommand;
