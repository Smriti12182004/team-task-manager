const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Task = require('./Task');

// User <-> Project (Creator)
Project.belongsTo(User, { as: 'Creator', foreignKey: 'creatorId' });
User.hasMany(Project, { foreignKey: 'creatorId', as: 'CreatedProjects' });

// User <-> Project (Many-to-Many via ProjectMember)
Project.belongsToMany(User, { through: ProjectMember, as: 'Members', foreignKey: 'projectId' });
User.belongsToMany(Project, { through: ProjectMember, as: 'Projects', foreignKey: 'userId' });

// ProjectMember associations so we can query them directly if needed
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId' });
Project.hasMany(ProjectMember, { foreignKey: 'projectId', onDelete: 'CASCADE' });
User.hasMany(ProjectMember, { foreignKey: 'userId', onDelete: 'CASCADE' });

// Task <-> Project
Task.belongsTo(Project, { foreignKey: 'projectId' });
Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });

// Task <-> User (Assignee)
Task.belongsTo(User, { as: 'Assignee', foreignKey: 'assigneeId' });
User.hasMany(Task, { foreignKey: 'assigneeId' });

// Task <-> User (Creator)
Task.belongsTo(User, { as: 'Creator', foreignKey: 'creatorId' });
User.hasMany(Task, { foreignKey: 'creatorId', as: 'CreatedTasks' });

module.exports = {
  sequelize,
  User,
  Project,
  ProjectMember,
  Task
};
