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
    await interaction.reply((process.env.ENV === 'dev') ? "Secret Pong" : "Pong!")
  }
};
export default pingCommand;
