import { Route, Routes, Navigate } from 'react-router-dom';
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
import { SecuritiesPage } from './pages/SecuritiesPage';

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
        <Route path="/portfolios/:id" element={<DashboardPage />} />
        <Route path="/themes" element={<ThemeEditorPage />} />
        <Route path="/securities" element={<SecuritiesPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/portfolios/:id/holdings" element={<HoldingsPage />} />
        <Route path="/portfolios/:id/rebalance" element={<RebalancePage />} />
        <Route path="*" element={<Navigate to="/portfolios" replace />} />
      </Routes>
    </Layout>
  );
}
