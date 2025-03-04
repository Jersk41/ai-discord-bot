import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import dotenv from "dotenv";

dotenv.config();
const token: string = process.env.DISCORD_TOKEN || "";

const inviteCommand: SlashCommand = {
  data: new SlashCommandBuilder()
  .setName("invite")
  .setDescription('Give link bot invitation'),
  execute: async (interaction) => {
    //const options: { [key:string]: string | number | boolean } = {};
    await interaction.reply(`https://discord.com/oauth2/authorize?client_id=${token}&permissions=277062343744&scope=bot%20applications.commands`)
  }
};
export default inviteCommand;
