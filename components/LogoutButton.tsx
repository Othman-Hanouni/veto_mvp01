'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <button
      className="secondary"
      style={{ width: 'auto' }}
      onClick={async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
      }}
      disabled={loading}
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  );
}
