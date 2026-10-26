import type { MetadataRoute } from "next";

/** Lets Adelka add the app to her home screen; it then opens like an app, also with a weak signal. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La casetta di Adelka",
    short_name: "La casetta",
    description: "Adelkin domček pri talianskom mori",
    lang: "sk",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf6ee",
    theme_color: "#fbf6ee",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
