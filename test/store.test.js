'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  getHomeDir,
  createNote,
  listNotes,
  searchNotes,
  addTag,
} = require('../src/store');

describe('store', () => {
  let tempDir;
  let previousHome;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mdnotes-test-'));
    previousHome = process.env.MDNOTES_HOME;
    process.env.MDNOTES_HOME = tempDir;
  });

  afterEach(() => {
    if (previousHome === undefined) {
      delete process.env.MDNOTES_HOME;
    } else {
      process.env.MDNOTES_HOME = previousHome;
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('uses MDNOTES_HOME as the storage root', () => {
    assert.equal(getHomeDir(), tempDir);
  });

  it('createNote writes markdown and updates index.json', () => {
    const note = createNote('First Note');

    assert.match(note.id, /^[0-9a-f]{8}$/);
    assert.equal(note.title, 'First Note');
    assert.equal(note.slug, 'first-note');

    const filePath = path.join(tempDir, note.filename);
    assert.ok(fs.existsSync(filePath));

    const content = fs.readFileSync(filePath, 'utf8');
    assert.match(content, /title: First Note/);
    assert.match(content, /# First Note/);

    const index = JSON.parse(fs.readFileSync(path.join(tempDir, 'index.json'), 'utf8'));
    assert.equal(index.notes.length, 1);
    assert.equal(index.notes[0].id, note.id);
  });

  it('listNotes returns notes sorted by updatedAt descending', () => {
    const first = createNote('Older');
    const second = createNote('Newer');

    addTag(first.id, 'touch');

    const notes = listNotes();
    assert.equal(notes.length, 2);
    assert.equal(notes[0].id, first.id);
    assert.equal(notes[1].id, second.id);
  });

  it('searchNotes matches title, tags, and body', () => {
    const note = createNote('Project Plan');
    addTag(note.id, 'work');

    const filePath = path.join(tempDir, note.filename);
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, `${content}Remember to buy milk.\n`);

    assert.equal(searchNotes('project').length, 1);
    assert.equal(searchNotes('work').length, 1);
    assert.equal(searchNotes('milk').length, 1);
    assert.equal(searchNotes('missing').length, 0);
  });

  it('addTag updates index and note frontmatter', () => {
    const note = createNote('Tagged Note');
    const updated = addTag(note.id, 'ideas');

    assert.deepEqual(updated.tags, ['ideas']);

    const listed = listNotes().find((entry) => entry.id === note.id);
    assert.deepEqual(listed.tags, ['ideas']);

    const content = fs.readFileSync(path.join(tempDir, note.filename), 'utf8');
    assert.match(content, /tags:\n  - ideas/);
  });

  it('addTag throws when note id is missing', () => {
    assert.throws(() => addTag('missing-id', 'nope'), /Note not found/);
  });
});
