export async function login(data: { email: string; password: string; remember?: boolean }) {
    const csrf = document.cookie.split("; ").find(c => c.startsWith("csrf="))?.split("=")[1] ?? "";
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        credentials: "include",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.code ?? "LOGIN_FAILED");
    }
}