'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { slugify, frontmatter, parseFrontmatter } = require('../src/markdown');

describe('markdown helpers', () => {
  it('slugify converts titles to URL-safe slugs', () => {
    assert.equal(slugify('Hello World'), 'hello-world');
    assert.equal(slugify('  Foo & Bar!!  '), 'foo-bar');
    assert.equal(slugify('API v2.0'), 'api-v2-0');
  });

  it('frontmatter serializes metadata as YAML', () => {
    const yaml = frontmatter({
      id: 'abc123',
      title: 'My Note',
      tags: ['work', 'ideas'],
      createdAt: '2026-06-28T12:00:00.000Z',
    });

    assert.match(yaml, /^---\n/);
    assert.match(yaml, /id: abc123/);
    assert.match(yaml, /title: My Note/);
    assert.match(yaml, /tags:\n  - work\n  - ideas/);
    assert.match(yaml, /---\n$/);
  });

  it('parseFrontmatter extracts metadata and body', () => {
    const content = [
      '---',
      'id: abc123',
      'title: My Note',
      'tags:',
      '  - work',
      'createdAt: 2026-06-28T12:00:00.000Z',
      '---',
      '',
      '# My Note',
      '',
      'Some body text.',
      '',
    ].join('\n');

    const { meta, body } = parseFrontmatter(content);

    assert.equal(meta.id, 'abc123');
    assert.equal(meta.title, 'My Note');
    assert.deepEqual(meta.tags, ['work']);
    assert.match(body, /^# My Note/);
    assert.match(body, /Some body text\./);
  });

  it('parseFrontmatter returns empty meta when frontmatter is missing', () => {
    const content = '# Plain note\n\nNo frontmatter here.';
    const { meta, body } = parseFrontmatter(content);

    assert.deepEqual(meta, {});
    assert.equal(body, content);
  });

  it('frontmatter and parseFrontmatter round-trip metadata', () => {
    const original = {
      id: 'deadbeef',
      title: 'Round Trip',
      tags: ['alpha', 'beta'],
      createdAt: '2026-06-28T12:00:00.000Z',
      updatedAt: '2026-06-28T13:00:00.000Z',
    };

    const { meta } = parseFrontmatter(frontmatter(original) + '# Round Trip\n');

    assert.deepEqual(meta, original);
  });
});
