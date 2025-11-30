const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { auth } = require('../middleware/auth');
const Joi = require('joi');
const { validate } = require('../middleware/validation');

const createNoteSchema = Joi.object({
  title: Joi.string().required().max(200),
  content: Joi.string().required().max(10000),
  tags: Joi.array().items(Joi.string()).optional(),
  category: Joi.string().optional(),
  color: Joi.string().optional(),
  sessionId: Joi.string().optional()
});

const updateNoteSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  content: Joi.string().max(10000).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  category: Joi.string().optional(),
  color: Joi.string().optional(),
  isPinned: Joi.boolean().optional()
});

router.post('/', auth, validate(createNoteSchema), noteController.createNote.bind(noteController));
router.get('/', auth, noteController.getNotes.bind(noteController));
router.get('/tags', auth, noteController.getNoteTags.bind(noteController));
router.get('/:noteId', auth, noteController.getNoteById.bind(noteController));
router.put('/:noteId', auth, validate(updateNoteSchema), noteController.updateNote.bind(noteController));
router.delete('/:noteId', auth, noteController.deleteNote.bind(noteController));

module.exports = router;
