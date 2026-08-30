import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Duke Men's Basketball Video Room",
    short_name: "Video Room",
    description:
      "Shifts, hours, task board and how-tos for the practice video crew.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#dcdcd9",
    theme_color: "#012169",
    icons: [
      { src: "/manifest-icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/manifest-icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/manifest-icons/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
