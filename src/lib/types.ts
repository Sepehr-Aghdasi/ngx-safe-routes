/**
    * ============================================================================
    * ROUTE DEFINITIONS — what you write
    * ============================================================================
    * You describe routes as a plain object. Each property is either:
    *
    *   - a STRING ("leaf" route)         e.g. `dashboard: 'dashboard'`
    *   - an OBJECT ("branch" route)      e.g. `users: { path: 'users', children: { list: 'list' } }`
    */

export type RouteDefinition = string | RouteBranchDefinition;

export interface RouteBranchDefinition {
    path: string;
    children?: RouteDefinitionMap;
}

export type RouteDefinitionMap = Record<string, RouteDefinition>;

/**
    * ============================================================================
    * PATH JOINING
    * ============================================================================
    * Combines a parent's absolute path with a child's segment.
    *
    *   Join<'', 'users'>       -> '/users'
    *   Join<'/users', 'list'>  -> '/users/list'
    */
export type Join<Parent extends string, Segment extends string> = Parent extends ''
    ? `/${Segment}`
    : `${Parent}/${Segment}`;

/**
    * ============================================================================
    * ROUTE NODE — what you get back
    * ============================================================================
    * Every route you define turns into one of these after `defineRoutes()` runs.
    */
export interface RouteNode<Segment extends string, FullPath extends string, Children> {
    /** The route's own segment, e.g. 'users'.       Use for Angular's `Routes[].path`. */
    readonly segment: Segment;
    /** The full absolute path, e.g. '/users/list'.  Use for `router.navigate()` / `routerLink`. */
    readonly fullPath: FullPath;
    /** Nested routes, or `undefined` if this route has none. */
    readonly children: Children;
    /** Lets a node be used directly anywhere a plain string path is expected. */
    toString(): FullPath;
}

/**
    * ============================================================================
    * BUILDING THE TREE — turning definitions into nodes
    * ============================================================================
    * Done in small, separate steps instead of one big nested type, so each step
    * can be read on its own.
    */

// Step 1a: a leaf definition (plain string) becomes a node with no children.
type NodeFromLeaf<Segment extends string, ParentPath extends string> = RouteNode<
    Segment,
    Join<ParentPath, Segment>,
    undefined
>;

// Step 1b: a branch definition (object) becomes a node. If it declares
// `children`, those get resolved into a nested RouteTree too.
// (Accepts the wider `RouteDefinition` so it can be called with the
// not-a-string branch of Step 1 below without TypeScript complaining.)
type NodeFromBranch<Branch extends RouteDefinition, ParentPath extends string> = Branch extends {
    path: infer Segment extends string;
    children: infer Children extends RouteDefinitionMap;
}
    ? RouteNode<Segment, Join<ParentPath, Segment>, RouteTree<Children, Join<ParentPath, Segment>>>
    : Branch extends { path: infer Segment extends string }
        ? RouteNode<Segment, Join<ParentPath, Segment>, undefined>
        : never;

// Step 1: pick leaf or branch handling depending on what was written.
type NodeFromDefinition<Definition extends RouteDefinition, ParentPath extends string> = Definition extends string
    ? NodeFromLeaf<Definition, ParentPath>
    : NodeFromBranch<Definition, ParentPath>;

// Step 2: apply step 1 to every key of the definitions object.
export type RouteTree<T extends RouteDefinitionMap, ParentPath extends string = ''> = {
    readonly [Key in keyof T]: NodeFromDefinition<T[Key], ParentPath>;
};

/**
    * ============================================================================
    * ROUTE PARAMS — reading `:id` out of a path
    * ============================================================================
    *   ExtractParamNames<'/users/:id'>       -> 'id'
    *   ExtractParamNames<'/users/:id/:tab'>  -> 'id' | 'tab'
    *   ExtractParamNames<'/dashboard'>       -> never (no params)
    */
export type ExtractParamNames<Path extends string> =
    // More than one ':param' left: grab the first one, keep scanning the rest.
    Path extends `${string}:${infer Param}/${infer Rest}`
        ? Param | ExtractParamNames<`/${Rest}`>
        : // Exactly one ':param' left: grab it and stop.
            Path extends `${string}:${infer Param}`
            ? Param
            : // No ':' left at all: this path has no params.
                never;

/**
    *   RouteParams<'/users/:id'>  -> { id: string | number }
    *   RouteParams<'/dashboard'>  -> {} (nothing required)
    */
export type RouteParams<Path extends string> = [ExtractParamNames<Path>] extends [never]
    ? Record<string, never>
    : { [Param in ExtractParamNames<Path>]: string | number };

/**
    * ============================================================================
    * ALL PATHS — collecting every fullPath in a tree
    * ============================================================================
    * Powers `defineRouteTranslations()`: a translation entry can only reference
    * a `route` that actually exists somewhere in your tree.
    */

// A single node contributes its own path, plus every path from its children.
type PathsOfNode<Node> = Node extends RouteNode<string, infer Path extends string, infer Children>
    ? Path | PathsOfTree<Children>
    : never;

// A tree (or `undefined`, for a leaf's empty children) contributes the
// combined paths of every node inside it.
type PathsOfTree<Tree> = Tree extends undefined
    ? never
    : { [Key in keyof Tree]: PathsOfNode<Tree[Key]> }[keyof Tree];

export type AllPaths<T> = PathsOfTree<T>;
