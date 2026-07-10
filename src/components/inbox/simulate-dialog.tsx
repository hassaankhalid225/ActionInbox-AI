"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

const SAMPLES = [
  { label: "Quote request (Roman Urdu)", kind: "text", body: "Assalam o alaikum, mujhe 20 bundle saria 8 aur 50 bag cement chahiye. Rate bata dein aur kal tak deliver ho sakta hai?" },
  { label: "Payment proof", kind: "text", body: "Payment done, Rs 45,000 transferred. Ref TX-90211" },
  { label: "Complaint", kind: "text", body: "The last delivery was damaged and 5 bags broke. Please resolve urgently or refund." },
  { label: "Appointment", kind: "text", body: "Can we meet this Friday at 3pm to discuss the bricks order?" },
];

export function SimulateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(SAMPLES[0]!.body);
  const [from, setFrom] = useState("+92 300 1112223");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setLoading(true);
    try {
      const res = await api.post<{ id: string }>("/api/inbox/ingest", {
        channelType: "whatsapp",
        kind: "text",
        bodyText: body,
        fromIdentifier: from,
      });
      toast.success("Message received — AI is processing it now.", { description: "Refreshing your inbox…" });
      setOpen(false);
      // Give the async pipeline a moment, then refresh.
      setTimeout(() => {
        router.push(`/inbox/${res.id}`);
        router.refresh();
      }, 1400);
    } catch {
      toast.error("Could not simulate the message.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Sparkles className="size-4" /> Simulate inbound</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simulate an inbound message</DialogTitle>
          <DialogDescription>
            Drop a message to watch the full AI pipeline run — classification, extraction, and action suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Example">
            <Select onValueChange={(v) => setBody(SAMPLES[Number(v)]!.body)} defaultValue="0">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SAMPLES.map((s, i) => <SelectItem key={i} value={String(i)}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="From (phone / email)">
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <Field label="Message">
            <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} loading={loading}><Send className="size-4" /> Send to inbox</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
