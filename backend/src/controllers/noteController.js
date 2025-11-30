const Note = require('../models/Note');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class NoteController {
  async createNote(req, res, next) {
    try {
      const { title, content, tags, category, color, sessionId } = req.body;

      const note = new Note({
        userId: req.userId,
        title,
        content,
        tags: tags || [],
        category: category || 'general',
        color: color || '#ffffff',
        sessionId
      });

      await note.save();

      logger.info(`Note created: ${note._id} by user ${req.userId}`);

      return ApiResponse.success(res, note, 'Note created', 201);
    } catch (error) {
      next(error);
    }
  }

  async getNotes(req, res, next) {
    try {
      const { category, tag, search, page = 1, limit = 20 } = req.query;

      const query = { userId: req.userId };
      
      if (category) {
        query.category = category;
      }
      if (tag) {
        query.tags = tag;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ];
      }

      const notes = await Note.find(query)
        .sort({ isPinned: -1, updatedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('sessionId', 'startTime duration');

      const total = await Note.countDocuments(query);

      return ApiResponse.paginated(res, notes, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  async getNoteById(req, res, next) {
    try {
      const { noteId } = req.params;

      const note = await Note.findOne({
        _id: noteId,
        userId: req.userId
      }).populate('sessionId');

      if (!note) {
        return ApiResponse.error(res, 'Note not found', 404);
      }

      return ApiResponse.success(res, note);
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req, res, next) {
    try {
      const { noteId } = req.params;
      const { title, content, tags, category, color, isPinned } = req.body;

      const note = await Note.findOne({
        _id: noteId,
        userId: req.userId
      });

      if (!note) {
        return ApiResponse.error(res, 'Note not found', 404);
      }

      if (title !== undefined) note.title = title;
      if (content !== undefined) note.content = content;
      if (tags !== undefined) note.tags = tags;
      if (category !== undefined) note.category = category;
      if (color !== undefined) note.color = color;
      if (isPinned !== undefined) note.isPinned = isPinned;

      await note.save();

      return ApiResponse.success(res, note, 'Note updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req, res, next) {
    try {
      const { noteId } = req.params;

      const note = await Note.findOneAndDelete({
        _id: noteId,
        userId: req.userId
      });

      if (!note) {
        return ApiResponse.error(res, 'Note not found', 404);
      }

      return ApiResponse.success(res, null, 'Note deleted');
    } catch (error) {
      next(error);
    }
  }

  async getNoteTags(req, res, next) {
    try {
      const tags = await Note.distinct('tags', { userId: req.userId });

      return ApiResponse.success(res, tags);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NoteController();
