import { View } from 'react-native';

function SkeletonBlock({ className }: { className?: string }) {
  return <View className={`rounded-lg bg-slate-200 dark:bg-slate-800 ${className ?? ''}`} />;
}

function SectionCardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      {children}
    </View>
  );
}

export function FlightDetailsBodySkeleton() {
  return (
    <View className="px-3 pt-3">
      <SectionCardSkeleton>
        <View className="flex-row items-center justify-between">
          <SkeletonBlock className="h-10 w-16" />
          <SkeletonBlock className="h-4 w-4 rounded-full" />
          <SkeletonBlock className="h-10 w-16" />
        </View>
        <SkeletonBlock className="mt-3 h-4 w-40" />
      </SectionCardSkeleton>

      <SectionCardSkeleton>
        <View className="flex-row gap-4">
          <SkeletonBlock className="h-12 flex-1" />
          <SkeletonBlock className="h-12 flex-1" />
        </View>
      </SectionCardSkeleton>

      <SectionCardSkeleton>
        <View className="flex-row justify-between">
          <SkeletonBlock className="h-12 w-[30%]" />
          <SkeletonBlock className="h-12 w-[30%]" />
          <SkeletonBlock className="h-12 w-[30%]" />
        </View>
      </SectionCardSkeleton>

      <SectionCardSkeleton>
        <SkeletonBlock className="mb-3 h-4 w-32" />
        <View className="flex-row justify-between">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} className="h-14 w-[18%]" />
          ))}
        </View>
      </SectionCardSkeleton>

      <SectionCardSkeleton>
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="mt-2 h-10 w-full" />
      </SectionCardSkeleton>

      <View className="mt-2 flex-row gap-3">
        <SkeletonBlock className="h-12 flex-1" />
        <SkeletonBlock className="h-12 flex-1" />
      </View>
    </View>
  );
}
