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

export function SpeakButton({ text, label = "播放" }: { text: string; label?: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = () => {
    if (!text.trim() || !("speechSynthesis" in window)) return;
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
  };

  return (
    <button className="speech-action" type="button" disabled={!supported || !text.trim()} onClick={speak} title={label}>
      <Volume2 size={16} />
      <span>{isSpeaking ? "播放中" : label}</span>
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
