import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/format";

const SIZES = { xs: "size-6 text-2xs", sm: "size-8 text-xs", md: "size-9 text-sm", lg: "size-11 text-base" };

export function Avatar({
  name,
  color,
  src,
  size = "md",
  className,
}: {
  name: string;
  color?: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color ?? "#4f46e5" }}
      title={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full rounded-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
