import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/suppliers", "/suppliers/$", "/champions", "/champions/$"],
        disallow: [
          "/requests/",
          "/admin/",
          "/login/",
          "/signup/",
          "/profile/",
        ],
      },
    ],
    sitemap: "https://hiddenchampions.pk/sitemap.xml",
  };
}
