const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const { auth } = require('../middleware/auth');
const Joi = require('joi');
const { validate } = require('../middleware/validation');

const createTodoSchema = Joi.object({
  text: Joi.string().required().max(500),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().optional(),
  category: Joi.string().optional()
});

const updateTodoSchema = Joi.object({
  text: Joi.string().max(500).optional(),
  completed: Joi.boolean().optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().optional(),
  category: Joi.string().optional()
});

const reorderSchema = Joi.object({
  todoIds: Joi.array().items(Joi.string()).required()
});

router.post('/', auth, validate(createTodoSchema), todoController.createTodo.bind(todoController));
router.get('/', auth, todoController.getTodos.bind(todoController));
router.put('/:todoId', auth, validate(updateTodoSchema), todoController.updateTodo.bind(todoController));
router.put('/reorder', auth, validate(reorderSchema), todoController.reorderTodos.bind(todoController));
router.delete('/:todoId', auth, todoController.deleteTodo.bind(todoController));
router.delete('/completed/clear', auth, todoController.clearCompleted.bind(todoController));

module.exports = router;
