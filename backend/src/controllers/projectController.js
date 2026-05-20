const { Project, User, ProjectMember, Task } = require('../models');

// Create a new project (Admin only)
exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can create projects' });
    }

    const project = await Project.create({
      name,
      description,
      creatorId: req.user.id
    });

    // Automatically add the creator as a project member
    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all projects for the logged-in user
exports.getAllProjects = async (req, res) => {
  try {
    let projects;
    
    if (req.user.role === 'Admin') {
      // Admins see all projects
      projects = await Project.findAll({
        include: [
          { model: User, as: 'Creator', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'Members', attributes: ['id', 'name', 'email'] }
        ]
      });
    } else {
      // Members see only projects they belong to
      projects = await Project.findAll({
        include: [
          {
            model: User,
            as: 'Members',
            attributes: ['id', 'name', 'email'],
            where: { id: req.user.id }
          },
          { model: User, as: 'Creator', attributes: ['id', 'name', 'email'] }
        ]
      });

      // Refetch the projects fully with ALL members included, since the previous query filtered members to just the current user
      const projectIds = projects.map(p => p.id);
      projects = await Project.findAll({
        where: { id: projectIds },
        include: [
          { model: User, as: 'Creator', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'Members', attributes: ['id', 'name', 'email'] }
        ]
      });
    }

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'Members', attributes: ['id', 'name', 'email'] },
        { model: Task, include: [{ model: User, as: 'Assignee', attributes: ['id', 'name'] }] }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions: member must belong to project, or be Admin
    if (req.user.role !== 'Admin') {
      const isMember = project.Members.some(m => m.id === req.user.id);
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a project (Admin only)
exports.deleteProject = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can delete projects' });
    }

    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.destroy();
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a member to a project (Admin only)
exports.addProjectMember = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can manage members' });
    }

    const { projectId, userId } = req.body;
    
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already a member
    const existingMember = await ProjectMember.findOne({
      where: { projectId, userId }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    await ProjectMember.create({ projectId, userId });
    res.status(200).json({ message: 'Member added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove a member from a project (Admin only)
exports.removeProjectMember = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can manage members' });
    }

    const { projectId, userId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const member = await ProjectMember.findOne({
      where: { projectId, userId }
    });

    if (!member) {
      return res.status(404).json({ error: 'User is not a member of this project' });
    }

    // Creator should probably not be removed, but we can allow it unless they are the creatorId
    if (project.creatorId === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot remove the project creator' });
    }

    await member.destroy();
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
