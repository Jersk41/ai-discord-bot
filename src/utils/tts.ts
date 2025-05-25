import { ElevenLabsClient, play, stream } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";
import { logger } from "./logger";
import { Readable } from "stream";
import * as googleTTS from "google-tts-api";
import { createAudioResource, StreamType } from "@discordjs/voice";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

const ttsModelList = [
  {voiceId: "gmnazjXOFoOcWA59sd5m", name: "Kira (Female)"},
  {voiceId: "zd0hd2egR1Q6EzSLTzCp", name: "Naya (Female)"},
  {voiceId: "4RK3Moe6TpBQ4otXBFtc", name: "Putra (Male)"},
];

export async function generateFromGoogleTTS(
  text: string,
  lang = "id"
): Promise<ReturnType<typeof createAudioResource>> {
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
  const content = Buffer.concat(combinedBuffers);
  return new Promise((resolve, reject) => {
    const resource = createAudioResource(Readable.from(content), {
      inputType: StreamType.Arbitrary,
    });
    if (resource) resolve(resource);
    else reject(new Error("Failed to create audio resource"));
  });
}

const generateVoice = async (text: string) => {
  try {
    const elevenlabs = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    });
    const audioStream = await elevenlabs.textToSpeech.stream(
      "4RK3Moe6TpBQ4otXBFtc",
      {
        text,
        modelId: "eleven_flash_v2_5",
        // outputFormat: 'opus_48000_64',
        // optimizeStreamingLatency: 3,
        // Optional voice settings that allow you to customize the output
        // voiceSettings: {
        //   stability: 0.5,
        //   speed: 0.8,
        //   similarityBoost: 0.5,
        // },
      }
    );
    return await stream(audioStream);
  } catch (error) {
    logger.error("Failed to fetch voice: ", {error});
    throw new Error("Failed to fetch voice");
  }
}

export const generateFromElevenLabs = async (
  text: string
): Promise<ReturnType<typeof createAudioResource>> => {
  try {
    const elevenlabs = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    });
    if (!elevenlabs) {
      throw new Error("Failed to create Eleven Labs client");
    }
    // const stream = await generateVoice(text);
    // console.debug(stream);
    logger.debug("1. Generating Eleven Labs TTS resource ");
    const audioStream = await elevenlabs.textToSpeech.stream(
      ttsModelList[0].voiceId,
      {
        text,
        modelId: "eleven_flash_v2_5",
        // outputFormat: 'opus_48000_64',
        optimizeStreamingLatency: 3,
        // Optional voice settings that allow you to customize the output
        // voiceSettings: {
        //   stability: 0.5,
        //   speed: 0.8,
        //   similarityBoost: 0.5,
        // },
      }
    );
    logger.debug("Audio stream created successfully: ", { stream: audioStream as Readable });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks);
    return new Promise((resolve, reject) => {
      const resource = createAudioResource(Readable.from(content), {
        inputType: StreamType.Arbitrary,
      });
      if (resource) resolve(resource);
      else reject(new Error("Failed to create audio resource"));
    });
  } catch (error) {
    logger.error(
      `Error creating Eleven Labs TTS resource: ${
        error instanceof Error ? error.message : error
      }`,
      { error }
    );
    throw new Error("Failed to create Eleven Labs TTS resource");
  }
};

export const generateTTSStream = async (
  text: string,
  model: "google" | "elevenlabs" = "google"
): Promise<ReturnType<typeof createAudioResource>> => {
  if (model === "elevenlabs") {
    return await generateFromElevenLabs(text);
  }
  return await generateFromGoogleTTS(text);
};
