import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSupabaseSession } from '@/utils/auth';
import { getProfile } from '@/utils/profile';

const HERO_BLUE = '#1d4ed8';
const HERO_BLUE_DARK = '#0f172a';

/** Routes reachable from in-app links but not shown as tab bar items. */
const HIDDEN_TAB_OPTIONS = {
  href: null,
} as const;

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size ?? 22} color={props.color} name={props.name} />;
}

function HomeTabBarButton(props: BottomTabBarButtonProps) {
  const {
    onPress,
    accessibilityState,
    accessibilityLabel,
    accessibilityRole,
    testID,
    style,
    // Default tab children (icon + label) must not be passed through — they break sibling tab labels.
    children: _defaultTabContent,
  } = props;
  const focused = accessibilityState?.selected;
  const color = focused ? '#ffffff' : '#bfdbfe';

  return (
    <Pressable
      onPress={onPress}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel ?? 'Home'}
      accessibilityRole={accessibilityRole}
      testID={testID}
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
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: isDark ? Colors.dark.tint : '#ffffff',
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#bfdbfe',
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
          tabBarLabel: 'Requirements',
          tabBarShowLabel: true,
          tabBarIcon: ({ color }) => <TabBarIcon name="list-alt" color={color} />,
        }}
      />
      <Tabs.Screen
        name="docs"
        options={{
          title: 'Docs',
          tabBarLabel: 'Docs',
          tabBarShowLabel: true,
          tabBarIcon: ({ color }) => <TabBarIcon name="folder-open" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          // Do not set tabBarShowLabel: false here — React Navigation applies that flag from the
          // focused screen to every tab, which hides all labels while Home is selected.
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: (props) => <HomeTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="calculation"
        options={{
          title: 'Calculation',
          tabBarLabel: 'Calculation',
          tabBarShowLabel: true,
          tabBarIcon: ({ color }) => <TabBarIcon name="calculator" color={color} />,
          unmountOnBlur: true,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const current = state.routes[state.index];
            if (current.name !== 'calculation') return;

            const nestedIndex = current.state?.index;
            if (typeof nestedIndex === 'number' && nestedIndex > 0) {
              e.preventDefault();
              router.replace('/calculation');
            }
          },
        })}
      />
      <Tabs.Screen
        name="weather"
        options={{
          title: 'Weather',
          tabBarLabel: 'Weather',
          tabBarShowLabel: true,
          tabBarIcon: ({ color }) => <TabBarIcon name="cloud" color={color} />,
        }}
      />
      <Tabs.Screen name="more" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="profile" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="profile-edit" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="my-account" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="career" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="import-flights" options={HIDDEN_TAB_OPTIONS} />
    </Tabs>
  );
}
