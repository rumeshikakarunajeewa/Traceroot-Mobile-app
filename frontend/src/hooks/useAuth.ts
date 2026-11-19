import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Simple auth hook used throughout the app.
 * Returns the currently logged‑in farmer's ID (or a default dev ID if unauthenticated).
 */
export function useAuth() {
  const [farmerId, setFarmerId] = useState<string | undefined>('farmer-1');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setFarmerId(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        setFarmerId(session.user.id);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { farmerId };
}
