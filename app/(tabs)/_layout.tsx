import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSupabaseSession } from '@/utils/auth';
import { getProfile } from '@/utils/profile';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session, loading } = useSupabaseSession();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        setCheckingOnboarding(false);
        return;
      }

      const { data } = await getProfile(userId);
      const missingRequired = !data?.full_name || !data?.rank || !data?.organization;
      setNeedsOnboarding(Boolean(!data?.onboarding_shown || missingRequired));
      setCheckingOnboarding(false);
    };

    checkOnboarding();
  }, [session?.user?.id]);

  if (loading) return null;
  if (checkingOnboarding) return null;

  if (!session) {
    return <Redirect href="/get-started" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#8a8a8a',
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 6,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          height: 64,
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
        },
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-flights"
        options={{
          title: 'My flights',
          tabBarIcon: ({ color }) => <TabBarIcon name="plane" color={color} />,
        }}
      />
      <Tabs.Screen
        name="career"
        options={{
          title: 'Career',
          tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />,
        }}
      />
      <Tabs.Screen
        name="roster-import"
        options={{
          title: 'Roster import',
          tabBarIcon: ({ color }) => <TabBarIcon name="upload" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <TabBarIcon name="ellipsis-h" color={color} />,
        }}
      />
    </Tabs>
  );
}
