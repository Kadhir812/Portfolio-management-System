import { Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PortfoliosPage } from './pages/PortfoliosPage';
import { CreatePortfolioPage } from './pages/CreatePortfolioPage';
import { DashboardPage } from './pages/DashboardPage';
import { ThemeEditorPage } from './pages/ThemeEditorPage';
import { HoldingsPage } from './pages/HoldingsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/portfolios" replace />} />
        <Route path="/portfolios" element={<PortfoliosPage />} />
        <Route path="/portfolios/new" element={<CreatePortfolioPage />} />
        <Route path="/portfolios/:id" element={<DashboardPage />} />
        <Route path="/themes" element={<ThemeEditorPage />} />
        <Route path="/holdings" element={<HoldingsPage />} />
      </Routes>
    </Layout>
  );
}
