import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Layers, 
  Calendar, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const Dashboard = ({ setActiveTab }) => {
  const { user, apiCall } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/tasks/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent-blue)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  const { totalTasks, statusCounts, priorityCounts, overdueTasks } = stats || {
    totalTasks: 0,
    statusCounts: { 'To Do': 0, 'In Progress': 0, 'Review': 0, 'Done': 0 },
    priorityCounts: { 'Low': 0, 'Medium': 0, 'High': 0 },
    overdueTasks: []
  };

  // Safe percentage calculation helper
  const getPercentage = (value) => {
    if (totalTasks === 0) return 0;
    return Math.round((value / totalTasks) * 100);
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-title">
          <p>WELCOME BACK, {user?.name.toUpperCase()}</p>
          <h1>Dashboard Overview</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab('kanban')}>
          View Board <ArrowRight size={16} />
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-card" style={{ '--stat-color': 'var(--accent-blue)' }}>
          <div className="stat-info">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{totalTasks}</span>
          </div>
          <div className="stat-icon-wrapper">
            <Layers size={24} />
          </div>
        </div>

        <div className="stat-card glass-card" style={{ '--stat-color': 'var(--accent-cyan)' }}>
          <div className="stat-info">
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{statusCounts['In Progress']}</span>
          </div>
          <div className="stat-icon-wrapper">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="stat-card glass-card" style={{ '--stat-color': 'var(--accent-rose)' }}>
          <div className="stat-info">
            <span className="stat-label">Overdue</span>
            <span className="stat-value">{overdueTasks.length}</span>
          </div>
          <div className="stat-icon-wrapper" style={{ color: 'var(--accent-rose)' }}>
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="stat-card glass-card" style={{ '--stat-color': 'var(--accent-emerald)' }}>
          <div className="stat-info">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{statusCounts['Done']}</span>
          </div>
          <div className="stat-icon-wrapper">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Main Panels */}
      <div className="dashboard-panels">
        {/* Overdue Task Panel */}
        <div className="panel-card glass-card">
          <div className="panel-header">
            <h3>
              <Clock size={20} style={{ color: 'var(--accent-rose)' }} />
              Attention Required ({overdueTasks.length})
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Overdue Tasks</span>
          </div>

          <div className="overdue-list">
            {overdueTasks.length > 0 ? (
              overdueTasks.map(task => (
                <div key={task.id} className="overdue-item">
                  <div className="overdue-details">
                    <span className="overdue-title">{task.title}</span>
                    <div className="overdue-meta">
                      <span>Project: <strong>{task.Project?.name}</strong></span>
                      {task.Assignee && <span>Assignee: <strong>{task.Assignee.name}</strong></span>}
                    </div>
                  </div>
                  <div className="overdue-badge">
                    <Calendar size={14} />
                    <span>{task.dueDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-overdue-tasks">
                <CheckCircle size={48} style={{ color: 'var(--accent-emerald)', opacity: 0.8 }} />
                <p>Excellent! You have no overdue tasks.</p>
              </div>
            )}
          </div>
        </div>

        {/* Priority and Distribution panel */}
        <div className="panel-card glass-card">
          <div className="panel-header">
            <h3>
              <BarChart2 size={20} style={{ color: 'var(--accent-purple)' }} />
              Task Breakdown
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Priority Share</span>
          </div>

          <div className="priority-list">
            <div className="priority-stat-row">
              <div className="priority-label-row">
                <span style={{ color: 'var(--accent-rose)' }}>High Priority</span>
                <span>{priorityCounts['High']} tasks ({getPercentage(priorityCounts['High'])}%)</span>
              </div>
              <div className="priority-bar-bg">
                <div className="priority-bar-fill" style={{ width: `${getPercentage(priorityCounts['High'])}%`, backgroundColor: 'var(--priority-high)' }}></div>
              </div>
            </div>

            <div className="priority-stat-row">
              <div className="priority-label-row">
                <span style={{ color: 'var(--accent-amber)' }}>Medium Priority</span>
                <span>{priorityCounts['Medium']} tasks ({getPercentage(priorityCounts['Medium'])}%)</span>
              </div>
              <div className="priority-bar-bg">
                <div className="priority-bar-fill" style={{ width: `${getPercentage(priorityCounts['Medium'])}%`, backgroundColor: 'var(--priority-medium)' }}></div>
              </div>
            </div>

            <div className="priority-stat-row">
              <div className="priority-label-row">
                <span style={{ color: 'var(--accent-emerald)' }}>Low Priority</span>
                <span>{priorityCounts['Low']} tasks ({getPercentage(priorityCounts['Low'])}%)</span>
              </div>
              <div className="priority-bar-bg">
                <div className="priority-bar-fill" style={{ width: `${getPercentage(priorityCounts['Low'])}%`, backgroundColor: 'var(--priority-low)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
