"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function WizardButton() {
  const router = useRouter();

  return (
    <Button 
      onClick={() => router.push('/meter-reading/wizard')}
      size="sm"
    >
      <Plus className="w-4 h-4 mr-2" />
      Record Reading
    </Button>
  );
}
