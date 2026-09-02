import { RouteBranchDefinition, RouteDefinitionMap, RouteTree } from './types';

/**
    * Builds a frozen, type-safe route tree from a plain definition object.
    *
    * Each entry is either a bare segment string (leaf) or `{ path, children }`
    * (branch). The absolute `fullPath` of every node is derived automatically —
    * you never write `/${parent}/${child}` by hand.
    *
    * @example
    * const Routes = defineRoutes({
    *   dashboard: 'dashboard',
    *   users: {
    *     path: 'users',
    *     children: {
    *       roleList: 'role-list',
    *       userList: 'user-list',
    *     },
    *   },
    * });
    *
    * Routes.dashboard.segment            // 'dashboard'
    * Routes.dashboard.fullPath           // '/dashboard'
    * Routes.users.children.roleList.fullPath // '/users/role-list'
    */
export function defineRoutes<const T extends RouteDefinitionMap>(
    definition: T,
    parentPath: string = '',
): RouteTree<T> {
    const tree: Record<string, unknown> = {};

    for (const key of Object.keys(definition)) {
        const entry = definition[key];
        const isBranch = typeof entry === 'object' && entry !== null;
        const segment = isBranch ? (entry as RouteBranchDefinition).path : (entry as string);
        const fullPath = `${parentPath}/${segment}`;
        const childDefs = isBranch ? (entry as RouteBranchDefinition).children : undefined;

        tree[key] = Object.freeze({
            segment,
            fullPath,
            children: childDefs ? defineRoutes(childDefs, fullPath) : undefined,
            toString: () => fullPath,
        });
    }

    return Object.freeze(tree) as RouteTree<T>;
}
