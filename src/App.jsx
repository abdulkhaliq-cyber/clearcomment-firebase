import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login/Login';
import AnalyticsPage from './pages/dashboard/analytics/AnalyticsPage';
import CommentsPage from './pages/dashboard/comments/CommentsPage';
import RulesPage from './pages/dashboard/rules/RulesPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/analytics" replace />} />
        <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
        <Route path="/dashboard/comments" element={<CommentsPage />} />
        <Route path="/dashboard/rules" element={<RulesPage />} />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

