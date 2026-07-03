import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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

type NativeSpeechModule = typeof import("@capacitor-community/speech-recognition");

function getPreferredSpeechLanguage(): string {
  if (typeof navigator === "undefined") return "en-IN";
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const normalized = languages.filter(Boolean).map((lang) => lang.toLowerCase());
  if (normalized.some((lang) => lang.startsWith("hi"))) return "hi-IN";
  const english = languages.find((lang) => lang?.toLowerCase().startsWith("en"));
  return english || "en-IN";
}

function normalizeDigits(input: string): string {
  const devanagari = "०१२३४५६७८९";
  return input.replace(/[०-९]/g, (digit) => String(devanagari.indexOf(digit)));
}

function cleanSpeechText(input: string): string {
  return normalizeDigits(input)
    .replace(/[×✕✖]/g, " * ")
    .replace(/[÷]/g, " / ")
    .replace(/[−–—]/g, " - ")
    .replace(/[=]/g, " ");
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseRegExp(phrase: string): RegExp {
  const escaped = escapeRegExp(phrase).replace(/\s+/g, "\\s+");
  const asciiWord = /^[a-z0-9 ]+$/i.test(phrase);
  return new RegExp(asciiWord ? `\\b${escaped}\\b` : escaped, "g");
}

// Translate spoken phrases like "five plus three" / "पांच प्लस तीन" into a calculator expression.
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
  ten: "10", eleven: "11", twelve: "12", thirteen: "13", fourteen: "14",
  fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19",
  twenty: "20", thirty: "30", forty: "40", fifty: "50", sixty: "60",
  seventy: "70", eighty: "80", ninety: "90",
  बराबर: "", इक्वल: "", equals: "",
  प्लस: "+", जोड़: "+", जोड़ो: "+", जमा: "+",
  माइनस: "-", घटा: "-", घटाओ: "-",
  गुणा: "*", गुना: "*", इनटू: "*", मल्टीप्लाई: "*",
  भाग: "/", डिवाइड: "/", बटा: "/",
  प्रतिशत: "%", परसेंट: "%",
  पॉइंट: ".", दशमलव: ".",
  ब्रैकेट: "(", कोष्ठक: "(",
  शून्य: "0", जीरो: "0", एक: "1", दो: "2", तीन: "3", चार: "4",
  पांच: "5", पाँच: "5", छः: "6", छह: "6", सात: "7", आठ: "8", नौ: "9",
  दस: "10", ग्यारह: "11", बारह: "12", तेरह: "13", चौदह: "14",
  पंद्रह: "15", सोलह: "16", सत्रह: "17", अठारह: "18", उन्नीस: "19",
  बीस: "20", तीस: "30", चालीस: "40", पचास: "50", साठ: "60",
  सत्तर: "70", अस्सी: "80", नब्बे: "90",
};

export function spokenToExpression(input: string): string {
  let s = ` ${cleanSpeechText(input).toLowerCase().trim()} `;
  s = s.replace(/\b(equals?|equal to|is)\b/g, "");
  for (const phrase of Object.keys(WORD_MAP).sort((a, b) => b.length - a.length)) {
    const re = phraseRegExp(phrase);
    s = s.replace(re, ` ${WORD_MAP[phrase]} `);
  }
  // Fix common spoken number compounds: "twenty five" / "बीस पांच" -> 25.
  s = s.replace(/\b([2-9]0)\s+([1-9])\b/g, (_, ten: string, one: string) => String(Number(ten) + Number(one)));
  return s
    .replace(/\s*([+\-*/%^().])\s*/g, "$1")
    .replace(/[^0-9+\-*/%^().πe]/g, "")
    .trim();
}

export function useSpeech() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef = useRef<SRInstance | null>(null);
  const nativeActiveRef = useRef(false);

  useEffect(() => {
    if (isNative()) {
      import("@capacitor-community/speech-recognition")
        .then(({ SpeechRecognition }) => SpeechRecognition.available())
        .then(({ available }) => setSupported(available))
        .catch(() => setSupported(false));
      return;
    }
    setSupported(!!getRecognitionCtor());
  }, []);

  const ensureNativeSpeechReady = useCallback(async (nativeSpeech: NativeSpeechModule) => {
    const { SpeechRecognition } = nativeSpeech;
    const avail = await SpeechRecognition.available();
    if (!avail.available) {
      setSupported(false);
      toast.error("Voice input is not available on this Android device");
      return false;
    }

    const perm = await SpeechRecognition.checkPermissions();
    if (perm.speechRecognition === "granted") return true;

    const req = await SpeechRecognition.requestPermissions();
    if (req.speechRecognition !== "granted") {
      toast.error("Microphone permission is required for voice input");
      return false;
    }
    return true;
  }, []);

  const start = useCallback((onResult: (text: string) => void) => {
    if (isNative()) {
      (async () => {
        try {
          const nativeSpeech = await import("@capacitor-community/speech-recognition");
          const { SpeechRecognition } = nativeSpeech;
          const ready = await ensureNativeSpeechReady(nativeSpeech);
          if (!ready) return;

          await SpeechRecognition.removeAllListeners().catch(() => undefined);
          nativeActiveRef.current = true;
          setListening(true);
          const res = await SpeechRecognition.start({
            language: getPreferredSpeechLanguage(),
            maxResults: 3,
            prompt: "Speak calculation / हिसाब बोलें",
            partialResults: false,
            // Android result delivery is reliable with the native system dialog.
            // The hidden popup mode can silently return no matches on many devices.
            popup: true,
          });
          const matches = (res as { matches?: string[] })?.matches;
          const expression = matches?.map(spokenToExpression).find(Boolean);
          if (expression) {
            onResult(expression);
          } else {
            toast.error("Could not understand the calculation");
          }
        } catch (err) {
          console.error("Native speech recognition failed", err);
          toast.error("Voice input failed. Please try again.");
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
          toast.error("Microphone permission is required for voice input");
        });
    } else {
      begin();
    }
  }, [ensureNativeSpeechReady]);

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
