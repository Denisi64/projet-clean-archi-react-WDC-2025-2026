import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const routes = [
    "/",
    "/about",
    "/actions",
    "/transfers",
    "/director/admin",
    "/director/actions",
    "/director/savings-rate",
    "/advisor/credits",
    "/login",
    "/register",
];

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();
    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: route === "/" ? 1 : 0.6,
    }));
}
