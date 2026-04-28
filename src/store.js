'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { slugify, frontmatter, parseFrontmatter } = require('./markdown');

function getHomeDir() {
  return process.env.MDNOTES_HOME || path.join(os.homedir(), '.mdnotes');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function getIndexPath() {
  return path.join(getHomeDir(), 'index.json');
}

function readIndex() {
  ensureDir(getHomeDir());
  const indexPath = getIndexPath();

  if (!fs.existsSync(indexPath)) {
    return { notes: [] };
  }

  return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
}

function writeIndex(index) {
  ensureDir(getHomeDir());
  fs.writeFileSync(getIndexPath(), `${JSON.stringify(index, null, 2)}\n`);
}

function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

function createNote(title) {
  const id = generateId();
  const slug = slugify(title);
  const filename = `${slug}-${id}.md`;
  const now = new Date().toISOString();
  const meta = {
    id,
    title,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  const body = `# ${title}\n\n`;
  const filePath = path.join(getHomeDir(), filename);

  ensureDir(getHomeDir());
  fs.writeFileSync(filePath, frontmatter(meta) + body);

  const index = readIndex();
  const note = {
    id,
    title,
    slug,
    filename,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };

  index.notes.push(note);
  writeIndex(index);

  return note;
}

function listNotes() {
  const index = readIndex();
  return index.notes.sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

function searchNotes(term) {
  const lower = term.toLowerCase();
  const index = readIndex();

  return index.notes.filter((note) => {
    if (note.title.toLowerCase().includes(lower)) {
      return true;
    }

    if (note.tags.some((tag) => tag.toLowerCase().includes(lower))) {
      return true;
    }

    const filePath = path.join(getHomeDir(), note.filename);
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const { body } = parseFrontmatter(fs.readFileSync(filePath, 'utf8'));
    return body.toLowerCase().includes(lower);
  });
}

function addTag(id, tag) {
  const index = readIndex();
  const note = index.notes.find((entry) => entry.id === id);

  if (!note) {
    throw new Error(`Note not found: ${id}`);
  }

  if (!note.tags.includes(tag)) {
    note.tags.push(tag);
    note.updatedAt = new Date().toISOString();
    writeIndex(index);
  }

  const filePath = path.join(getHomeDir(), note.filename);
  const { meta, body } = parseFrontmatter(fs.readFileSync(filePath, 'utf8'));

  meta.tags = note.tags;
  meta.updatedAt = note.updatedAt;
  fs.writeFileSync(filePath, frontmatter(meta) + body);

  return note;
}

module.exports = {
  getHomeDir,
  createNote,
  listNotes,
  searchNotes,
  addTag,
};
