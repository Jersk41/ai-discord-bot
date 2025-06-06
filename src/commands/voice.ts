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
import { cleanText, filterWordResult, filterWords } from "../utils/filter";
import { logger } from "../utils/logger";
import type { ChatInputCommandInteraction } from "discord.js";

let connection: VoiceConnection | undefined;

const ttsQueueMap: Map<string, TTSQueueItem[]> = new Map();

interface TTSQueueItem {
  path: string;
  connection: VoiceConnection;
  interaction: ChatInputCommandInteraction | any;
  text: string;
}

const playNextInQueue = (guildId: string) => {
  const queue = ttsQueueMap.get(guildId);
  if (!queue || queue.length === 0) return;
  const { path, connection, interaction, text } = queue[0];
  const player = createAudioPlayer();

  const resource = createAudioResource(path);
  connection.subscribe(player);
  player.play(resource);
  player.once("error", (error) => {
    logger.error("Audio player error: ", { error });
    queue.shift();
    fs.unlink(path, () => {});
    playNextInQueue(guildId);
  });
  player.once("idle", () => {
    queue.shift();
    fs.unlink(path, (err) => {
      if (err) logger.warn(`Failed to delete file: ${path}`, { err });
    });
    playNextInQueue(guildId);
  });
  logger.info(`Playing TTSs in guild ${guildId}: "${text.slice(0, 40)}..."`);
}

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

    logger.debug(
      `Joinvc command: ${interaction.user.tag} in ${interaction.guild.name} (${interaction.guild.id})`
    );

    connection = await connectToChannel(voiceChannel);
    if (!connection) {
      logger.warn("Joinvc command failed: connection is undefined");
      await interaction.reply("Connection undefined!");
    }
    connection.on(VoiceConnectionStatus.Ready, () => {
      logger.info(`Joinvc command: Bot connection is ready on ${interaction.guild?.name}`);
    });
    const replyOptions: InteractionEditReplyOptions = {
      content: "I have joined and connected to your voice channel!",
    };
    logger.info(`Connected to VC in guild: ${voiceChannel.guild.name}`);
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
        throw Error("No member found in interaction")
      }
      const member = interaction.member as GuildMember;
      if(!member.voice || member.voice == undefined){
        throw Error("No voice channel found in member")
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
      logger.info(`Disconnected from VC in guild: ${voiceChannel.guild.name}`);
      await interaction.editReply(replyOptions);
    } catch (error) {
      logger.error("Error occured: ", { error });
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
    logger.info(`TTS generation successful for: "${text.slice(0, 20)}..."`);
  } catch (error) {
    logger.error("Error generating TTS:", { error });
    throw error;
  }
}


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
    let cleanedText = cleanText(`${message}`);

    // Filter bad words
    const profanityCheck: filterWordResult = filterWords(cleanedText);
    if(profanityCheck.profanity){
      logger.info(`Profanity detected: ${profanityCheck.message}`);
      await interaction.editReply("Admiiin!, ada yang ngomong kasar min!");
      return;
    }
    cleanedText = profanityCheck.message;

    if (!cleanedText) return;

    try {
      // Setup paths for audio file
      const baseAudioPath = path.join("/tmp/dcbot", "tts");
      /*
      if (!interaction.guildId || interaction.guildId == null) {
        logger.error("No guild id found");
        return;
      }
      if (!interaction.user || interaction.user == null) {
        logger.error("No user found");
        return;
      }*/
      const guildId = interaction.guildId!;
      const userId = interaction.user.id;
      
      const serverPath = path.join(baseAudioPath, guildId);
      const userPath = path.join(serverPath, userId);
      const fileName = `tts-${Date.now().toString()}.wav`;
      logger.debug(`TTS file name: ${fileName}, filepath: ${userPath}`);
      const ttsPath = path.join(userPath, fileName);
      logger.debug(`TTS full filepath: ${ttsPath}`);

      // Create directories if needed
      /*
      if (!fs.existsSync(baseAudioPath)) {
        fs.mkdirSync(baseAudioPath, { recursive: true });
      }
      if (!fs.existsSync(serverPath)) {
        fs.mkdirSync(serverPath, { recursive: true });
      } */
      if (!fs.existsSync(userPath)) fs.mkdirSync(userPath, { recursive: true });

      // Connect to voice channel
      const connection = await connectToChannel(voiceChannel);
      const ttsText = `${interaction.user.displayName} bilang: ${cleanedText}`;
      await generateTTS(ttsText, ttsPath, options.language as string);
      const queueItem: TTSQueueItem = {
        path: ttsPath,
        connection,
        interaction,
        text: cleanedText,
      };
      if (!ttsQueueMap.has(guildId)) ttsQueueMap.set(guildId, []);
      const queue = ttsQueueMap.get(guildId)!;
      queue.push(queueItem);
      if (queue.length === 1) playNextInQueue(guildId);

      /*
      const connection = await connectToChannel(voiceChannel);
      const player = createAudioPlayer();
      connection.subscribe(player);

      // Generate and play TTS
      const ttsText = `${interaction.user.displayName} bilang: ${cleanedText}`;
      await generateTTS(ttsText, ttsPath);
      const resource = createAudioResource(ttsPath);
      player.play(resource);
      player.on("error", (error) => {
        logger.error("Error playing audio: ", { error });
      });
      logger.info(`Playing TTS for message: "${cleanedText.slice(0, 40)}..."`);
      */
      await interaction.editReply(`Playing your message: ${cleanedText}`);
    } catch (error) {
      logger.error("TTS Error:", { error });
      await interaction.editReply("Failed to play your message!");
    }
  },
};


export { joinVc, outVc, ttsCommand };
