export type AuthMe = {
  id: string;
  role: "CLIENT" | "ADVISOR" | "DIRECTOR";
};

export async function getAuthMe(): Promise<AuthMe | null> {
    const res = await fetch("http://localhost:3001/auth/me", {
      credentials: "include",
      cache: "no-store",
    });
  
    if (!res.ok) return null;
    return res.json();
  }
