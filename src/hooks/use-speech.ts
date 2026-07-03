import { useCallback, useEffect, useRef, useState } from "react";
import { isNative } from "@/lib/native";

// Minimal SpeechRecognition types — vendor APIs aren't in lib.dom yet.
interface SRResultItem { transcript: string }
interface SRResult { 0: SRResultItem; isFinal: boolean }
interface SREvent { results: ArrayLike<SRResult> }
interface SRInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SRCtor = new () => SRInstance;

function getRecognitionCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Translate spoken phrases like "five plus three times two" into a calculator expression.
const WORD_MAP: Record<string, string> = {
  plus: "+", add: "+", and: "+",
  minus: "-", subtract: "-",
  times: "*", multiplied: "*", multiply: "*", x: "*", into: "*",
  "divided by": "/", divide: "/", over: "/",
  percent: "%",
  point: ".", dot: ".",
  "open bracket": "(", "open parenthesis": "(",
  "close bracket": ")", "close parenthesis": ")",
  zero: "0", one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  ten: "10",
};

export function spokenToExpression(input: string): string {
  let s = ` ${input.toLowerCase().trim()} `;
  s = s.replace(/\bequals?\b/g, "");
  for (const phrase of Object.keys(WORD_MAP).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${phrase.replace(/ /g, "\\s+")}\\b`, "g");
    s = s.replace(re, ` ${WORD_MAP[phrase]} `);
  }
  return s.replace(/\s+/g, " ").trim();
}

export function useSpeech() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef = useRef<SRInstance | null>(null);
  const nativeActiveRef = useRef(false);

  useEffect(() => {
    if (isNative()) {
      setSupported(true);
      return;
    }
    setSupported(!!getRecognitionCtor());
  }, []);

  const start = useCallback((onResult: (text: string) => void) => {
    if (isNative()) {
      (async () => {
        try {
          const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
          const avail = await SpeechRecognition.available();
          if (!avail.available) {
            setSupported(false);
            return;
          }
          const perm = await SpeechRecognition.checkPermissions();
          if (perm.speechRecognition !== "granted") {
            const req = await SpeechRecognition.requestPermissions();
            if (req.speechRecognition !== "granted") return;
          }
          nativeActiveRef.current = true;
          setListening(true);
          const res = await SpeechRecognition.start({
            language: "en-US",
            maxResults: 1,
            prompt: "Speak your calculation",
            partialResults: false,
            popup: false,
          });
          const matches = (res as { matches?: string[] })?.matches;
          if (matches && matches[0]) onResult(spokenToExpression(matches[0]));
        } catch (err) {
          console.error("Native speech recognition failed", err);
        } finally {
          nativeActiveRef.current = false;
          setListening(false);
        }
      })();
      return;
    }

    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const begin = () => {
      const recog = new Ctor();
      recog.lang = "en-US";
      recog.continuous = false;
      recog.interimResults = false;
      recog.onresult = (e) => {
        const transcript = e.results[0]?.[0]?.transcript ?? "";
        onResult(spokenToExpression(transcript));
      };
      recog.onend = () => setListening(false);
      recog.onerror = () => setListening(false);
      recogRef.current = recog;
      setListening(true);
      try {
        recog.start();
      } catch {
        setListening(false);
      }
    };

    // Ensure mic permission first — required in Android WebView / secure contexts.
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach((t) => t.stop());
          begin();
        })
        .catch(() => {
          setListening(false);
        });
    } else {
      begin();
    }
  }, []);

  const stop = useCallback(() => {
    if (isNative() && nativeActiveRef.current) {
      import("@capacitor-community/speech-recognition").then(({ SpeechRecognition }) =>
        SpeechRecognition.stop().catch(() => {}),
      );
      nativeActiveRef.current = false;
      setListening(false);
      return;
    }
    recogRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (isNative()) {
      import("@capacitor-community/text-to-speech").then(({ TextToSpeech }) => {
        TextToSpeech.speak({
          text,
          lang: "en-US",
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: "ambient",
        }).catch((err) => console.error("Native TTS failed", err));
      });
      return;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, []);

  return { listening, supported, start, stop, speak };
}
