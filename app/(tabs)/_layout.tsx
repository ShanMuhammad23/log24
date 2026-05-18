import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSupabaseSession } from '@/utils/auth';
import { getProfile } from '@/utils/profile';

const HERO_BLUE = '#1d4ed8';
const HERO_BLUE_DARK = '#0f172a';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size ?? 22} color={props.color} name={props.name} />;
}

function HomeTabBarButton(props: BottomTabBarButtonProps) {
  const { onPress, accessibilityState, style, ...rest } = props;
  const focused = accessibilityState?.selected;
  const color = focused ? '#ffffff' : '#bfdbfe';

  return (
    <Pressable
      {...rest}
      onPress={onPress}
      accessibilityState={accessibilityState}
      accessibilityLabel="Home"
      style={[style, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 24,
          paddingHorizontal: 18,
          paddingTop: 8,
          paddingBottom: 7,
          minWidth: 76,
          backgroundColor: focused ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.14)',
        }}>
        <FontAwesome name="home" size={focused ? 26 : 24} color={color} />
        <Text
          style={{
            marginTop: 3,
            fontSize: 11,
            fontWeight: '700',
            color,
            includeFontPadding: false,
          }}>
          Home
        </Text>
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
        tabBarActiveTintColor: isDark ? Colors.dark.tint : '#ffffff',
        tabBarInactiveTintColor: isDark ? '#8a8a8a' : '#bfdbfe',
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 4,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 6,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          height: 72,
          paddingTop: 4,
          paddingBottom: 6,
          backgroundColor: isDark ? HERO_BLUE_DARK : HERO_BLUE,
          borderTopColor: isDark ? '#1e293b' : '#1e40af',
          borderTopWidth: 1,
          overflow: 'visible',
        },
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="requirements"
        options={{
          title: 'Requirements',
          tabBarIcon: ({ color }) => <TabBarIcon name="list-alt" color={color} />,
        }}
      />
      <Tabs.Screen
        name="docs"
        options={{
          title: 'Docs',
          tabBarIcon: ({ color }) => <TabBarIcon name="folder-open" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarShowLabel: false,
          tabBarIcon: () => null,
          tabBarButton: (props) => <HomeTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="calculation"
        options={{
          title: 'Calculation',
          tabBarIcon: ({ color }) => <TabBarIcon name="calculator" color={color} />,
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          title: 'Weather',
          tabBarIcon: ({ color }) => <TabBarIcon name="cloud" color={color} />,
        }}
      />
    </Tabs>
  );
}
