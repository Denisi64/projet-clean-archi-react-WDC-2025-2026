// app/client/discussions/[discussionId]/page.tsx
"use client";
import { useParams } from "next/navigation";
import { DiscussionView } from "@/features/chat/components/DiscussionView";

export default function ClientDiscussionPage() {
  const params = useParams();
  const discussionId = params.discussionId as string;
  
  return <DiscussionView discussionId={discussionId} mode="CLIENT" />;
}