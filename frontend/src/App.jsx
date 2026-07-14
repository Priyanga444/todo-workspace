import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import CalendarView from './pages/CalendarView';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Reminders from './pages/Reminders';
import Notes from './pages/Notes';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AddProjectModal from './components/AddProjectModal';

const DashboardLayout = ({ children }) => {
  const { user, loading } = useApp();
  const navigate = useNavigate();
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400 font-bold text-sm">
        Scaffolding Workspace...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex bg-[var(--bg-color)] text-[var(--text-color)] min-h-screen overflow-hidden relative transition-colors duration-300">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onOpenAddProject={() => setIsAddProjectOpen(true)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onOpenMenu={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-[var(--bg-color)] transition-colors duration-300">
          {children}
        </main>
      </div>

      <AddProjectModal 
        isOpen={isAddProjectOpen} 
        onClose={() => setIsAddProjectOpen(false)} 
      />
    </div>
  );
};

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/dashboard" element={
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      } />
      
      <Route path="/board" element={
        <DashboardLayout>
          <Board />
        </DashboardLayout>
      } />
      
      <Route path="/calendar" element={
        <DashboardLayout>
          <CalendarView />
        </DashboardLayout>
      } />

      <Route path="/timeline" element={
        <DashboardLayout>
          <CalendarView />
        </DashboardLayout>
      } />
      
      <Route path="/analytics" element={
        <DashboardLayout>
          <Analytics />
        </DashboardLayout>
      } />
      
      <Route path="/reminders" element={
        <DashboardLayout>
          <Reminders />
        </DashboardLayout>
      } />
      
      <Route path="/profile" element={
        <DashboardLayout>
          <Profile />
        </DashboardLayout>
      } />
      
      <Route path="/notes" element={
        <DashboardLayout>
          <Notes />
        </DashboardLayout>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
