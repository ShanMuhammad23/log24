import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Redirect } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabaseSession } from '@/utils/auth';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  Extrapolate 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const FEATURE_WIDTH = width - 64;
const CARD_MARGIN = 16;

const FEATURES = [
  {
    icon: 'plane',
    title: 'Track Every Flight',
    description: 'Log sectors, duty hours, and routes in seconds with intelligent auto-fill.',
  },
  {
    icon: 'line-chart',
    title: 'Career Insights',
    description: 'Visualize your monthly trends, total hours, and career milestones at a glance.',
  },
  {
    icon: 'calendar-check-o',
    title: 'Roster Sync',
    description: 'Import roster data seamlessly and keep your records always up to date.',
  },
] as const;

export default function GetStartedScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { session, loading } = useSupabaseSession();
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slide every 4 seconds
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % FEATURES.length;
        scrollViewRef.current?.scrollTo({
          x: next * (FEATURE_WIDTH + CARD_MARGIN),
          animated: true,
        });
        return next;
      });
    }, 4000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  // Pause auto-play on manual scroll
  const handleScrollBegin = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const handleScrollEnd = useCallback((event: any) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (FEATURE_WIDTH + CARD_MARGIN));
    setActiveIndex(nextIndex);
    
    // Resume auto-play after 6 seconds of inactivity
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % FEATURES.length;
        scrollViewRef.current?.scrollTo({
          x: next * (FEATURE_WIDTH + CARD_MARGIN),
          animated: true,
        });
        return next;
      });
    }, 6000);
  }, []);

  if (!loading && session) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-paper dark:bg-night">
    <View className="flex-1 flex-col flex gap-8 justify-between bg-paper dark:bg-night">
      <View className="">
      <View className="px-8 pt-16 pb-6">
        <View className="items-center">
          {/* Logo Mark */}
          <Image source={require('@/assets/images/logo.jpeg')} style={{ width: 100, height: 100 }} />
          
          <Text className="mt-2 text-center text-base text-sub dark:text-mist">
            Your digital pilot logbook starts here
          </Text>
        </View>
      </View>

      {/* Carousel Section */}
      <View className=" justify-center">
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollEnd={handleScrollEnd}
          contentContainerStyle={{ paddingHorizontal: 32 }}
          snapToInterval={FEATURE_WIDTH + CARD_MARGIN}
          decelerationRate="fast"
        >
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              index={index}
              activeIndex={activeIndex}
              isDark={isDark}
            />
          ))}
          
        </ScrollView>
        <View className="mt-6 flex-row justify-center items-center">
          {FEATURES.map((feature, idx) => (
            <View
              key={feature.title}
              className={cn(
                "mx-1 h-2 rounded-full transition-all duration-300",
                idx === activeIndex 
                  ? "w-8 bg-arc" 
                  : "w-2 bg-rule dark:bg-panel"
              )}
            />
          ))}
        </View>

        {/* Pagination Dots */}
       
      </View>
      </View>
      {/* Top Section - Brand */}
     

      {/* Bottom Section - CTA */}
      <View className="px-8 pb-12 pt-6">
        <Link href="/login" asChild>
          <Pressable 
            className="items-center rounded-lg bg-arc py-4  active:scale-[0.98] transition-transform"
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Text className="text-base font-semibold text-night">
              Get started
            </Text>
          </Pressable>
        </Link>

        <View className="mt-5 flex-row items-center justify-center">
          <Text className="text-sm text-sub dark:text-mist">
            Already have an account?{' '}
          </Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text className="text-sm font-semibold text-arcDeep dark:text-arc">
                Sign in
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
    </SafeAreaView>
  );
}

// Feature Card Component with scale animation
function FeatureCard({ 
  feature, 
  index, 
  activeIndex, 
  isDark 
}: { 
  feature: typeof FEATURES[number]; 
  index: number; 
  activeIndex: number;
  isDark: boolean;
}) {
  const scale = useSharedValue(1);
  
  useEffect(() => {
    scale.value = withSpring(index === activeIndex ? 1 : 0.92, {
      damping: 15,
      stiffness: 150,
    });
  }, [activeIndex, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(
      scale.value,
      [0.92, 1],
      [0.7, 1],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <Animated.View
      style={[
        { width: FEATURE_WIDTH, marginRight: CARD_MARGIN },
        animatedStyle,
      ]}
      className="rounded-xl border border-rule bg-white p-8 dark:border-ruleDark dark:bg-panel flex flex-col gap-4 items-center justify-center"
    >
      {/* Icon Container */}
      <View className="h-16 w-16 items-center justify-center rounded-lg bg-arc/10 dark:bg-arc/10">
        <FontAwesome 
          name={feature.icon} 
          size={28} 
          color="#2EA8FF" 
        />
      </View>

      {/* Content */}
      <Text className="mt-8 text-2xl font-bold text-ink dark:text-white leading-tight">
        {feature.title}
      </Text>
      <Text className="mt-3 text-base leading-relaxed text-sub dark:text-mist">
        {feature.description}
      </Text>

    
    </Animated.View>
  );
}

// Utility for className merging
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}