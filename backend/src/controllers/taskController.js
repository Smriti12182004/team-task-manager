const { Task, Project, User, ProjectMember } = require('../models');
const { Op } = require('sequelize');

// Create a new task (Admin only)
exports.createTask = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can create tasks' });
    }

    const { title, description, status, priority, dueDate, assigneeId, projectId } = req.body;

    // Validate project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // If assignee is provided, validate assignee exists and is a member of the project
    if (assigneeId) {
      const isMember = await ProjectMember.findOne({
        where: { projectId, userId: assigneeId }
      });
      if (!isMember) {
        return res.status(400).json({ error: 'Assignee must be a member of the project' });
      }
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'To Do',
      priority: priority || 'Medium',
      dueDate,
      assigneeId: assigneeId || null,
      projectId,
      creatorId: req.user.id
    });

    // Return task with assignee pre-loaded
    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'name', 'email'] },
        { model: Project, attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json(fullTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a task (Admin can update everything; Member can update status if they are the assignee)
exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Role-based authorization check
    if (req.user.role === 'Admin') {
      // Admins can update any field
      if (assigneeId !== undefined) {
        if (assigneeId) {
          // Verify new assignee is in the project
          const isMember = await ProjectMember.findOne({
            where: { projectId: task.projectId, userId: assigneeId }
          });
          if (!isMember) {
            return res.status(400).json({ error: 'Assignee must be a member of the project' });
          }
          task.assigneeId = assigneeId;
        } else {
          task.assigneeId = null;
        }
      }

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;

    } else {
      // Member can only update STATUS of a task ASSIGNED to them
      if (task.assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      }

      // Ensure they aren't trying to change other fields
      if (title || description || priority || dueDate || assigneeId) {
        return res.status(403).json({ error: 'Members can only update task status' });
      }

      if (status !== undefined) {
        task.status = status;
      }
    }

    await task.save();

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'name', 'email'] },
        { model: Project, attributes: ['id', 'name'] }
      ]
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete task (Admin only)
exports.deleteTask = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can delete tasks' });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.destroy();
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    let tasks;

    if (req.user.role === 'Admin') {
      // Admins see stats for all tasks
      tasks = await Task.findAll({
        include: [
          { model: Project, attributes: ['id', 'name'] },
          { model: User, as: 'Assignee', attributes: ['id', 'name'] }
        ]
      });
    } else {
      // Members see stats only for tasks assigned to them
      tasks = await Task.findAll({
        where: { assigneeId: req.user.id },
        include: [
          { model: Project, attributes: ['id', 'name'] },
          { model: User, as: 'Assignee', attributes: ['id', 'name'] }
        ]
      });
    }

    // Compute metrics
    const totalTasks = tasks.length;
    const statusCounts = { 'To Do': 0, 'In Progress': 0, 'Review': 0, 'Done': 0 };
    const priorityCounts = { 'Low': 0, 'Medium': 0, 'High': 0 };
    const overdueTasks = [];

    tasks.forEach(task => {
      if (statusCounts[task.status] !== undefined) statusCounts[task.status]++;
      if (priorityCounts[task.priority] !== undefined) priorityCounts[task.priority]++;

      // Check if overdue: not Done and due date is in the past
      if (task.status !== 'Done' && task.dueDate && task.dueDate < todayStr) {
        overdueTasks.push(task);
      }
    });

    res.status(200).json({
      totalTasks,
      statusCounts,
      priorityCounts,
      overdueTasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
