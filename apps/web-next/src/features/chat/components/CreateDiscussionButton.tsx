"use client";

import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Discussion = {
  id: string;
};

export function CreateDiscussionButton() {
  const router = useRouter();

  const createDiscussion = async () => {
    try {
      const discussion = await apiPost<Discussion>("/chat/discussion");
      router.push(`/client/discussion/${discussion.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Button onClick={createDiscussion} className="w-full">
      Contacter un conseiller
    </Button>
  );
}
