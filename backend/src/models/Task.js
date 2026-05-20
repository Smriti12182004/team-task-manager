const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Task title is required' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('To Do', 'In Progress', 'Review', 'Done'),
    allowNull: false,
    defaultValue: 'To Do',
    validate: {
      isIn: {
        args: [['To Do', 'In Progress', 'Review', 'Done']],
        msg: 'Invalid status'
      }
    }
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    allowNull: false,
    defaultValue: 'Medium',
    validate: {
      isIn: {
        args: [['Low', 'Medium', 'High']],
        msg: 'Invalid priority'
      }
    }
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: { msg: 'Invalid due date' }
    }
  }
});

module.exports = Task;
