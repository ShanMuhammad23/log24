import { View } from 'react-native';

function SkeletonBlock({ className }: { className?: string }) {
  return <View className={`rounded-md bg-rule dark:bg-night ${className ?? ''}`} />;
}

export function DocsStatsSkeleton() {
  return (
    <View className="flex-row">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className={`flex-1 items-center py-3.5 ${i > 1 ? 'border-l border-rule dark:border-ruleDark' : ''}`}>
          <SkeletonBlock className="mb-2 h-5 w-8" />
          <SkeletonBlock className="h-3 w-12" />
        </View>
      ))}
    </View>
  );
}

export function DocsContentSkeleton() {
  return (
    <>
      <View className="mb-4 flex-row overflow-hidden rounded-lg border border-rule bg-white p-2 dark:border-ruleDark dark:bg-panel">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="mx-1 h-8 flex-1" />
        ))}
      </View>

      {[1, 2, 3].map((i) => (
        <View key={i} className="mb-2 rounded-lg border border-rule bg-white p-3 dark:border-ruleDark dark:bg-panel">
          <View className="flex-row items-center">
            <SkeletonBlock className="mr-3 h-11 w-11" />
            <View className="flex-1">
              <SkeletonBlock className="mb-2 h-4 w-40" />
              <SkeletonBlock className="h-3 w-28" />
            </View>
            <SkeletonBlock className="h-10 w-20" />
          </View>
          <View className="mt-2 flex-row justify-between">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-4 w-4" />
          </View>
        </View>
      ))}
    </>
  );
}
