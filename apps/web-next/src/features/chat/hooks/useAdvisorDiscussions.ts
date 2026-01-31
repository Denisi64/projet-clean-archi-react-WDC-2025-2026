"use client";

import { useEffect, useState } from "react";
import { fetchAdvisorDiscussions, Discussion } from "../services/chatApi";

export function useAdvisorDiscussions() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdvisorDiscussions()
      .then(setDiscussions)
      .catch((err) => {
        console.error("Failed to load discussions", err);
        setError("Impossible de charger les discussions");
      })
      .finally(() => setLoading(false));
  }, []);

  return { discussions, loading, error };
}
