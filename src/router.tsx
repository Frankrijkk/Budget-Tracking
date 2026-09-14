import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { TransactionListPage } from './features/transactions/TransactionListPage'
import { TransactionFormPage } from './features/transactions/TransactionFormPage'
import { QuickAddPage } from './features/transactions/QuickAddPage'

// Code-split everything off the critical path (login -> dashboard -> quick
// add / add transaction) so those load fast; recharts in particular is
// heavy, so keeping it out of the main bundle matters on mobile networks.
const ReceiptCapturePage = lazy(() => import('./features/receipts/ReceiptCapturePage').then((m) => ({ default: m.ReceiptCapturePage })))
const ReceiptReviewPage = lazy(() => import('./features/receipts/ReceiptReviewPage').then((m) => ({ default: m.ReceiptReviewPage })))
const CategoriesPage = lazy(() => import('./features/categories/CategoriesPage').then((m) => ({ default: m.CategoriesPage })))
const BudgetsPage = lazy(() => import('./features/budgets/BudgetsPage').then((m) => ({ default: m.BudgetsPage })))
const AccountsPage = lazy(() => import('./features/accounts/AccountsPage').then((m) => ({ default: m.AccountsPage })))
const RecurringPage = lazy(() => import('./features/recurring/RecurringPage').then((m) => ({ default: m.RecurringPage })))
const SavingsGoalsPage = lazy(() => import('./features/goals/SavingsGoalsPage').then((m) => ({ default: m.SavingsGoalsPage })))
const SettleUpPage = lazy(() => import('./features/balance/SettleUpPage').then((m) => ({ default: m.SettleUpPage })))
const StatsPage = lazy(() => import('./features/stats/StatsPage').then((m) => ({ default: m.StatsPage })))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const MorePage = lazy(() => import('./features/more/MorePage').then((m) => ({ default: m.MorePage })))

function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-text-muted">Loading…</p>}>{children}</Suspense>
  )
}

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
      { path: 'receipts/capture', element: <Lazy><ReceiptCapturePage /></Lazy> },
      { path: 'receipts/:id/review', element: <Lazy><ReceiptReviewPage /></Lazy> },
      { path: 'categories', element: <Lazy><CategoriesPage /></Lazy> },
      { path: 'budgets', element: <Lazy><BudgetsPage /></Lazy> },
      { path: 'accounts', element: <Lazy><AccountsPage /></Lazy> },
      { path: 'recurring', element: <Lazy><RecurringPage /></Lazy> },
      { path: 'goals', element: <Lazy><SavingsGoalsPage /></Lazy> },
      { path: 'balance', element: <Lazy><SettleUpPage /></Lazy> },
      { path: 'stats', element: <Lazy><StatsPage /></Lazy> },
      { path: 'settings', element: <Lazy><SettingsPage /></Lazy> },
      { path: 'more', element: <Lazy><MorePage /></Lazy> },
    ],
  },
])
