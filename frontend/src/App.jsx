import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import ProjectManager from './components/ProjectManager';
import { 
  LayoutDashboard, 
  Trello, 
  FolderKanban, 
  LogOut, 
  ClipboardList 
} from 'lucide-react';

const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: 'var(--bg-primary)',
        color: '#fff'
      }}>
        <div style={{ 
          border: '4px solid rgba(255,255,255,0.1)', 
          borderTop: '4px solid var(--accent-blue)', 
          borderRadius: '50%', 
          width: '50px', 
          height: '50px', 
          animation: 'spin 1s linear infinite' 
        }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If not authenticated, render Login/Signup Form
  if (!user) {
    return <AuthForm />;
  }

  // Navigation tabs helper
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'projects':
        return <ProjectManager />;
      case 'kanban':
        return <KanbanBoard />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Decorative Glows */}
      <div className="background-glow glow-top-right"></div>
      <div className="background-glow glow-bottom-left"></div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', width: '32px', height: '32px' }}>
            <ClipboardList size={18} />
          </div>
          <span className="logo-text">TaskSync</span>
        </div>

        <ul className="nav-links">
          <li>
            <div 
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </div>
          </li>
          <li>
            <div 
              className={`nav-link ${activeTab === 'kanban' ? 'active' : ''}`}
              onClick={() => setActiveTab('kanban')}
            >
              <Trello size={20} />
              <span>Kanban Board</span>
            </div>
          </li>
          <li>
            <div 
              className={`nav-link ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <FolderKanban size={20} />
              <span>Projects</span>
            </div>
          </li>
        </ul>

        {/* User profile footer */}
        <div className="user-profile-section">
          <div className="user-profile-info">
            <div className="avatar">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="user-details">
              <div className="user-name" title={user.name}>{user.name}</div>
              <span className={`user-role-badge ${user.role === 'Admin' ? 'role-admin' : 'role-member'}`}>
                {user.role}
              </span>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-danger" 
            onClick={logout}
            style={{ width: '100%', marginTop: '8px' }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
