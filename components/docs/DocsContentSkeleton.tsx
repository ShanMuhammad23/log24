import { View } from 'react-native';

function SkeletonBlock({ className }: { className?: string }) {
  return <View className={`rounded-lg bg-slate-200 dark:bg-slate-800 ${className ?? ''}`} />;
}

export function DocsStatsSkeleton() {
  return (
    <View className="rounded-xl border border-blue-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <SkeletonBlock className="mb-2 h-4 w-24" />
      <SkeletonBlock className="mb-2 h-4 w-28" />
      <SkeletonBlock className="h-4 w-24" />
    </View>
  );
}

export function DocsContentSkeleton() {
  return (
    <>
      <View className="mb-3 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
        <View className="flex-row flex-wrap justify-between gap-y-2">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-10 w-[48.5%]" />
          ))}
        </View>
      </View>

      <View className="mb-2 flex-row items-center justify-between px-1">
        <SkeletonBlock className="h-6 w-36" />
        <SkeletonBlock className="h-4 w-28" />
      </View>

      {[1, 2, 3].map((i) => (
        <View key={i} className="mb-2.5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <View className="flex-row items-center">
            <SkeletonBlock className="mr-3 h-11 w-11 rounded-xl" />
            <View className="flex-1">
              <SkeletonBlock className="mb-2 h-4 w-40" />
              <SkeletonBlock className="h-3 w-28" />
            </View>
            <SkeletonBlock className="h-10 w-20" />
          </View>
          <View className="mt-2 flex-row justify-between">
            <SkeletonBlock className="h-6 w-20 rounded-full" />
            <SkeletonBlock className="h-4 w-4" />
          </View>
        </View>
      ))}
    </>
  );
}
