import { lazy, Suspense, type ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#155E4B]" aria-hidden />
    </div>
  );
}

export function lazyPage<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  const Lazy = lazy(factory);
  return function LazyPage(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}

export function lazyNamedPage<T extends ComponentType<any>>(
  factory: () => Promise<Record<string, T>>,
  exportName: string,
) {
  const Lazy = lazy(() =>
    factory().then((mod) => {
      const component = mod[exportName];
      if (!component) {
        throw new Error(`Missing export "${exportName}" in lazy route module`);
      }
      return { default: component };
    }),
  );
  return function LazyPage(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
