import { Link, Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PortfoliosPage } from './pages/PortfoliosPage';
import { CreatePortfolioPage } from './pages/CreatePortfolioPage';
import { DashboardPage } from './pages/DashboardPage';
import { ThemeEditorPage } from './pages/ThemeEditorPage';
import { HoldingsPage } from './pages/HoldingsPage';
import { RebalancePage } from './pages/RebalancePage';
import { AlertsPage } from './pages/AlertsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<ProtectedApp />} />
    </Routes>
  );
}

function ProtectedApp() {
  if (!localStorage.getItem('portfolio_token')) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/portfolios" replace />} />
        <Route path="/portfolios" element={<PortfoliosPage />} />
        <Route path="/portfolios/new" element={<CreatePortfolioPage />} />
        <Route path="/portfolios/:id/edit" element={<CreatePortfolioPage />} />
        <Route path="/portfolios/overview" element={<DashboardAccessNotice />} />
        <Route path="/portfolios/:id" element={<DashboardPage />} />
        <Route path="/themes" element={<ThemeEditorPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/portfolios/:id/holdings" element={<HoldingsPage />} />
        <Route path="/portfolios/:id/rebalance" element={<RebalancePage />} />
        <Route path="*" element={<Navigate to="/portfolios" replace />} />
      </Routes>
    </Layout>
  );
}

function DashboardAccessNotice() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Dashboard access</p>
      <h2 className="mt-2 text-2xl font-semibold">Choose a portfolio first</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Each portfolio has its own dashboard. Open a portfolio from the list to view its specific dashboard and live data.
      </p>
      <Link to="/portfolios" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
        View portfolios
      </Link>
    </div>
  );
}
