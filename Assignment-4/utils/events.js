const EventEmitter = require('events');

// Event names used across the app
const EVENTS = {
  USER_REGISTERED: 'user:registered',
  USER_LOGGED_IN: 'user:loggedIn',
  NOTE_CREATED: 'note:created',
  NOTE_DELETED: 'note:deleted',
};

// Central application event bus
const appEvents = new EventEmitter();

// ---- Built-in listeners (event-driven side effects) ----
appEvents.on(EVENTS.USER_REGISTERED, ({ id, username, email }) => {
  console.log(`[event] New user registered: ${username} <${email}> (${id})`);
});

appEvents.on(EVENTS.USER_LOGGED_IN, ({ id, username }) => {
  console.log(`[event] User logged in: ${username} (${id})`);
});

appEvents.on(EVENTS.NOTE_CREATED, ({ noteId, owner, title }) => {
  console.log(`[event] Note created: "${title}" (${noteId}) by user ${owner}`);
});

appEvents.on(EVENTS.NOTE_DELETED, ({ noteId, owner }) => {
  console.log(`[event] Note deleted: ${noteId} by user ${owner}`);
});

module.exports = { appEvents, EVENTS };
