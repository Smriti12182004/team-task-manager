import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TaskForm from './TaskForm';
import { Plus, Trash2, Calendar, User, Edit2, AlertTriangle, Layers } from 'lucide-react';

const KanbanBoard = () => {
  const { user, apiCall } = useAuth();
  
  // State
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectDetails, setProjectDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Task form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const isAdmin = user?.role === 'Admin';
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const projectList = await apiCall('/api/projects');
      setProjects(projectList);
      
      if (projectList.length > 0) {
        // Default to first project
        setSelectedProjectId(projectList[0].id.toString());
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load projects.');
      setLoading(false);
    }
  };

  const fetchProjectDetails = async () => {
    if (!selectedProjectId) return;
    try {
      setLoading(true);
      setError('');
      const details = await apiCall(`/api/projects/${selectedProjectId}`);
      setProjectDetails(details);
    } catch (err) {
      console.error(err);
      setError('Failed to load project tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchProjectDetails();
  }, [selectedProjectId]);

  // Task creation/update
  const handleTaskSubmit = async (taskData) => {
    try {
      if (editingTask) {
        // Update task
        await apiCall(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          body: JSON.stringify(taskData)
        });
      } else {
        // Create task
        await apiCall('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({
            ...taskData,
            projectId: parseInt(selectedProjectId)
          })
        });
      }
      setIsModalOpen(false);
      setEditingTask(null);
      await fetchProjectDetails();
    } catch (err) {
      alert(err.message || 'Failed to save task.');
    }
  };

  const handleEditClick = (task) => {
    if (!isAdmin) return;
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await apiCall(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      await fetchProjectDetails();
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;
    
    const taskId = parseInt(taskIdStr);
    const taskObj = projectDetails?.Tasks?.find(t => t.id === taskId);
    
    if (!taskObj) return;
    if (taskObj.status === targetStatus) return;

    try {
      // Members can only change status of tasks assigned to them
      if (!isAdmin && taskObj.assigneeId !== user.id) {
        alert('You can only update tasks assigned to you.');
        return;
      }

      await apiCall(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus })
      });

      await fetchProjectDetails();
    } catch (err) {
      alert(err.message || 'Failed to update task status.');
    }
  };

  const handleStatusChangeDropdown = async (taskObj, targetStatus) => {
    try {
      await apiCall(`/api/tasks/${taskObj.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus })
      });
      await fetchProjectDetails();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  // Helper to split tasks by status
  const getTasksByStatus = (status) => {
    return projectDetails?.Tasks?.filter(t => t.status === status) || [];
  };

  // Column definitions
  const columns = [
    { title: 'To Do', status: 'To Do', color: 'var(--status-todo)' },
    { title: 'In Progress', status: 'In Progress', color: 'var(--status-inprogress)' },
    { title: 'Review', status: 'Review', color: 'var(--status-review)' },
    { title: 'Done', status: 'Done', color: 'var(--status-done)' }
  ];

  if (loading && !projectDetails) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent-blue)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className="kanban-board-container animate-fade">
      <div className="page-header">
        <div className="page-title">
          <p>TASK MANAGEMENT</p>
          <h1>Project Kanban Board</h1>
        </div>
        {isAdmin && selectedProjectId && (
          <button className="btn btn-primary" onClick={() => { setEditingTask(null); setIsModalOpen(true); }}>
            <Plus size={16} /> Add Task
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Project Selector controls */}
      <div className="project-controls">
        <select 
          className="project-select" 
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          disabled={projects.length === 0}
        >
          {projects.length > 0 ? (
            projects.map(proj => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))
          ) : (
            <option value="">No Projects Found</option>
          )}
        </select>
      </div>

      {projects.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Layers size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3>No Projects Available</h3>
          <p style={{ marginTop: '8px' }}>
            {isAdmin 
              ? 'Please create a project in the Project Management section first.' 
              : 'You are not assigned to any projects. Contact your administrator.'}
          </p>
        </div>
      ) : (
        <div className="kanban-columns">
          {columns.map(col => {
            const tasks = getTasksByStatus(col.status);
            return (
              <div 
                key={col.status} 
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.status)}
                style={{ '--column-color': col.color }}
              >
                <div className="column-header">
                  <div className="column-title-wrap">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }}></div>
                    <span className="column-title">{col.title}</span>
                  </div>
                  <span className="column-count">{tasks.length}</span>
                </div>

                <div className="task-list-container">
                  {tasks.map(task => {
                    const isOverdue = task.status !== 'Done' && task.dueDate && task.dueDate < todayStr;
                    const canUserModify = isAdmin || task.assigneeId === user?.id;

                    return (
                      <div 
                        key={task.id} 
                        className="task-card glass-card animate-slide"
                        draggable={canUserModify}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        style={{ 
                          borderLeft: `3px solid ${col.color}`,
                          opacity: canUserModify ? 1 : 0.85
                        }}
                      >
                        <div className="task-header">
                          <span className="task-title">{task.title}</span>
                          
                          {/* Admin Edit/Delete actions */}
                          {isAdmin && (
                            <div className="task-actions">
                              <button className="action-btn" onClick={() => handleEditClick(task)}>
                                <Edit2 size={12} />
                              </button>
                              <button className="action-btn delete" onClick={() => handleDeleteTask(task.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        {task.description && (
                          <p className="task-desc">{task.description}</p>
                        )}

                        <div className="task-badges">
                          <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                          
                          {task.dueDate && (
                            <span className={`task-due-date ${isOverdue ? 'overdue' : ''}`}>
                              <Calendar size={12} />
                              {isOverdue && <AlertTriangle size={10} />}
                              {task.dueDate}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          {/* Assignee display */}
                          <div className="task-assignee">
                            {task.Assignee ? (
                              <>
                                <div className="task-assignee-avatar">
                                  {task.Assignee.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span style={{ fontSize: '11px' }}>{task.Assignee.name}</span>
                              </>
                            ) : (
                              <>
                                <div className="task-assignee-avatar" style={{ border: '1px dashed rgba(255,255,255,0.2)', background: 'none' }}>
                                  <User size={10} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unassigned</span>
                              </>
                            )}
                          </div>

                          {/* Member Status Dropdown Selector */}
                          {!isAdmin && task.assigneeId === user?.id && (
                            <select 
                              className="quick-status-select"
                              value={task.status}
                              onChange={(e) => handleStatusChangeDropdown(task, e.target.value)}
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Review">Review</option>
                              <option value="Done">Done</option>
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      {isModalOpen && (
        <TaskForm
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
          onSubmit={handleTaskSubmit}
          task={editingTask}
          projectMembers={projectDetails?.Members || []}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
