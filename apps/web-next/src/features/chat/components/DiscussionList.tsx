"use client";

import { useAdvisorDiscussions } from "../hooks/useAdvisorDiscussions";

export default function DiscussionList() {
  const { discussions, loading, error } = useAdvisorDiscussions();

  if (loading) return <p>Loading discussions…</p>;

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (discussions.length === 0) {
    return <p>Aucune discussion en attente</p>;
  }

  return (
    <ul>
      {discussions.map((c) => (
        <li key={c.id}>
          {c.id} — {c.status}
        </li>
      ))}
    </ul>
  );
}
