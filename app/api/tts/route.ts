import { NextResponse } from "next/server";

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const ELEVENLABS_VOICES_URL = "https://api.elevenlabs.io/v2/voices";
const ELEVENLABS_SHARED_VOICES_URL = "https://api.elevenlabs.io/v1/shared-voices";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const DEFAULT_OUTPUT_FORMAT = "mp3_44100_128";
const DEFAULT_VOICE_NAME = "Bella";
const DEFAULT_AZURE_VOICE = "ja-JP-NanamiNeural";
const AZURE_OUTPUT_FORMAT = "audio-24khz-96kbitrate-mono-mp3";

type TtsRequest = {
  text?: string;
};

type ElevenLabsVoiceSearchResponse = {
  voices?: Array<{
    voice_id?: string;
    name?: string;
  }>;
};

type ElevenLabsSharedVoicesResponse = {
  voices?: Array<{
    voice_id?: string;
    name?: string;
    public_owner_id?: string;
  }>;
};

let cachedVoiceId: string | null = null;

const cleanText = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 500);
};

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const makeAudioResponse = (audio: ArrayBuffer, contentType: string) =>
  new Response(audio, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=86400"
    }
  });

const makeFallbackError = (status: number, error: string, detail = "") =>
  NextResponse.json({ error, detail: detail.slice(0, 240), fallback: "browser" }, { status });

const synthesizeWithAzure = async (text: string) => {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  const voice = process.env.AZURE_SPEECH_VOICE ?? DEFAULT_AZURE_VOICE;

  if (!key || !region) return null;

  const ssml = [
    '<speak version="1.0" xml:lang="ja-JP">',
    `<voice xml:lang="ja-JP" xml:gender="${voice.includes("Keita") || voice.includes("Daichi") || voice.includes("Naoki") ? "Male" : "Female"}" name="${escapeXml(voice)}">`,
    escapeXml(text),
    "</voice>",
    "</speak>"
  ].join("");

  const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/ssml+xml",
      "Ocp-Apim-Subscription-Key": key,
      "X-Microsoft-OutputFormat": process.env.AZURE_SPEECH_OUTPUT_FORMAT ?? AZURE_OUTPUT_FORMAT,
      "User-Agent": "japanese-speaking-mvp"
    },
    body: ssml
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return makeFallbackError(response.status, "Azure Speech request failed", detail);
  }

  return makeAudioResponse(await response.arrayBuffer(), response.headers.get("content-type") ?? "audio/mpeg");
};

const resolveVoiceId = async (apiKey: string) => {
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  if (cachedVoiceId) return cachedVoiceId;

  const voiceName = process.env.ELEVENLABS_VOICE_NAME ?? DEFAULT_VOICE_NAME;
  const response = await fetch(
    `${ELEVENLABS_VOICES_URL}?search=${encodeURIComponent(voiceName)}&page_size=20`,
    { headers: { "xi-api-key": apiKey } }
  );

  if (!response.ok) return null;

  const data = (await response.json().catch(() => ({}))) as ElevenLabsVoiceSearchResponse;
  const voices = data.voices ?? [];
  const exact = voices.find((voice) => voice.name?.toLowerCase() === voiceName.toLowerCase());
  const partial = voices.find((voice) => voice.name?.toLowerCase().includes(voiceName.toLowerCase()));
  let voiceId = exact?.voice_id ?? partial?.voice_id ?? voices[0]?.voice_id ?? null;

  if (!voiceId) {
    const sharedResponse = await fetch(
      `${ELEVENLABS_SHARED_VOICES_URL}?search=${encodeURIComponent(voiceName)}&language=ja&page_size=20`,
      { headers: { "xi-api-key": apiKey } }
    );
    if (sharedResponse.ok) {
      const sharedData = (await sharedResponse.json().catch(() => ({}))) as ElevenLabsSharedVoicesResponse;
      const sharedVoices = sharedData.voices ?? [];
      const sharedExact = sharedVoices.find((voice) => voice.name?.toLowerCase() === voiceName.toLowerCase());
      const sharedPartial = sharedVoices.find((voice) => voice.name?.toLowerCase().includes(voiceName.toLowerCase()));
      voiceId = sharedExact?.voice_id ?? sharedPartial?.voice_id ?? sharedVoices[0]?.voice_id ?? null;
    }
  }

  cachedVoiceId = voiceId;
  return voiceId;
};

const synthesizeWithElevenLabs = async (text: string) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;
  const voiceId = await resolveVoiceId(apiKey);

  if (!voiceId) {
    return makeFallbackError(503, "ElevenLabs voice was not found");
  }

  const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT ?? DEFAULT_OUTPUT_FORMAT;
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_MODEL_ID;

  const response = await fetch(`${ELEVENLABS_TTS_URL}/${voiceId}?output_format=${outputFormat}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.48,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        speed: 0.92
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return makeFallbackError(response.status, "ElevenLabs request failed", errorText);
  }

  return makeAudioResponse(await response.arrayBuffer(), response.headers.get("content-type") ?? "audio/mpeg");
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as TtsRequest;
  const text = cleanText(body.text);

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const azureResponse = await synthesizeWithAzure(text);
  if (azureResponse) return azureResponse;

  const elevenLabsResponse = await synthesizeWithElevenLabs(text);
  if (elevenLabsResponse) return elevenLabsResponse;

  return makeFallbackError(503, "Text to speech is not configured");
}
