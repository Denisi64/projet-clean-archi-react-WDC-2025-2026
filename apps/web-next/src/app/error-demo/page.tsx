"use client";

export default function ErrorDemoPage() {
    if (typeof window !== "undefined") {
        throw new Error("Demo error to trigger error.tsx");
    }
    return null;
}
