// Build every grammar to wasm/, or just the ones named on the command line.
//
// Two ordering facts, both of which cost an hour to find:
//
//   1. `tree-sitter build --wasm` needs a generated src/parser.c. Without one
//      it fails with "Failed to run wasi-sdk clang -- No such file or
//      directory", which names the toolchain and not the missing input, and
//      sends you hunting a wasi-sdk that is present and healthy.
//   2. `tree-sitter generate` writes src/ relative to the CWD, not to the
//      grammar file. Run from the repo root it drops one src/ at the root and
//      the grammars stay unbuilt, so generate runs inside each directory and
//      build runs from the root.
import { execFileSync } from 'node:child_process';
import { readdirSync, renameSync, existsSync, mkdirSync, statSync } from 'node:fs';

const root = process.cwd();
const cli = 'node_modules/.bin/tree-sitter';

if (!existsSync(cli)) {
  console.error(`${cli} not found — run npm install first.`);
  process.exit(1);
}

const requested = process.argv.slice(2);
const all = readdirSync(root)
  .filter(d => d.startsWith('tree-sitter-') && statSync(d).isDirectory());
const targets = requested.length
  ? all.filter(d => requested.some(r => d === r || d === `tree-sitter-${r}`))
  : all;

if (!targets.length) {
  console.error(`No grammar matched ${requested.join(', ')}. Available:\n  ${all.join('\n  ')}`);
  process.exit(1);
}

mkdirSync('wasm', { recursive: true });

let failed = 0;
for (const dir of targets) {
  try {
    // cwd matters here — see the note at the top.
    execFileSync(`${root}/${cli}`, ['generate'], { cwd: `${root}/${dir}`, stdio: 'pipe' });
    execFileSync(cli, ['build', '--wasm', dir], { stdio: 'pipe' });
    // The CLI drops the .wasm in the cwd, named from the grammar rather than
    // the directory (tree-sitter-clojure-semantic -> tree-sitter-clojure_semantic.wasm).
    const produced = readdirSync(root).filter(f => f.endsWith('.wasm'));
    if (!produced.length) throw new Error('build reported success but produced no .wasm');
    for (const w of produced) renameSync(w, `wasm/${w}`);
    console.log(`  ok    ${dir} -> wasm/${produced.join(', ')}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL  ${dir}: ${(e.stderr?.toString() || e.message).trim().split('\n')[0]}`);
  }
}

if (failed) {
  console.error(`\n${failed}/${targets.length} grammars failed to build.`);
  process.exit(1);
}
console.log(`\n${targets.length} grammars built into wasm/.`);
