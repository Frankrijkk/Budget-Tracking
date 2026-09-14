import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { TransactionListPage } from './features/transactions/TransactionListPage'
import { TransactionFormPage } from './features/transactions/TransactionFormPage'
import { QuickAddPage } from './features/transactions/QuickAddPage'
import { ReceiptCapturePage } from './features/receipts/ReceiptCapturePage'
import { ReceiptReviewPage } from './features/receipts/ReceiptReviewPage'
import { CategoriesPage } from './features/categories/CategoriesPage'
import { BudgetsPage } from './features/budgets/BudgetsPage'
import { AccountsPage } from './features/accounts/AccountsPage'
import { RecurringPage } from './features/recurring/RecurringPage'
import { SavingsGoalsPage } from './features/goals/SavingsGoalsPage'
import { SettleUpPage } from './features/balance/SettleUpPage'
import { StatsPage } from './features/stats/StatsPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { MorePage } from './features/more/MorePage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/quick-add', element: <ProtectedRoute><QuickAddPage /></ProtectedRoute> },
  {
    path: '/',
    element: <ProtectedRoute><AppShell /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'transactions', element: <TransactionListPage /> },
      { path: 'transactions/new', element: <TransactionFormPage /> },
      { path: 'transactions/:id/edit', element: <TransactionFormPage /> },
      { path: 'receipts/capture', element: <ReceiptCapturePage /> },
      { path: 'receipts/:id/review', element: <ReceiptReviewPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'budgets', element: <BudgetsPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'recurring', element: <RecurringPage /> },
      { path: 'goals', element: <SavingsGoalsPage /> },
      { path: 'balance', element: <SettleUpPage /> },
      { path: 'stats', element: <StatsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'more', element: <MorePage /> },
    ],
  },
])
