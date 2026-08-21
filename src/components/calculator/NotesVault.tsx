import { useMemo, useState } from "react";
import { Lock, LockOpen, Pin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToolCard } from "@/components/calculator/ToolCard";
import { useNotes } from "@/hooks/use-notes";
import { decryptText, encryptText, hasPasscode, setPasscode, verifyPasscode } from "@/lib/vault";
import { toast } from "sonner";

/**
 * Notes with an optional passcode-protected vault. Everything stays in
 * localStorage on the device — locked notes are obfuscated before saving.
 */
export function NotesVault() {
  const { notes, create, update, remove, togglePin } = useNotes();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [locked, setLocked] = useState(false);
  const [passcode, setPass] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(s) || (!n.locked && n.body.toLowerCase().includes(s)),
    );
  }, [notes, query]);

  const unlock = () => {
    if (!passcode) return toast.error("Enter your passcode");
    if (!hasPasscode()) {
      setPasscode(passcode);
      setUnlocked(true);
      return toast.success("Vault passcode set");
    }
    if (verifyPasscode(passcode)) {
      setUnlocked(true);
      toast.success("Vault unlocked");
    } else {
      toast.error("Wrong passcode");
    }
  };

  const add = () => {
    if (!title.trim() && !body.trim()) return toast.error("Write something first");
    if (locked && !unlocked) return toast.error("Unlock the vault to save a locked note");
    create({
      title,
      body: locked ? encryptText(body, passcode) : body,
      locked,
    });
    setTitle("");
    setBody("");
    toast.success(locked ? "Saved to vault" : "Note saved");
  };

  return (
    <ToolCard title="Notes & Secure Vault" description="Stored on this device only · lock private notes">
      <div className="space-y-1.5">
        <Label htmlFor="note-title">Title</Label>
        <Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Shopping list" />
      </div>
      <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Note text…" />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={locked ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => setLocked((l) => !l)}>
          {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
          {locked ? "Locked note" : "Normal note"}
        </Button>
        <Button size="sm" className="gap-1.5" onClick={add}>
          <Plus className="size-4" /> Save note
        </Button>
      </div>

      <div className="space-y-2 rounded-2xl bg-muted/25 p-3">
        <Label htmlFor="vault-pass">Vault passcode</Label>
        <div className="flex gap-2">
          <Input
            id="vault-pass"
            type="password"
            value={passcode}
            onChange={(e) => setPass(e.target.value)}
            placeholder={hasPasscode() ? "Enter passcode" : "Create a passcode"}
          />
          <Button variant="outline" onClick={unlock}>
            {unlocked ? "Unlocked" : hasPasscode() ? "Unlock" : "Set"}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Local protection against casual snooping — not full encryption.
        </p>
      </div>

      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" />

      <ul className="max-h-80 space-y-2 overflow-auto">
        {filtered.map((n) => (
          <li key={n.id} className="rounded-2xl bg-muted/25 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {n.locked ? <Lock className="size-3.5 shrink-0" /> : null}
                  <span className="truncate">{n.title}</span>
                </div>
                <div className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                  {n.locked
                    ? unlocked
                      ? decryptText(n.body, passcode)
                      : "•••••• locked"
                    : n.body}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" aria-label="Pin note" onClick={() => togglePin(n.id)}>
                  <Pin className={`size-4 ${n.pinned ? "text-primary" : ""}`} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Unlock note"
                  onClick={() => {
                    if (!n.locked) return;
                    if (!unlocked) return toast.error("Unlock the vault first");
                    update(n.id, { locked: false, body: decryptText(n.body, passcode) });
                  }}
                  disabled={!n.locked}
                >
                  <LockOpen className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Delete note" onClick={() => remove(n.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
        {!filtered.length ? (
          <li className="py-6 text-center text-xs text-muted-foreground">No notes yet</li>
        ) : null}
      </ul>
    </ToolCard>
  );
}
