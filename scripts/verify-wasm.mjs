// Load every wasm in wasm/ with web-tree-sitter and parse a sample.
//
// This is the check that matters. A grammar built by a different tree-sitter
// release than the installed web-tree-sitter throws from getDylinkMetadata
// with an EMPTY message — no version, no filename, nothing naming the ABI.
// Consumers see "unsupported language" and go looking for a missing grammar
// that is sitting right there. So the load is asserted here, at build time,
// where the two versions are pinned together and the failure is legible.
import { readdirSync, existsSync } from 'node:fs';
import { Language, Parser } from 'web-tree-sitter';

// One grammar per file name, with something it must parse without error.
const samples = {
  'tree-sitter-clojure_semantic.wasm':    '(ns app.core)\n(defn greet [name] (str "hi " name))',
  'tree-sitter-commonlisp_semantic.wasm': '(defun greet (name) (format t "hi ~a" name))',
  'tree-sitter-elisp_semantic.wasm':      '(defun greet (name) (message "hi %s" name))',
  'tree-sitter-racket_semantic.wasm':     '(struct point (x y))\n(define (greet name) name)',
  'tree-sitter-scheme_semantic.wasm':     '(define (greet name) (string-append "hi " name))',
};

if (!existsSync('wasm')) {
  console.error('wasm/ not found — run npm run build first.');
  process.exit(1);
}

await Parser.init();

const files = readdirSync('wasm').filter(f => f.endsWith('.wasm')).sort();
if (!files.length) {
  console.error('wasm/ holds no .wasm — run npm run build first.');
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  try {
    const lang = await Language.load(`wasm/${file}`);
    const parser = new Parser();
    parser.setLanguage(lang);

    const sample = samples[file];
    if (sample) {
      const root = parser.parse(sample).rootNode;
      if (root.hasError) throw new Error(`sample parsed with errors: ${root.toString().slice(0, 120)}`);
      console.log(`  ok    ${file}  (loaded, sample parsed clean)`);
    } else {
      console.log(`  ok    ${file}  (loaded)`);
    }
  } catch (e) {
    failed++;
    // Say the likely cause out loud, because the thrown message is often empty.
    const msg = e.message || '(empty message — typically a tree-sitter/web-tree-sitter ABI mismatch)';
    console.error(`  FAIL  ${file}: ${msg}`);
  }
}

if (failed) {
  console.error(`\n${failed}/${files.length} grammars failed to load.`);
  process.exit(1);
}
console.log(`\n${files.length} grammars load and parse.`);
