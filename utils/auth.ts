import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [configMissing, setConfigMissing] = useState(!isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setConfigMissing(true);
      setLoading(false);
      return;
    }

    setConfigMissing(false);
    let mounted = true;
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { session, loading, configMissing };
}
