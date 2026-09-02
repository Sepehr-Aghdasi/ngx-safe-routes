import { buildPath, defineRoutes } from '../src/public-api';

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

declare const router: { navigate: (commands: string[], extras?: unknown) => void };
const defaultCategory = 'general';

router.navigate([AccountingRoutes.settings.fullPath], {
    queryParams: { category: defaultCategory },
});

// Parameterized navigation:
router.navigate([buildPath(AccountingRoutes.users.children.detail.fullPath, { id: 42 })]);
// buildPath(AccountingRoutes.dashboard.fullPath, { id: 1 }); // Type error: dashboard takes no params

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