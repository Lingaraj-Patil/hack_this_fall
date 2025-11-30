const Joi = require('joi');
const ApiResponse = require('../utils/response');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return ApiResponse.error(res, 'Validation failed', 400, errors);
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  register: Joi.object({
    username: Joi.string().min(3).max(30).alphanum().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createSession: Joi.object({
    tags: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().max(500).optional()
  }),

  updateSession: Joi.object({
    status: Joi.string().valid('active', 'paused', 'completed', 'abandoned'),
    notes: Joi.string().max(500).optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),

  createClan: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().max(300).optional(),
    isPrivate: Joi.boolean().optional(),
    maxMembers: Joi.number().min(2).max(100).optional()
  }),

  visionAnalyze: Joi.object({
    image: Joi.string().required(),
    sessionId: Joi.string().required()
  })
};

module.exports = { validate, schemas };
