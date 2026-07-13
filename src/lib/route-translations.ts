import { AllPaths } from './types';

/**
 * Same shape as a typical route -> i18n key map, except `route` is
 * constrained to a path that actually exists in `T`. Renaming or removing
 * a route in your `defineRoutes()` tree makes any stale entry here a
 * compile error instead of a silent lookup miss at runtime.
 */
export interface RouteTranslation<T> {
  route: AllPaths<T>;
  translateKey: string;
}

/**
 * Identity function whose only job is to infer `T` from `routes` so that
 * `translations` gets checked against it. Returns the array unchanged.
 *
 * @example
 * const RouteTranslations = defineRouteTranslations(Routes, [
 *   { route: Routes.dashboard.fullPath, translateKey: 'dashboard.title' },
 *   { route: Routes.users.children.roleList.fullPath, translateKey: 'users.roleList' },
 * ]);
 */
export function defineRouteTranslations<T>(
  routes: T,
  translations: RouteTranslation<T>[],
): RouteTranslation<T>[] {
  return translations;
}

/** Runtime lookup: resolves a translateKey for the current URL, matching by exact fullPath. */
export function findTranslateKey<T>(
  currentUrl: string,
  translations: RouteTranslation<T>[],
): string | undefined {
  return translations.find((entry) => entry.route === currentUrl)?.translateKey;
}
