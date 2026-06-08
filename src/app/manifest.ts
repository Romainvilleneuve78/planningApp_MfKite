import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mon Planning",
    short_name: "Planning",
    description: "Planning de travail personnel — kitesurf & activités",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f9fc",
    theme_color: "#6366f1",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/api/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
