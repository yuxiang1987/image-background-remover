import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.SITE_URL || "https://backgroundly.app"; return [{ url: base, priority: 1 }, { url: `${base}/privacy`, priority: 0.2 }, { url: `${base}/terms`, priority: 0.2 }]; }
