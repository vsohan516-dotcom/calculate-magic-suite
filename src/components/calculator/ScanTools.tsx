import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, QrCode, ScanLine, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ToolCard } from "@/components/calculator/ToolCard";
import { toast } from "sonner";

/* ───────────── QR Code generator ───────────── */
export function QrGenerator() {
  const [text, setText] = useState("https://lovable.dev");
  const [dataUrl, setDataUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    const value = text.trim();
    if (!value) return toast.error("Enter text or a link");
    setBusy(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(value, { width: 512, margin: 2 });
      setDataUrl(url);
    } catch {
      toast.error("Could not generate the QR code");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!dataUrl) return;
    const { saveOrShareFile } = await import("@/lib/native");
    const base64 = dataUrl.split(",")[1] ?? "";
    await saveOrShareFile({
      fileName: "qr-code.png",
      mimeType: "image/png",
      base64,
    });
  };

  return (
    <ToolCard title="QR Code Generator" description="Turn any text or link into a QR image">
      <div className="space-y-1.5">
        <Label htmlFor="qr-text">Text or URL</Label>
        <Input id="qr-text" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={generate} disabled={busy} className="gap-1.5">
          <QrCode className="size-4" /> {busy ? "Generating…" : "Generate"}
        </Button>
        {dataUrl ? (
          <Button variant="outline" onClick={download}>Save image</Button>
        ) : null}
      </div>
      {dataUrl ? (
        <div className="grid place-items-center rounded-2xl bg-muted/30 p-4">
          <img src={dataUrl} alt="Generated QR code" className="size-48 rounded-xl bg-white p-2" />
        </div>
      ) : null}
    </ToolCard>
  );
}

/* ───────────── QR scanner (camera + image file) ───────────── */
export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [result, setResult] = useState("");
  const [scanning, setScanning] = useState(false);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const decodeFrame = async () => {
    const jsQR = (await import("jsqr")).default;
    const tick = () => {
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height);
      if (code?.data) {
        setResult(code.data);
        toast.success("Code detected");
        stop();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      void decodeFrame();
    } catch {
      toast.error("Camera permission denied");
      setScanning(false);
    }
  };

  const fromFile = async (file: File) => {
    const jsQR = (await import("jsqr")).default;
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(bitmap, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height);
    if (code?.data) {
      setResult(code.data);
      toast.success("Code detected");
    } else {
      toast.error("No code found in that image");
    }
  };

  return (
    <ToolCard title="QR / Barcode Scanner" description="Scan with the camera or from a saved image">
      <div className="flex flex-wrap gap-2">
        {scanning ? (
          <Button variant="outline" onClick={stop} className="gap-1.5">
            <StopCircle className="size-4" /> Stop
          </Button>
        ) : (
          <Button onClick={start} className="gap-1.5">
            <Camera className="size-4" /> Start camera
          </Button>
        )}
        <Button asChild variant="outline" className="gap-1.5">
          <label>
            <ImageIcon className="size-4" /> From image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void fromFile(f);
              }}
            />
          </label>
        </Button>
      </div>
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full rounded-2xl bg-muted/30 ${scanning ? "" : "hidden"}`}
      />
      {result ? (
        <div className="space-y-2 rounded-2xl bg-muted/30 p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Result</div>
          <div className="break-all text-sm">{result}</div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              void navigator.clipboard?.writeText(result);
              toast.success("Copied");
            }}
          >
            Copy
          </Button>
        </div>
      ) : null}
    </ToolCard>
  );
}

/* ───────────── OCR (image → text), Hindi + English ───────────── */
export function OcrTool() {
  const [lang, setLang] = useState("eng");
  const [text, setText] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const run = async (file: File) => {
    setBusy(true);
    setProgress(0);
    setText("");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(lang, undefined, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(file);
      setText(data.text.trim());
      await worker.terminate();
      if (!data.text.trim()) toast.error("No readable text found");
    } catch {
      toast.error("Could not read that image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolCard title="Image to Text (OCR)" description="Extract text from photos · English & हिंदी">
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Language</span>
        <Select value={lang} onValueChange={setLang}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="eng">English</SelectItem>
            <SelectItem value="hin">हिंदी</SelectItem>
            <SelectItem value="eng+hin">English + हिंदी</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button asChild disabled={busy} className="gap-1.5">
        <label>
          <ScanLine className="size-4" /> {busy ? `Reading… ${progress}%` : "Pick an image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void run(f);
            }}
          />
        </label>
      </Button>
      {text ? (
        <div className="space-y-2 rounded-2xl bg-muted/30 p-4">
          <div className="max-h-56 overflow-auto whitespace-pre-wrap text-sm">{text}</div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              void navigator.clipboard?.writeText(text);
              toast.success("Copied");
            }}
          >
            Copy text
          </Button>
        </div>
      ) : null}
    </ToolCard>
  );
}
