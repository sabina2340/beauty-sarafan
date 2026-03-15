import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Сарафан",
    short_name: "Сарафан",
    description: "Мобильный каталог бьюти-мастеров",
    start_url: "/",
    display: "standalone",
    background_color: "#efeded",
    theme_color: "#ffea2f",
    lang: "ru",
    orientation: "portrait",
    icons: [
      {
        src: "/logo-placeholder.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo-placeholder.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
