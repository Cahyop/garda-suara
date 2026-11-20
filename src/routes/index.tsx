import { createFileRoute } from "@tanstack/react-router";
import { WarRoomDashboard } from "@/components/war-room/war-room-dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Garda Suara | Pusat Kendali Relawan" },
      { name: "description", content: "Pusat kendali kampanye untuk memantau relawan, data lapangan, dukungan, dan laporan TPS." },
      { property: "og:title", content: "Garda Suara | Pusat Kendali Relawan" },
      { property: "og:description", content: "Pantau relawan, data lapangan, dukungan, dan laporan TPS dalam satu pusat kendali kampanye." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WarRoomDashboard,
});
