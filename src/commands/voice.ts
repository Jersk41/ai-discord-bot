import fs from "fs";
import path from "path";
import {
  GuildMember,
  InteractionEditReplyOptions,
  SlashCommandBuilder,
  VoiceChannel,
} from "discord.js";
import {
  createAudioPlayer,
  getVoiceConnection,
  VoiceConnectionStatus,
  VoiceConnection,
  createAudioResource,
} from "@discordjs/voice";
import * as googleTTS from "google-tts-api";
import type { SlashCommand } from "../types";
import { connectToChannel } from "../utils/helpers";

let connection: VoiceConnection | undefined;

const joinVc: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Join voice channel"),
  execute: async (interaction) => {
    await interaction.deferReply();

    // Type guard to ensure we have a GuildMember
    if (!interaction.member || !(interaction.member instanceof GuildMember)) {
      await interaction.reply("Error: Could not determine member status.");
      return;
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      await interaction.reply(
        "You need to be in a voice channel to use this command."
      );
      return;
    }

    // Type guard for guild
    if (!interaction.guild) {
      await interaction.reply("This command can only be used in a guild.");
      return;
    }

    console.log(
      `Received joinvc command from ${interaction.user.tag} in ${interaction.guild.name}`
    );

    connection = await connectToChannel(voiceChannel);
    if (!connection) {
      await interaction.reply("Connection undefined!");
    }
    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log("Debug: Bot connection is ready");
    });
    const replyOptions: InteractionEditReplyOptions = {
      content: "I have joined and connected to your voice channel!",
    };
    await interaction.editReply(replyOptions);
  },
};

const outVc: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leave voice channel"),
  execute: async (interaction) => {
    await interaction.deferReply();
    try {
      if (!interaction.member || interaction.member == undefined){
        throw Error("No memeber proterie")
      }
      const member = interaction.member as GuildMember;
      if(!member.voice || member.voice == undefined){
        throw Error("No voice by member?")
      };

      const voiceChannel = member.voice.channel as VoiceChannel;
      connection = getVoiceConnection(voiceChannel.guild.id);
      if (!connection || connection === undefined) {
        throw Error("Error: Connection undefined");
      } else {
        connection.destroy();
      }
      const replyOptions: InteractionEditReplyOptions = {
        content: "_Left the voice channel_",
      };
      await interaction.editReply(replyOptions);
    } catch (error) {
      console.error(`Error occured, ${error}`);
    }
  },
};

export async function generateTTS(
  text: string,
  outputPath: fs.PathOrFileDescriptor,
  lang: string = "id-ID"
) {
  if (!text || typeof text !== "string" || text.trim() === "") {
    throw new Error("Invalid text input for TTS generation");
  }

  try {
    const results = googleTTS.getAllAudioUrls(`${text}`, {
      lang: lang,
      slow: false,
      host: "https://translate.google.com",
      splitPunct: ",.?! ",
    });
    const combinedBuffers: Buffer[] = [];
    for (const item of results) {
      const response = await fetch(item.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch TTS audio: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      combinedBuffers.push(Buffer.from(buffer));
    }
    fs.writeFileSync(outputPath, Buffer.concat(combinedBuffers));
    console.log("TTS generation successful");
  } catch (error) {
    console.error("Error generating TTS:", error);
    throw error;
  }
}

export const wordTranslations = {
  uwu: "ooo woo",
  owo: "oh woah",
  wkwk: "haha",
};

const ttsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
  .setName("tts")
  .setDescription("Convert your text to speech in voice channel")
  .addStringOption(option =>
    option.setName("message")
    .setDescription("The message you want to speak")
    .setRequired(true)
  ).addStringOption(option =>
    option.setName("language")
    .setDescription("Language of tts")
    .setChoices(
      { name: "indonesia", value: "id-ID" },
      { name: "inggris", value: "en-US" },
      { name: "sunda", value: "su-ID" },
      { name: "jawa", value: "jv-ID" },
    )
  ),
  execute: async (interaction) => {
    await interaction.deferReply();
    const options: { [key: string]: string | number | boolean } = {};
    for (let i = 0; i < interaction.options.data.length; i++) {
      const element = interaction.options.data[i];
      if (element.name && element.value) options[element.name] = element.value;
    }

    if (!interaction.member || !(interaction.member instanceof GuildMember)) {
      await interaction.editReply("Error: Could not determine member status.");
      return;
    }
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      await interaction.editReply("You need to be in a voice channel!");
      return;
    }
    const message = options.message;
    if (!message) {
      await interaction.editReply("No message provided!");
      return;
    }

    let cleanText = `${message}`
      .replace(/https?:\/\/[\w.-]+(\/\S*)?/g, "")
      .replace(/<:[\w]+:[0-9]+>/g, "")
      .replace(/:[\w]+:/g, "")
      .trim();

    for (const [word, translation] of Object.entries(wordTranslations)) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      cleanText = cleanText.replace(regex, translation);
    }

    if (!cleanText) return;

    try {
      // Setup paths for audio file
      const baseAudioPath = path.join("/tmp/dcbot", "audiofiles");
      if (!interaction.guildId || interaction.guildId == null) {
        console.error("no guild id found");
        return;
      }
      const serverPath = path.join(baseAudioPath, interaction.guildId);
      const ttsPath = path.join(serverPath, "tts_output.wav");

      // Create directories if needed
      if (!fs.existsSync(baseAudioPath)) {
        fs.mkdirSync(baseAudioPath, { recursive: true });
      }
      if (!fs.existsSync(serverPath)) {
        fs.mkdirSync(serverPath, { recursive: true });
      }

      // Connect to voice channel
      const connection = await connectToChannel(voiceChannel);
      const player = createAudioPlayer();
      connection.subscribe(player);

      // Generate and play TTS
      const ttsText = `${interaction.user.displayName} bilang: ${cleanText}`;
      await generateTTS(ttsText, ttsPath);
      const resource = createAudioResource(ttsPath);
      player.play(resource);

      await interaction.editReply(`Playing your message: ${cleanText}`);
    } catch (error) {
      console.error("TTS Error:", error);
      await interaction.editReply("Failed to play your message!");
    }
  },
};


export { joinVc, outVc, ttsCommand };
