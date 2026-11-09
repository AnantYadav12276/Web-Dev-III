const mongoose = require('mongoose');
const Note = require('../models/Note');
const ApiError = require('../utils/ApiError');
const { appEvents, EVENTS } = require('../utils/events');

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid note ID: ${id}`);
  }
};

const pickNoteFields = (body) => {
  const source = body && typeof body === 'object' ? body : {};
  const result = {};
  if (source.title !== undefined) result.title = source.title;
  if (source.content !== undefined) result.content = source.content;
  return result;
};

// POST /api/notes  (protected)
const createNote = async (req, res) => {
  const { title, content } = pickNoteFields(req.body);

  const note = await Note.create({
    title,
    content,
    owner: req.user.id, // always the logged-in user, never from the body
  });

  appEvents.emit(EVENTS.NOTE_CREATED, {
    noteId: note._id.toString(),
    owner: req.user.id,
    title: note.title,
  });

  res.status(201).json(note);
};

// GET /api/notes  (protected) - only the caller's own notes
const getNotes = async (req, res) => {
  const notes = await Note.find({ owner: req.user.id }).sort({ createdAt: -1 });

  res.json({
    count: notes.length,
    notes,
  });
};

// GET /api/notes/:id  (protected, owner only)
const getNoteById = async (req, res) => {
  assertValidId(req.params.id);

  const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  res.json(note);
};

// PUT /api/notes/:id  (protected, owner only)
const updateNote = async (req, res) => {
  assertValidId(req.params.id);

  const updates = pickNoteFields(req.body);
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'Provide title and/or content to update');
  }

  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    updates,
    { new: true, runValidators: true }
  );

  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  res.json(note);
};

// DELETE /api/notes/:id  (protected, owner only)
const deleteNote = async (req, res) => {
  assertValidId(req.params.id);

  const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  appEvents.emit(EVENTS.NOTE_DELETED, {
    noteId: note._id.toString(),
    owner: req.user.id,
  });

  res.json({ message: 'Note deleted', id: note._id });
};

// GET /api/notes/admin/all  (protected, admin only - RBAC demo)
const getAllNotesAdmin = async (req, res) => {
  const notes = await Note.find().populate('owner', 'username email').sort({ createdAt: -1 });

  res.json({
    count: notes.length,
    notes,
  });
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getAllNotesAdmin,
};
