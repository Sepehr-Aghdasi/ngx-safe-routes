# ngx-typed-routes

Compile-time-safe route paths for Angular. Define your routes once as a
plain nested object; every segment, absolute path, and i18n route-mapping
entry is checked by the TypeScript compiler afterward — so a typo'd or
renamed route fails `tsc`, not a click in the browser.

Angular's `Routes` array and `router.navigate()` both take plain strings,
so there's nothing stopping `path: 'bank-lsit'` or a stale
`router.navigate(['/old-path'])` from compiling. This package doesn't
change that at the Angular API boundary — it gives you a single typed
source of truth to generate those strings from, so mistakes show up where
you write the route definition, not at runtime.

> Requires TypeScript >= 5.0 (uses `const` type parameters to infer
> literal path types without needing `as const` everywhere).
> No runtime dependency on `@angular/core` or `@angular/router` — it's
> plain TypeScript, so it works with any Angular build system (CLI,
> esbuild, custom webpack) without extra configuration.

## Install

```bash
npm install ngx-typed-routes
```

## Basic usage

```ts
import { defineRoutes } from 'ngx-typed-routes';

export const AccountingRoutes = defineRoutes({
  dashboard: 'dashboard',
  accessDenied: 'access-denied',
  settings: 'settings',
  users: {
    path: 'users',
    children: {
      roleList: 'role-list',
      userList: 'user-list',
      detail: 'detail/:id',
    },
  },
});
```

Every node exposes:

| Property    | Example                                            | Use it for                          |
| ----------- | --------------------------------------------------- | ------------------------------------ |
| `.segment`  | `AccountingRoutes.users.children.roleList.segment` → `'role-list'` | `Routes[].path` in routing modules   |
| `.fullPath` | `AccountingRoutes.users.children.roleList.fullPath` → `'/users/role-list'` | `router.navigate([...])`, `routerLink` |
| `.children` | `AccountingRoutes.users.children`                   | Nested routes                        |

No manual `${this.USERS}/${this.ROLE_LIST}` concatenation — `fullPath` is
derived automatically from nesting, and it's a literal type, not just
`string`.

## Routing module

```ts
import { AccountingRoutes } from './accounting-routes';

const routes: Routes = [
  {
    path: AccountingRoutes.users.children.roleList.segment, // bare segment
    loadChildren: () => import('./role-list/role-list.module').then((m) => m.RoleListModule),
    canActivate: [permissionGuard],
    data: { permission: PermissionList.Users.RoleList.ViewList },
  },
];
```

## Navigation

```ts
this.router.navigate([AccountingRoutes.settings.fullPath], {
  queryParams: { category: this.defaultCategory },
});
```

## Parameterized routes

```ts
import { buildPath } from 'ngx-typed-routes';

buildPath(AccountingRoutes.users.children.detail.fullPath, { id: user.id });
// '/users/detail/42'

buildPath(AccountingRoutes.dashboard.fullPath, { id: 1 });
// Type error: 'dashboard' takes no params — second argument isn't allowed

buildPath(AccountingRoutes.users.children.detail.fullPath);
// Type error: 'detail/:id' requires { id }
```

Params are inferred straight from the path string's `:param` segments —
you never declare a params type separately from the route.

## Route translations

```ts
import { defineRouteTranslations, findTranslateKey } from 'ngx-typed-routes';

export const AccountingRouteTranslations = defineRouteTranslations(AccountingRoutes, [
  { route: AccountingRoutes.dashboard.fullPath, translateKey: 'dashboard.title' },
  { route: AccountingRoutes.users.children.roleList.fullPath, translateKey: 'accountingCodes.chartOfAccounts' },
]);

// { route: '/dashbord', translateKey: '...' } would fail to compile —
// 'route' only accepts paths that actually exist in AccountingRoutes.

// Runtime lookup, e.g. in a title/breadcrumb resolver on NavigationEnd:
const key = findTranslateKey(this.router.url, AccountingRouteTranslations);
```

This is the one piece a hand-rolled static class usually can't do cheaply:
the array's `route` field is a union of every real path in your tree, so
a rename that forgets to update the translation map is a compile error,
not a blank breadcrumb in production.

## Migrating from a hand-written static class

If you currently have:

```ts
export class AccountingRoutes {
  public static readonly USERS = 'users';
  public static readonly ROLE_LIST = 'role-list';
  public static readonly ROLE_LIST_PATH = `/${this.USERS}/${this.ROLE_LIST}`;
}
```

the equivalent is:

```ts
export const AccountingRoutes = defineRoutes({
  users: { path: 'users', children: { roleList: 'role-list' } },
});
```

with `AccountingRoutes.users.children.roleList.segment` /
`.fullPath` replacing `ROLE_LIST` / `ROLE_LIST_PATH`. The main call-site
change is the extra `.children` step for nested routes — in exchange,
`fullPath` is generated instead of hand-written, and it can't drift out
of sync with the segments it's built from.

## API reference

- `defineRoutes(definition)` — builds the frozen route tree.
- `defineRouteTranslations(routes, translations)` — type-checks a
  route → i18n-key array against a route tree.
- `findTranslateKey(url, translations)` — runtime lookup by exact `fullPath`.
- `buildPath(fullPath, params?)` — interpolates `:param` placeholders,
  with `params` type-inferred from the path.
- Types: `RouteNode`, `RouteTree`, `RouteDefinition`, `RouteParams<Path>`,
  `AllPaths<T>`.

## License

MIT
