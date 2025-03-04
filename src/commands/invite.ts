import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
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
    const invitationEmbed = new EmbedBuilder()
    .setColor([100,120,205])
    .setTitle("Lia - Invite")
    .setAuthor({
      name: "Lia",
    })
    .setDescription("Hello! I'm so flattered to be considered for an invite. Although I specialize in...um, other duties...I wish you all the best in your server community!")

    const invite = new ButtonBuilder()
    // .setCustomId("invite")
    .setLabel("Invite me")
    .setURL(`https://discord.com/oauth2/authorize?client_id=${token}&permissions=277062343744&scope=bot%20applications.commands`)
    .setStyle(ButtonStyle.Link)

    const support = new ButtonBuilder()
    // .setCustomId("server")
    .setLabel("Support Server")
    .setURL("https://discord.gg/s5GujHGqGM")
    .setStyle(ButtonStyle.Link)

    const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(invite, support);

    await interaction.reply({
      embeds: [invitationEmbed],
      components: [row]
    });
  }
};
export default inviteCommand;
