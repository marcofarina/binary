import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { lintContent } from './content-rules.ts';

const root = join(import.meta.dirname, '..', 'src', 'content');

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.mdx?$/.test(entry.name)) yield path;
  }
}

let errors = 0;
let warnings = 0;
for (const file of walk(root)) {
  for (const issue of lintContent(readFileSync(file, 'utf8'))) {
    const where = `${relative(process.cwd(), file)}:${issue.line}`;
    console.log(`${issue.severity === 'error' ? '✖' : '⚠'} ${where} [${issue.rule}] ${issue.message}`);
    if (issue.severity === 'error') errors++;
    else warnings++;
  }
}

console.log(`\n${errors} errori, ${warnings} avvisi.`);
process.exit(errors > 0 ? 1 : 0);
