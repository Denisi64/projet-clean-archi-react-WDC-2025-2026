"use client";

import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import styles from "../../../app/page.module.css";

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
    <button onClick={createDiscussion} className={styles.link}>
      Contacter un conseiller
    </button>
  );
}
