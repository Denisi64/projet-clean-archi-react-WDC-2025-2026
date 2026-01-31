// app/client/discussions/[discussionId]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { DiscussionView } from '@/features/chat/components/DiscussionView'

export default function ClientDiscussionPage() {
    const { discussionid } = useParams<{ discussionid: string }>()
    

    return (
        <DiscussionView
            discussionId={discussionid}
            mode="CLIENT"
        />
    )
}
