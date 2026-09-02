import { RouteParams } from './types';

/**
 * Interpolates `:param` placeholders in a fullPath. TypeScript infers which
 * params are required straight from the path literal, so `params` is only
 * requested (and only accepts the right keys) when the path actually has
 * placeholders.
 *
 * @example
 * buildPath(Routes.users.children.detail.fullPath, { id: 42 });
 * // '/users/detail/42'
 *
 * buildPath(Routes.dashboard.fullPath);
 * // '/dashboard' — no second argument allowed, none needed
 */
export function buildPath<Path extends string>(
    path: Path,
    ...params: RouteParams<Path> extends Record<string, never> ? [] : [params: RouteParams<Path>]
): string {
    const values = (params[0] ?? {}) as Record<string, string | number>;
    return Object.entries(values).reduce(
        (result, [key, value]) => result.replace(`:${key}`, String(value)),
        path as string,
    );
}
