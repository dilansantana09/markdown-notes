'use strict';

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function frontmatter(meta) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(meta)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${escapeYamlString(String(item))}`);
      }
    } else {
      lines.push(`${key}: ${escapeYamlString(String(value))}`);
    }
  }

  lines.push('---', '');
  return lines.join('\n');
}

function escapeYamlString(value) {
  if (/[:#\[\]{}&*!|>'"%@`]/.test(value) || value.includes('\n')) {
    return JSON.stringify(value);
  }
  return value;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: content };
  }

  return {
    meta: parseSimpleYaml(match[1]),
    body: match[2].replace(/^\r?\n/, ''),
  };
}

function parseSimpleYaml(yaml) {
  const meta = {};
  const lines = yaml.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (!keyMatch) {
      i += 1;
      continue;
    }

    const key = keyMatch[1];
    const rest = keyMatch[2];

    if (rest === '') {
      const items = [];
      i += 1;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        items.push(unquoteYamlValue(lines[i].replace(/^\s+-\s+/, '')));
        i += 1;
      }
      meta[key] = items;
      continue;
    }

    meta[key] = unquoteYamlValue(rest);
    i += 1;
  }

  return meta;
}

function unquoteYamlValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return JSON.parse(
      value.startsWith("'")
        ? `"${value.slice(1, -1).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
        : value
    );
  }
  return value;
}

module.exports = {
  slugify,
  frontmatter,
  parseFrontmatter,
};
