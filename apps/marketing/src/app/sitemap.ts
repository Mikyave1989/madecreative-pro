import type { MetadataRoute } from "next";

const BASE = "https://madecreative.pro";
const LOCALES = ["de", "it", "es", "fr", "nl", "pt", "en"];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];

  routes.push({
    url: BASE,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  });

  for (const locale of LOCALES) {
    routes.push({
      url: `${BASE}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    });
    routes.push({
      url: `${BASE}/${locale}/demo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
    routes.push({
      url: `${BASE}/${locale}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    });
  }

  return routes;
}
