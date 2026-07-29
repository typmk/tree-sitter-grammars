# tree-sitter-grammars

Nine tree-sitter grammars that don't exist upstream — five semantic Lisp
grammars, and four for compiler IR and bytecode assembly. Prebuilt wasm
included.

| Grammar | Parses | Named nodes it adds | Rules |
|---------|--------|---------------------|------:|
| `clojure-semantic` | Clojure | `ns_form`, `defn_form`, `defn_private_form`, `def_form`, `defmacro_form`, `defmulti_form`, `defmethod_form`, `defprotocol_form`, `defrecord_form`, `deftype_form`, `defonce_form` | 81 |
| `commonlisp-semantic` | Common Lisp | `defun_form`, `defclass_form`, `defmacro_form`, `defgeneric_form`, `defpackage_form`, … | 58 |
| `elisp-semantic` | Emacs Lisp | `defun_form`, `cl_defun_form`, `defcustom_form`, `define_minor_mode_form`, … | 81 |
| `racket-semantic` | Racket | `module_form`, `struct_form`, `class_form`, `syntax_parse_form`, `contract_out_form`, … | 103 |
| `scheme-semantic` | Scheme | `define_function`, `define_syntax`, `define_record_type`, `define_library`, `lambda_expression`, `named_let`, … | 69 |
| `graal-ir` | GraalVM compiler IR | textual Graal IR dumps | 36 |
| `jasmin` | Jasmin | JVM bytecode assembler | 56 |
| `cil` | CIL / MSIL | .NET bytecode assembly | 65 |
| `clif` | Cranelift IR | Cranelift's textual IR | 51 |

## Why "semantic"

A stock Lisp grammar is homoiconic all the way down, which is faithful to
the language and unhelpful to a tool. To find every function definition you
walk every list and test whether its head symbol is one of `defn`,
`defn-`, `defmacro`, … , and you get the metadata, docstring and arity
handling wrong on your own each time.

These grammars push that into the parser. `(defn ^:private f "doc" [x] …)`
parses as a `defn_form` with a name field, so "find every definition" is a
query, and metadata and docstrings are handled once, in the grammar, where
a fix helps every consumer.

## Using them

The `wasm/` directory holds each grammar prebuilt, so nothing here needs a
build step to consume:

```js
import { Language, Parser } from 'web-tree-sitter';

await Parser.init();
const clj = await Language.load('wasm/tree-sitter-clojure_semantic.wasm');
const parser = new Parser();
parser.setLanguage(clj);
parser.parse('(defn greet [name] (str "hi " name))');
```

**Build them against the same tree-sitter release as your
`web-tree-sitter`.** A wasm built by an older CLI fails to load with an
*empty* error message out of `getDylinkMetadata` — the wasm carries a
dylink ABI the loader will not accept, and nothing in the message says so.
The CI here pins both to one version for that reason.

To rebuild:

```sh
npm install
npm run build          # every grammar -> wasm/
npm run build -- cil   # just one
```

Run those from the repo root. If you invoke the CLI by hand, note that
`build --wasm` needs a generated `src/parser.c` and reports its absence as
`Failed to run wasi-sdk clang -- No such file or directory` — which names
the toolchain rather than the missing input. `generate` writes `src/`
relative to the working directory, so it has to run *inside* the grammar
directory while `build` runs from the root. `npm run build` does both in
that order.

## Layout

Each grammar is a standard tree-sitter package — `grammar.js`,
`package.json`, `tree-sitter.json` — so it can be used directly by the
tree-sitter CLI, or split out later without rework.

## License

MIT. See [LICENSE](LICENSE).
