import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import { Redirect, Tabs, router, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ARC, MIST, NIGHT, RULE_DARK } from '@/constants/Colors';
import { useSupabaseSession } from '@/utils/auth';
import { syncDocumentExpiryNotifications } from '@/utils/document-notifications';
import { getProfile } from '@/utils/profile';

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
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: focused ? ARC : 'transparent',
          borderWidth: focused ? 0 : 1,
          borderColor: RULE_DARK,
        }}>
        <FontAwesome name="home" size={21} color={focused ? NIGHT : MIST} />
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const appRouter = useRouter();
  const { session, loading } = useSupabaseSession();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const documentId = response.notification.request.content.data?.documentId;
      if (typeof documentId === 'string') {
        appRouter.push(`/document-details/${documentId}`);
      }
    });
    return () => sub.remove();
  }, [appRouter]);

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

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    syncDocumentExpiryNotifications(userId).catch((err) => {
      console.warn('Document notification sync failed:', err);
    });
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
        tabBarActiveTintColor: ARC,
        tabBarInactiveTintColor: MIST,
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
          backgroundColor: NIGHT,
          borderTopColor: RULE_DARK,
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
