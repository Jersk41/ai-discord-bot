import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";
import { logger } from "./logger";
import { Readable } from "stream";
import * as googleTTS from "google-tts-api";
import { createAudioResource, StreamType } from "@discordjs/voice";
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
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
    logger.debug("1. Generating Eleven Labs TTS resource ");
    const audioStream = await elevenlabs.textToSpeech.stream(
      ttsModelList[0].voiceId,
      {
        text,
        modelId: "eleven_flash_v2_5",
        optimizeStreamingLatency: 3,
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

export const getOrCreateTTS = async (
  text: string,
  model: "gtts" | "elevenlabs" = "gtts"
): Promise<ReturnType<typeof createAudioResource>> => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );
  try {
    // Add timeout and retry logic
    const { data, error } = await supabase.functions.invoke('tts', {
      body: { text, service_type: model },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (error) {
      logger.error('Edge function error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data received from edge function');
    }

    const buffer = Buffer.from(data);
    return createAudioResource(Readable.from(buffer), {
      inputType: StreamType.Arbitrary,
    });
  } catch (error) {
    logger.error('TTS Generation Error:', {
      error,
      text,
      model
    });
    // Fallback to direct API calls if edge function fails
    return model === "elevenlabs" ?
      await generateFromElevenLabs(text) :
      await generateFromGoogleTTS(text);
  }
}