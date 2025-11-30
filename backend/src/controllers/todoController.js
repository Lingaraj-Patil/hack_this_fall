const Todo = require('../models/Todo');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class TodoController {
  async createTodo(req, res, next) {
    try {
      const { text, priority, dueDate, category } = req.body;

      // Get max order
      const maxOrderTodo = await Todo.findOne({ userId: req.userId, completed: false })
        .sort({ order: -1 })
        .select('order');

      const todo = new Todo({
        userId: req.userId,
        text,
        priority: priority || 'medium',
        dueDate,
        category: category || 'general',
        order: maxOrderTodo ? maxOrderTodo.order + 1 : 0
      });

      await todo.save();

      logger.info(`Todo created: ${todo._id} by user ${req.userId}`);

      return ApiResponse.success(res, todo, 'Todo created', 201);
    } catch (error) {
      next(error);
    }
  }

  async getTodos(req, res, next) {
    try {
      const { completed, category } = req.query;

      const query = { userId: req.userId };
      if (completed !== undefined) {
        query.completed = completed === 'true';
      }
      if (category) {
        query.category = category;
      }

      const todos = await Todo.find(query).sort({ order: 1, createdAt: -1 });

      return ApiResponse.success(res, todos);
    } catch (error) {
      next(error);
    }
  }

  async updateTodo(req, res, next) {
    try {
      const { todoId } = req.params;
      const { text, completed, priority, dueDate, category } = req.body;

      const todo = await Todo.findOne({ _id: todoId, userId: req.userId });

      if (!todo) {
        return ApiResponse.error(res, 'Todo not found', 404);
      }

      if (text !== undefined) todo.text = text;
      if (completed !== undefined) {
        todo.completed = completed;
        if (completed) {
          todo.completedAt = new Date();
        }
      }
      if (priority !== undefined) todo.priority = priority;
      if (dueDate !== undefined) todo.dueDate = dueDate;
      if (category !== undefined) todo.category = category;

      await todo.save();

      // Emit via socket
      if (global.io) {
        global.io.to(`user:${req.userId}`).emit('todo:updated', todo);
      }

      return ApiResponse.success(res, todo, 'Todo updated');
    } catch (error) {
      next(error);
    }
  }

  async reorderTodos(req, res, next) {
    try {
      const { todoIds } = req.body; // Array of todo IDs in new order

      const updatePromises = todoIds.map((id, index) => 
        Todo.findOneAndUpdate(
          { _id: id, userId: req.userId },
          { order: index },
          { new: true }
        )
      );

      await Promise.all(updatePromises);

      return ApiResponse.success(res, null, 'Todos reordered');
    } catch (error) {
      next(error);
    }
  }

  async deleteTodo(req, res, next) {
    try {
      const { todoId } = req.params;

      const todo = await Todo.findOneAndDelete({
        _id: todoId,
        userId: req.userId
      });

      if (!todo) {
        return ApiResponse.error(res, 'Todo not found', 404);
      }

      return ApiResponse.success(res, null, 'Todo deleted');
    } catch (error) {
      next(error);
    }
  }

  async clearCompleted(req, res, next) {
    try {
      const result = await Todo.deleteMany({
        userId: req.userId,
        completed: true
      });

      return ApiResponse.success(res, { deletedCount: result.deletedCount }, 'Completed todos cleared');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TodoController();
