import { NextResponse } from "next/server";

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const ELEVENLABS_VOICES_URL = "https://api.elevenlabs.io/v2/voices";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const DEFAULT_OUTPUT_FORMAT = "mp3_44100_128";
const DEFAULT_VOICE_NAME = "Shizuka";

type TtsRequest = {
  text?: string;
};

type ElevenLabsVoiceSearchResponse = {
  voices?: Array<{
    voice_id?: string;
    name?: string;
  }>;
};

let cachedVoiceId: string | null = null;

const cleanText = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 500);
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
  const voiceId = exact?.voice_id ?? partial?.voice_id ?? voices[0]?.voice_id ?? null;
  cachedVoiceId = voiceId;
  return voiceId;
};

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs is not configured", fallback: "browser" },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as TtsRequest;
  const text = cleanText(body.text);

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const voiceId = await resolveVoiceId(apiKey);

  if (!voiceId) {
    return NextResponse.json(
      { error: "ElevenLabs voice was not found", fallback: "browser" },
      { status: 503 }
    );
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
    return NextResponse.json(
      { error: "ElevenLabs request failed", detail: errorText.slice(0, 240), fallback: "browser" },
      { status: response.status }
    );
  }

  const audio = await response.arrayBuffer();
  return new Response(audio, {
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "private, max-age=86400"
    }
  });
}
