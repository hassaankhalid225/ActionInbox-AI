import type { MetadataRoute } from "next";

// PWA manifest (SRS FR-056 — installable PWA shell).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ActionInbox AI",
    short_name: "ActionInbox",
    description: "Turn messy inbound into approved actions.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
