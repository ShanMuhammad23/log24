import { Redirect } from 'expo-router';
import { useSupabaseSession } from '@/utils/auth';

export default function IndexRoute() {
  const { session, loading } = useSupabaseSession();

  if (loading) {
    return null;
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/get-started" />;
}
