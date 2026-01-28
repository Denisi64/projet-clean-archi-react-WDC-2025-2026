// app/advisor/discussions/[discussionId]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { DiscussionView } from '@/features/chat/components/DiscussionView' 

export default function AdvisorDiscussionPage() {
    const { discussionId } = useParams<{ discussionId: string }>()

    return (
        <DiscussionView
            discussionId={discussionId}
            mode="ADVISOR"
        />
    )
}
