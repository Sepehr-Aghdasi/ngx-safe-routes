import { buildPath, defineRoutes, defineRouteTranslations } from '../src/public-api';

// --- Equivalent of image 1: the route registry -----------------------------

export const AccountingRoutes = defineRoutes({
  dashboard: 'dashboard',
  accessDenied: 'access-denied',
  notFound: 'not-found',
  welcome: 'welcome',
  loginCallback: 'login-callback',
  settings: 'settings',
  users: {
    path: 'users',
    children: {
      roleList: 'role-list',
      userList: 'user-list',
      detail: 'detail/:id', // parameterized child, not in the original screenshot — shows param support
    },
  },
  bank: {
    path: 'bank',
    children: {
      bankList: 'bank-list',
      bankAccountList: 'bank-account-list',
      cashAccountList: 'cash-account-list',
    },
  },
});

// No more `/${this.USERS}/${this.ROLE_LIST}` by hand:
AccountingRoutes.dashboard.segment; // 'dashboard'
AccountingRoutes.dashboard.fullPath; // '/dashboard'
AccountingRoutes.users.children.roleList.fullPath; // '/users/role-list'
AccountingRoutes.bank.children.bankList.segment; // 'bank-list'  (bare segment for Routes config)
AccountingRoutes.bank.children.bankList.fullPath; // '/bank/bank-list' (absolute path for navigate)

// --- Equivalent of image 2: RouteTranslations -------------------------------
// The `route` field is now checked against real routes at compile time.

export const AccountingRouteTranslations = defineRouteTranslations(AccountingRoutes, [
  { route: AccountingRoutes.dashboard.fullPath, translateKey: 'dashboard.title' },
  { route: AccountingRoutes.accessDenied.fullPath, translateKey: 'accessDenied.accessDenied' },
  {
    route: AccountingRoutes.users.children.roleList.fullPath,
    translateKey: 'accountingCodes.chartOfAccounts',
  },
  {
    route: AccountingRoutes.users.children.userList.fullPath,
    translateKey: 'accountingCodes.detailedAccount',
  },
]);

// Uncomment to see the compile-time check this adds over a plain `string` field:
// defineRouteTranslations(AccountingRoutes, [
//   { route: '/dashbord', translateKey: 'dashboard.title' }, // Type error: not a valid route
// ]);

// --- Equivalent of image 3: router.navigate ---------------------------------

declare const router: { navigate: (commands: string[], extras?: unknown) => void };
const defaultCategory = 'general';

router.navigate([AccountingRoutes.settings.fullPath], {
  queryParams: { category: defaultCategory },
});

// Parameterized navigation:
router.navigate([buildPath(AccountingRoutes.users.children.detail.fullPath, { id: 42 })]);
// buildPath(AccountingRoutes.dashboard.fullPath, { id: 1 }); // Type error: dashboard takes no params

// --- Equivalent of image 4: routing module -----------------------------------

declare const permissionGuard: unknown;
declare const PermissionList: { BasicInfo: { Bank: { ViewList: unknown }; BankAccount: { ViewList: unknown } } };

export const bankRoutes = [
  {
    path: AccountingRoutes.bank.children.bankList.segment, // bare segment, not fullPath
    loadChildren: () => import('./bank-list.module').then((m) => (m as any).BankListModule),
    canActivate: [permissionGuard],
    data: { permission: PermissionList.BasicInfo.Bank.ViewList },
  },
  {
    path: AccountingRoutes.bank.children.bankAccountList.segment,
    loadChildren: () => import('./bank-account-list.module').then((m) => (m as any).BankAccountListModule),
    canActivate: [permissionGuard],
    data: { permission: PermissionList.BasicInfo.BankAccount.ViewList },
  },
];
