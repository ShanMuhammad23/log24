import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type CollapsibleCategoryRowProps = {
  label: string;
  hint?: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  children?: React.ReactNode;
  nested?: boolean;
};

export function CollapsibleCategoryRow({
  label,
  hint,
  expanded,
  onExpandedChange,
  children,
  nested = false,
}: CollapsibleCategoryRowProps) {
  const rotation = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 1 : 0, { duration: 200 });
  }, [expanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  return (
    <View
      className={
        nested
          ? 'mb-3 ml-2 border-l-2 border-rule pl-3 last:mb-0 dark:border-ruleDark'
          : 'mb-1 last:mb-0'
      }>
      <Pressable
        onPress={() => onExpandedChange(!expanded)}
        className={`flex-row items-center justify-between rounded-lg px-1 py-2.5 active:opacity-70 ${
          expanded ? 'bg-arc/10 dark:bg-arc/10' : ''
        }`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}>
        <View className="flex-1 pr-3">
          <Text
            className={`text-sm font-medium ${
              expanded
                ? 'text-arcDeep dark:text-arc'
                : nested
                  ? 'text-ink dark:text-white'
                  : 'text-ink dark:text-white'
            }`}>
            {label}
          </Text>
          {hint ? (
            <Text className="mt-0.5 text-xs text-sub dark:text-mist">{hint}</Text>
          ) : null}
        </View>
        <Animated.View style={chevronStyle}>
          <FontAwesome
            name="chevron-down"
            size={12}
            color={expanded ? '#2EA8FF' : '#5B6580'}
          />
        </Animated.View>
      </Pressable>
      {expanded && children ? <View className="mt-1 px-1 pb-1">{children}</View> : null}
    </View>
  );
}
