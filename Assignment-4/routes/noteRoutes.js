const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getAllNotesAdmin,
} = require('../controllers/noteController');

const router = express.Router();

// Every notes route requires a valid JWT
router.use(protect);

// Admin-only route (declared before '/:id' so it is not captured as an ID)
router.get('/admin/all', authorize('admin'), getAllNotesAdmin);

router.route('/')
  .post(createNote)
  .get(getNotes);

router.route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

module.exports = router;
