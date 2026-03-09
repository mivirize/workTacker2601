'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export default function ChatbotDetailRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chatbots');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  );
}
