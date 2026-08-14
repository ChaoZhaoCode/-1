"use client";

import { Mic, MicOff, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

const getRecognitionConstructor = () => {
  if (typeof window === "undefined") return null;
  return (
    (window as typeof window & { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
    (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition ??
    null
  );
};

const getJapaneseVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang === "ja-JP") ?? voices.find((voice) => voice.lang.startsWith("ja")) ?? null;
};

const audioCache = new Map<string, string>();

export function SpeakButton({ text, label = "播放" }: { text: string; label?: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const speakWithBrowserVoice = () => {
    if (!text.trim() || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = "ja-JP";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    const voice = getJapaneseVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    return true;
  };

  const playAudioUrl = async (url: string) => {
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => {
      setIsSpeaking(false);
      speakWithBrowserVoice();
    };
    setIsSpeaking(true);
    await audio.play();
  };

  const speak = async () => {
    const value = text.trim();
    if (!value || isLoading) return;

    if (audioCache.has(value)) {
      await playAudioUrl(audioCache.get(value) as string);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value })
      });

      if (!response.ok) {
        speakWithBrowserVoice();
        return;
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      audioCache.set(value, audioUrl);
      await playAudioUrl(audioUrl);
    } catch {
      speakWithBrowserVoice();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button className="speech-action" type="button" disabled={!text.trim() || isLoading} onClick={speak} title={label}>
      <Volume2 size={16} />
      <span>{isLoading ? "生成中" : isSpeaking ? "播放中" : label}</span>
    </button>
  );
}

export function VoiceInputButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(Boolean(getRecognitionConstructor()));
    return () => recognitionRef.current?.stop();
  }, []);

  const toggleListening = () => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setSupported(false);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join("")
        .trim();
      if (transcript) onTranscript(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  return (
    <button
      className={isListening ? "secondary-action listening" : "secondary-action"}
      type="button"
      disabled={!supported}
      onClick={toggleListening}
      title={supported ? "语音输入日语" : "当前浏览器不支持语音输入"}
    >
      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
      {isListening ? "停止识别" : "语音输入"}
    </button>
  );
}
