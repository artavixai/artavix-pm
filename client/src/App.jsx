import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import Gantt from './pages/Gantt';
import Meetings from './pages/Meetings';
import Notes from './pages/Notes';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Monitoring from './pages/Monitoring';
import WeeklyPlanning from './pages/WeeklyPlanning';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen font-semibold text-slate-600">Loading Artavix PM...</div>;
  }

  return (
    <>
      <div dir="ltr">
        <Toaster
          position="top-right"
          reverseOrder={false}
          containerStyle={{
            top: 24,
            right: 24,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              direction: 'ltr',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            },
          }}
        />
      </div>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            <Route path="projects/:projectId/tasks" element={<Tasks />} />
            <Route path="gantt" element={<Gantt />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="notes" element={<Notes />} />
            <Route path="settings" element={<Settings />} />
            <Route path="weekly-planning" element={<WeeklyPlanning />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;