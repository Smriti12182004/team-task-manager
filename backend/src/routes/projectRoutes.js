const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

router.get('/', auth, projectController.getAllProjects);
router.get('/:id', auth, projectController.getProjectById);
router.post('/', auth, requireAdmin, projectController.createProject);
router.delete('/:id', auth, requireAdmin, projectController.deleteProject);

router.post('/members', auth, requireAdmin, projectController.addProjectMember);
router.delete('/members/:projectId/:userId', auth, requireAdmin, projectController.removeProjectMember);

module.exports = router;
