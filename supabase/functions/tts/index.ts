// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ElevenLabsClient } from "npm:elevenlabs";
import { Buffer } from "node:buffer";
import * as hash from "npm:object-hash";
import * as googleTTS from "npm:google-tts-api";

interface RequestBody {
  text: string;
  service_type?: string;
  voiceId?: string;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
);

async function uploadAudioToStorage(
  stream: ReadableStream,
  requestHash: string
) {
  const { data, error } = await supabase.storage
    .from("audio")
    .upload(`${requestHash}.mp3`, stream, {
      contentType: "audio/mp3",
    });
  console.log("Storage upload result", { data, error });
}

async function generateFromGoogleTTS(requestHash, text: string, lang = "id") {
  console.log("Google TTS API call");
  const results = googleTTS.getAllAudioUrls(`${text}`, {
    lang: lang,
    slow: false,
    host: "https://translate.google.com",
    splitPunct: ",.?! ",
  });
  // Get all audio URLs from Google TTS
  const combinedBuffers: Buffer[] = [];
  for (const item of results) {
    const response = await fetch(item.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch TTS audio: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    combinedBuffers.push(Buffer.from(buffer));
  }
  // Create a ReadableStream from the combined audio buffers
  const stream = new ReadableStream({
    async start(controller) {
      for (const buffer of combinedBuffers) {
        controller.enqueue(buffer);
      }
      controller.close();
    }
  });
  // Branch stream to Supabase Storage
  const [browserStream, storageStream] = stream.tee();
  // Upload to Supabase Storage in the background
  EdgeRuntime.waitUntil(uploadAudioToStorage(storageStream, requestHash));
  // Return the streaming response immediately
  return new Response(browserStream, {
    headers: {
      "Content-Type": "audio/mpeg",
    },
  });
}

async function generateFromElevenlabs(requestHash, text: string, voiceId: string) {
  try {
    console.log("ElevenLabs API call");

    const client = new ElevenLabsClient({
      apiKey: Deno.env.get("ELEVENLABS_API_KEY"),
    });
    console.log("Eleven labs api: %s", Deno.env.get("ELEVENLABS_API_KEY"));
    const response = await client.textToSpeech.stream(voiceId, {
      output_format: "mp3_44100_128",
      model_id: "eleven_flash_v2_5",
      text,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    // Branch stream to Supabase Storage
    const [browserStream, storageStream] = stream.tee();
    // Upload to Supabase Storage in the background
    EdgeRuntime.waitUntil(uploadAudioToStorage(storageStream, requestHash));
    // Return the streaming response immediately
    return new Response(browserStream, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.log("error", { error });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

Deno.serve(async (req) => {
  console.log("Request origin", req.headers.get("host"));

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Only POST method is allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body: RequestBody = await req.json();
  const { text, service_type = "gtts" } = body;

  let voiceId: string;

  if (!text) {
    return new Response(
      JSON.stringify({ error: "Text parameter is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (service_type === "elevenlabs") {
    voiceId = body.voiceId ?? "JBFqnCBsd6RMkjVDRZzb"; // Default voice ID for ElevenLabs
  } else {
    voiceId = "google"; // No voice ID needed for Google TTS
  }

  const requestHash = hash.MD5({ text, service_type });
  console.log("Request hash", requestHash);

  const { data: existingFile } = await supabase.storage
    .from('audio')
    .createSignedUrl(`${requestHash}.mp3`, 60);

  console.log('Cache hit? - getting existing audio file: ', existingFile);
  if (existingFile?.signedUrl) {
    console.log('Cache hit - returning existing audio');
    const cachedResponse = await fetch(existingFile.signedUrl);
    return cachedResponse;
  }

  console.log('Cache miss - generating new audio');
  if (service_type === "gtts") {
    return await generateFromGoogleTTS(requestHash, text);
  } else if (service_type === "elevenlabs") {
    return await generateFromElevenlabs(requestHash, text, voiceId);
  } else {
    return new Response(
      JSON.stringify({ error: "Unsupported service type" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

});