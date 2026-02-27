#!/usr/bin/env node
'use strict';

const { createNote, listNotes, searchNotes, addTag } = require('../src/store');

function printUsage() {
  console.log(`Usage: mdnotes <command> [args]

Commands:
  new <title>       Create a new note
  list              List all notes
  search <term>     Search notes by title, tags, or body
  tag <id> <tag>    Add a tag to a note
`);
}

function formatNoteLine(note) {
  const tags = note.tags.length ? ` [${note.tags.join(', ')}]` : '';
  return `${note.id}  ${note.title}${tags}`;
}

function main() {
  const [, , command, ...args] = process.argv;

  try {
    switch (command) {
      case 'new': {
        const title = args.join(' ').trim();
        if (!title) {
          console.error('Error: title is required');
          process.exit(1);
        }
        const note = createNote(title);
        console.log(`Created note: ${note.id} - ${note.title}`);
        break;
      }
      case 'list': {
        const notes = listNotes();
        if (notes.length === 0) {
          console.log('No notes found.');
          break;
        }
        for (const note of notes) {
          console.log(formatNoteLine(note));
        }
        break;
      }
      case 'search': {
        const term = args.join(' ').trim();
        if (!term) {
          console.error('Error: search term is required');
          process.exit(1);
        }
        const notes = searchNotes(term);
        if (notes.length === 0) {
          console.log(`No notes matched "${term}".`);
          break;
        }
        for (const note of notes) {
          console.log(formatNoteLine(note));
        }
        break;
      }
      case 'tag': {
        const [id, ...tagParts] = args;
        const tag = tagParts.join(' ').trim();
        if (!id || !tag) {
          console.error('Error: id and tag are required');
          process.exit(1);
        }
        const note = addTag(id, tag);
        console.log(`Tagged ${note.id} with "${tag}"`);
        break;
      }
      default:
        printUsage();
        process.exit(command ? 1 : 0);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
