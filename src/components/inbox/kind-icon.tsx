import { Mic, FileText, Image as ImageIcon, Mail, MessageSquare, Paperclip, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const KIND: Record<string, LucideIcon> = {
  audio: Mic,
  document: FileText,
  image: ImageIcon,
  email: Mail,
  text: MessageSquare,
  csv: Paperclip,
};

const CHANNEL: Record<string, LucideIcon> = {
  whatsapp: MessageSquare,
  email: Mail,
  upload: Paperclip,
};

export function KindIcon({ kind, className }: { kind: string; className?: string }) {
  const Icon = KIND[kind] ?? MessageSquare;
  return <Icon className={cn("size-4", className)} />;
}

export function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  const Icon = CHANNEL[channel] ?? MessageSquare;
  return <Icon className={cn("size-4", className)} />;
}

const CHANNEL_LABEL: Record<string, string> = { whatsapp: "WhatsApp", email: "Email", upload: "Upload" };
export function channelLabel(channel: string) {
  return CHANNEL_LABEL[channel] ?? channel;
}
