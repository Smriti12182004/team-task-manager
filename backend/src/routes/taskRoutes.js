const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

router.get('/dashboard/stats', auth, taskController.getDashboardStats);
router.post('/', auth, requireAdmin, taskController.createTask);
router.put('/:id', auth, taskController.updateTask);
router.delete('/:id', auth, requireAdmin, taskController.deleteTask);

module.exports = router;
