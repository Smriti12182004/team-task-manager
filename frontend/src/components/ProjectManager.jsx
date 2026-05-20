import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Users, UserPlus, Folder, X, UserMinus } from 'lucide-react';

const ProjectManager = () => {
  const { user, apiCall } = useAuth();
  
  // State
  const [projects, setProjects] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals / forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  // Form add member
  const [memberToInvite, setMemberToInvite] = useState('');

  const isAdmin = user?.role === 'Admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load projects
      const projectList = await apiCall('/api/projects');
      setProjects(projectList);

      // Load all system users if Admin (for inviting to projects)
      if (isAdmin) {
        const userList = await apiCall('/api/users');
        setSystemUsers(userList);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch project data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      const newProject = await apiCall('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectName,
          description: projectDesc
        })
      });

      // Refetch
      await fetchData();
      
      // Reset form
      setProjectName('');
      setProjectDesc('');
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message || 'Failed to create project.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will be permanently deleted.')) return;

    try {
      await apiCall(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      
      // Reset selected view if active
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }

      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete project.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberToInvite) return;

    try {
      await apiCall('/api/projects/members', {
        method: 'POST',
        body: JSON.stringify({
          projectId: selectedProjectId,
          userId: parseInt(memberToInvite)
        })
      });

      setMemberToInvite('');
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to add project member.');
    }
  };

  const handleRemoveMember = async (projectId, memberId) => {
    if (!window.confirm('Remove this member from the project?')) return;

    try {
      await apiCall(`/api/projects/members/${projectId}/${memberId}`, {
        method: 'DELETE'
      });
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  // Find active selected project details
  const activeProject = projects.find(p => p.id === selectedProjectId);

  if (loading && projects.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent-blue)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-title">
          <p>WORKSPACE PROJECTS</p>
          <h1>Project & Team Management</h1>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create Project
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: selectedProjectId ? '1fr 1fr' : '1fr', gap: '32px', alignItems: 'start' }}>
        {/* Project Cards List */}
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Folder size={20} /> Active Projects ({projects.length})
          </h2>
          
          <div className="projects-grid" style={{ gridTemplateColumns: selectedProjectId ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {projects.length > 0 ? (
              projects.map(project => (
                <div 
                  key={project.id} 
                  className={`project-card glass-card ${selectedProjectId === project.id ? 'active-project-card' : ''}`}
                  onClick={() => setSelectedProjectId(project.id === selectedProjectId ? null : project.id)}
                  style={{ 
                    cursor: 'pointer',
                    borderColor: selectedProjectId === project.id ? 'var(--accent-blue)' : 'var(--border-color)',
                    boxShadow: selectedProjectId === project.id ? 'var(--shadow-glow-blue)' : 'var(--shadow-card)'
                  }}
                >
                  <div className="project-card-header">
                    <span className="project-card-title">{project.name}</span>
                    {isAdmin && (
                      <button 
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="project-card-desc">{project.description || 'No description provided.'}</p>
                  
                  <div className="project-meta-footer">
                    <span className="project-members-count">
                      <Users size={14} />
                      {project.Members?.length || 0} members
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Creator: {project.Creator?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No projects found. {isAdmin ? 'Click "Create Project" to get started.' : 'You have not been added to any projects yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Selected Project Member Management (Right Panel) */}
        {selectedProjectId && activeProject && (
          <div className="panel-card glass-card animate-slide" style={{ minHeight: 'auto' }}>
            <div className="panel-header">
              <h3>
                <Users size={20} style={{ color: 'var(--accent-cyan)' }} />
                Team Assignment: {activeProject.name}
              </h3>
              <button className="modal-close" onClick={() => setSelectedProjectId(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Invite New Member (Admin only) */}
            {isAdmin && (
              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                <div className="form-group" style={{ flexGrow: 1, marginBottom: 0 }}>
                  <label>Select Team Member</label>
                  <select 
                    className="input-field" 
                    value={memberToInvite} 
                    onChange={(e) => setMemberToInvite(e.target.value)}
                    required
                  >
                    <option value="">-- Choose User --</option>
                    {systemUsers
                      .filter(u => !activeProject.Members.some(m => m.id === u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '45px', padding: '0 16px' }}>
                  <UserPlus size={16} /> Add
                </button>
              </form>
            )}

            {/* Current Project Members */}
            <div className="member-manager-section">
              <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                ASSIGNED TEAM ({activeProject.Members.length})
              </h4>
              <div className="member-list">
                {activeProject.Members.map(member => (
                  <div key={member.id} className="member-row">
                    <div className="member-info">
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{member.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{member.email}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`user-role-badge ${member.id === activeProject.creatorId ? 'role-admin' : 'role-member'}`} style={{ fontSize: '10px' }}>
                        {member.id === activeProject.creatorId ? 'Project Owner' : 'Member'}
                      </span>
                      {isAdmin && member.id !== activeProject.creatorId && (
                        <button 
                          className="action-btn delete"
                          onClick={() => handleRemoveMember(activeProject.id, member.id)}
                          title="Remove user from project"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Project Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Apollo Design Launch" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="input-field" 
                  rows={4}
                  placeholder="Summarize objectives, goals and scopes..." 
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
