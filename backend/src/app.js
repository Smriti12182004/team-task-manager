const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, User, Project, ProjectMember, Task } = require('./models');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Team Task Manager API is running...');
});

// Database sync and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Sync database (force: false, alter: true/false)
    await sequelize.sync();
    console.log('Database synchronized.');

    // Seed dummy data if database is empty
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to database or start server:', error);
  }
};

const seedDatabase = async () => {
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('No users found. Seeding default accounts...');
      
      // Create Admin
      const admin = await User.create({
        name: 'Alex Admin',
        email: 'admin@taskmanager.com',
        password: 'password123',
        role: 'Admin'
      });

      // Create Members
      const member1 = await User.create({
        name: 'Jordan Member',
        email: 'member1@taskmanager.com',
        password: 'password123',
        role: 'Member'
      });

      const member2 = await User.create({
        name: 'Taylor Member',
        email: 'member2@taskmanager.com',
        password: 'password123',
        role: 'Member'
      });

      // Create a default Project
      const project = await Project.create({
        name: 'Apollo Website Launch',
        description: 'Redesign and launch the Apollo project corporate landing page with new marketing graphics.',
        creatorId: admin.id
      });

      // Add members to the project
      await ProjectMember.create({ projectId: project.id, userId: admin.id });
      await ProjectMember.create({ projectId: project.id, userId: member1.id });
      await ProjectMember.create({ projectId: project.id, userId: member2.id });

      // Create default Tasks
      await Task.create({
        title: 'Design Hero Section Layout',
        description: 'Draft wireframes and high-fidelity visual mockups for the landing page hero module.',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days in future
        assigneeId: member1.id,
        projectId: project.id,
        creatorId: admin.id
      });

      await Task.create({
        title: 'Draft Marketing Copy',
        description: 'Write copy for key section headers, feature grids, and call-to-action buttons.',
        status: 'To Do',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days in future
        assigneeId: member2.id,
        projectId: project.id,
        creatorId: admin.id
      });

      await Task.create({
        title: 'Setup Domain & Hosting Configuration',
        description: 'Purchase domains, provision DNS records, and configure SSL certificates on deployment servers.',
        status: 'Review',
        priority: 'Low',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day in past (Overdue!)
        assigneeId: member1.id,
        projectId: project.id,
        creatorId: admin.id
      });

      await Task.create({
        title: 'Audit Existing Content Assets',
        description: 'Review obsolete documentation and select assets to migate to the new site.',
        status: 'Done',
        priority: 'Low',
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days in past (Completed)
        assigneeId: member2.id,
        projectId: project.id,
        creatorId: admin.id
      });

      console.log('Database seeded successfully.');
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
};

startServer();
