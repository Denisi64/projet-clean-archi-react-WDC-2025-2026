"use client";

import { useEffect, useState } from "react";
import { Discussion } from "../services/chatApi";
import { apiGet } from "@/lib/api";


export function usePendingDiscussions() {
  const [data, setData] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Discussion[]>("/chat/advisor/pending")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
