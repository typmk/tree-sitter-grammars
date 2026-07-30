/**
 * Semantic Tree-sitter grammar for Clojure
 *
 * Design goals:
 * - Semantic nodes for common forms (defn_form, ns_form, etc.)
 * - Proper field names (name, params, body, docstring)
 * - Full reader macro support
 * - Falls back to generic list for unknown forms
 *
 * Inspired by:
 * - sogaiu/tree-sitter-clojure (reader macro handling)
 * - tree-sitter-grammars/tree-sitter-commonlisp (semantic forms)
 */

const SYMBOL_CHAR = /[a-zA-Z_*+!\-'?<>=.]/;
const SYMBOL_CHAR_CONT = /[a-zA-Z0-9_*+!\-'?<>=.#:]/;

/**
 * Metadata written BEFORE a definition's name: (ns ^:no-doc my.ns ...),
 * (defn ^:private f ...), (def ^:const x 1).
 *
 * This cannot be `repeat($.metadata)`. The `metadata` rule is
 * `^<meta> <form>` — it CONSUMES the form it decorates, so it would
 * swallow the very symbol the `name` field needs and the rule would not
 * match. Inlining just the marker leaves the name where the field can
 * still bind it.
 *
 * Without this, a def form carrying metadata failed its semantic rule
 * and fell back to a generic list: no ns_form node at all, so the
 * namespace came out null and every definition in the file indexed
 * unqualified and unfindable.
 */
const metaPrefix = $ => repeat(seq(
  choice('^', '#^'),
  choice($.keyword, $.map, $.symbol, $.string)
));

module.exports = grammar({
  name: 'clojure_semantic',

  // Comments belong in extras, not only at source level. Defined but excluded,
  // they parsed only BETWEEN top-level forms — and a comment inside a defn body
  // is where most Clojure comments actually live, so every one of them was a
  // parse error. Measured on defnet: 299 of ~420 sampled ERROR nodes opened
  // with ';' or ';;', and a form containing an error is dropped from the index
  // silently. #_ discard is an extra for the same reason.
  extras: $ => [/[\s,]+/, $.comment, $.discard],

  externals: $ => [],

  conflicts: $ => [],

  rules: {
    source: $ => repeat(choice($._form, $.comment, $.discard)),

    // =========================================================================
    // Forms - ordered by precedence (semantic forms first)
    // =========================================================================

    _form: $ => choice(
      // % / %1 / %& at any depth. It was reachable only from the immediate body
      // of #(...), so `#(f (g %))` — the % one level in — was an error. 76 of
      // the sampled ERROR nodes opened with '%'.
      $.anon_arg,

      // Definition forms (highest precedence)
      $.defn_form,
      $.defn_private_form,
      $.def_form,
      $.defonce_form,
      $.defmacro_form,
      $.defmulti_form,
      $.defmethod_form,
      $.defprotocol_form,
      $.defrecord_form,
      $.deftype_form,
      $.ns_form,

      // Control flow forms
      $.fn_form,
      $.let_form,
      $.letfn_form,
      $.if_form,
      $.if_let_form,
      $.if_not_form,
      $.when_form,
      $.when_let_form,
      $.when_not_form,
      $.when_first_form,
      $.when_some_form,
      $.cond_form,
      $.condp_form,
      $.case_form,
      $.do_form,
      $.loop_form,
      $.recur_form,
      $.for_form,
      $.doseq_form,
      $.dotimes_form,
      $.while_form,

      // Exception handling
      $.try_form,
      $.throw_form,

      // Threading macros
      $.thread_first_form,
      $.thread_last_form,
      $.thread_as_form,
      $.some_thread_first_form,
      $.some_thread_last_form,
      $.cond_thread_form,

      // Binding forms
      $.binding_form,
      $.with_open_form,
      $.with_redefs_form,

      // Generic structures (fallback)
      $.list,
      $.vector,
      $.map,
      $.set,

      // Atoms
      $.number,
      $.string,
      $.keyword,
      $.symbol,
      $.nil,
      $.boolean,
      $.char,
      $.regex,
      $.symbolic_value,

      // Reader macros
      $.quote,
      $.syntax_quote,
      $.unquote,
      $.unquote_splice,
      $.deref,
      $.var_quote,
      $.metadata,
      $.tagged_literal,
      $.anonymous_fn,
      $.reader_conditional,
      $.namespaced_map,
    ),

    // =========================================================================
    // Definition Forms
    // =========================================================================

    defn_form: $ => prec(10, seq(
      '(', 'defn',
      metaPrefix($),
      field('name', $.symbol),
      optional(field('docstring', $.string)),
      optional(field('meta', $.map)),
      choice(
        seq(field('params', $.vector), field('body', repeat($._form))),
        field('arities', repeat1($.arity))
      ),
      ')'
    )),

    defn_private_form: $ => prec(10, seq(
      '(', 'defn-',
      metaPrefix($),
      field('name', $.symbol),
      optional(field('docstring', $.string)),
      optional(field('meta', $.map)),
      choice(
        seq(field('params', $.vector), field('body', repeat($._form))),
        field('arities', repeat1($.arity))
      ),
      ')'
    )),

    arity: $ => seq(
      '(',
      field('params', $.vector),
      field('body', repeat($._form)),
      ')'
    ),

    def_form: $ => prec(10, seq(
      '(', 'def',
      metaPrefix($),
      field('name', $.symbol),
      optional(field('docstring', $.string)),
      optional(field('value', $._form)),
      ')'
    )),

    defonce_form: $ => prec(10, seq(
      '(', 'defonce',
      metaPrefix($),
      field('name', $.symbol),
      optional(field('docstring', $.string)),
      optional(field('value', $._form)),
      ')'
    )),

    defmacro_form: $ => prec(10, seq(
      '(', 'defmacro',
      metaPrefix($),
      field('name', $.symbol),
      optional(field('docstring', $.string)),
      optional(field('meta', $.map)),
      choice(
        seq(field('params', $.vector), field('body', repeat($._form))),
        field('arities', repeat1($.arity))
      ),
      ')'
    )),

    defmulti_form: $ => prec(10, seq(
      '(', 'defmulti',
      metaPrefix($),
      field('name', $.symbol),
      optional(field('docstring', $.string)),
      field('dispatch', $._form),
      optional(seq(':default', field('default', $._form))),
      ')'
    )),

    defmethod_form: $ => prec(10, seq(
      '(', 'defmethod',
      metaPrefix($),
      field('name', $.symbol),
      field('dispatch_val', $._form),
      field('params', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    defprotocol_form: $ => prec(10, seq(
      '(', 'defprotocol',
      metaPrefix($),
      field('name', $.symbol),
      optional(field('docstring', $.string)),
      field('methods', repeat($.protocol_method)),
      ')'
    )),

    protocol_method: $ => seq(
      '(',
      field('name', $.symbol),
      field('signatures', repeat1($.vector)),
      optional(field('docstring', $.string)),
      ')'
    ),

    defrecord_form: $ => prec(10, seq(
      '(', 'defrecord',
      metaPrefix($),
      field('name', $.symbol),
      field('fields', $.vector),
      field('impls', repeat($._form)),
      ')'
    )),

    deftype_form: $ => prec(10, seq(
      '(', 'deftype',
      metaPrefix($),
      field('name', $.symbol),
      field('fields', $.vector),
      field('impls', repeat($._form)),
      ')'
    )),

    ns_form: $ => prec(10, seq(
      '(', 'ns',
      metaPrefix($),
      field('name', $.symbol),
      optional(field('docstring', $.string)),
      field('clauses', repeat($._form)),
      ')'
    )),

    // =========================================================================
    // Control Flow Forms
    // =========================================================================

    fn_form: $ => prec(5, seq(
      '(', 'fn',
      optional(field('name', $.symbol)),
      choice(
        seq(field('params', $.vector), field('body', repeat($._form))),
        field('arities', repeat1($.arity))
      ),
      ')'
    )),

    let_form: $ => prec(5, seq(
      '(', 'let',
      field('bindings', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    letfn_form: $ => prec(5, seq(
      '(', 'letfn',
      field('fns', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    if_form: $ => prec(5, seq(
      '(', 'if',
      field('condition', $._form),
      field('then', $._form),
      optional(field('else', $._form)),
      ')'
    )),

    if_let_form: $ => prec(5, seq(
      '(', 'if-let',
      field('bindings', $.vector),
      field('then', $._form),
      optional(field('else', $._form)),
      ')'
    )),

    if_not_form: $ => prec(5, seq(
      '(', 'if-not',
      field('condition', $._form),
      field('then', $._form),
      optional(field('else', $._form)),
      ')'
    )),

    when_form: $ => prec(5, seq(
      '(', 'when',
      field('condition', $._form),
      field('body', repeat($._form)),
      ')'
    )),

    when_let_form: $ => prec(5, seq(
      '(', 'when-let',
      field('bindings', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    when_not_form: $ => prec(5, seq(
      '(', 'when-not',
      field('condition', $._form),
      field('body', repeat($._form)),
      ')'
    )),

    when_first_form: $ => prec(5, seq(
      '(', 'when-first',
      field('bindings', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    when_some_form: $ => prec(5, seq(
      '(', 'when-some',
      field('bindings', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    cond_form: $ => prec(5, seq(
      '(', 'cond',
      field('clauses', repeat($._form)),
      ')'
    )),

    condp_form: $ => prec(5, seq(
      '(', 'condp',
      field('pred', $._form),
      field('expr', $._form),
      field('clauses', repeat($._form)),
      ')'
    )),

    case_form: $ => prec(5, seq(
      '(', 'case',
      field('expr', $._form),
      field('clauses', repeat($._form)),
      ')'
    )),

    do_form: $ => prec(5, seq(
      '(', 'do',
      field('body', repeat($._form)),
      ')'
    )),

    loop_form: $ => prec(5, seq(
      '(', 'loop',
      field('bindings', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    recur_form: $ => prec(5, seq(
      '(', 'recur',
      field('args', repeat($._form)),
      ')'
    )),

    for_form: $ => prec(5, seq(
      '(', 'for',
      field('bindings', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    doseq_form: $ => prec(5, seq(
      '(', 'doseq',
      field('bindings', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    dotimes_form: $ => prec(5, seq(
      '(', 'dotimes',
      field('bindings', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    while_form: $ => prec(5, seq(
      '(', 'while',
      field('condition', $._form),
      field('body', repeat($._form)),
      ')'
    )),

    // =========================================================================
    // Exception Handling
    // =========================================================================

    try_form: $ => prec(5, seq(
      '(', 'try',
      field('body', repeat($._form)),
      field('catch_clauses', repeat($.catch_clause)),
      optional(field('finally', $.finally_clause)),
      ')'
    )),

    catch_clause: $ => seq(
      '(', 'catch',
      // ClojureScript catches on a KEYWORD as often as a symbol —
      // (catch :default e ...) is the idiomatic catch-all, and this grammar
      // ships for .cljs. Requiring a symbol made every one of them a parse
      // error: 88 of the 135 remaining ERROR nodes in defnet's own source,
      // and defnet is written in ClojureScript.
      field('exception_type', choice($.symbol, $.keyword)),
      field('binding', $.symbol),
      field('body', repeat($._form)),
      ')'
    ),

    finally_clause: $ => seq(
      '(', 'finally',
      field('body', repeat($._form)),
      ')'
    ),

    throw_form: $ => prec(5, seq(
      '(', 'throw',
      field('exception', $._form),
      ')'
    )),

    // =========================================================================
    // Threading Macros
    // =========================================================================

    thread_first_form: $ => prec(5, seq(
      '(', '->',
      field('initial', $._form),
      field('forms', repeat($._form)),
      ')'
    )),

    thread_last_form: $ => prec(5, seq(
      '(', '->>',
      field('initial', $._form),
      field('forms', repeat($._form)),
      ')'
    )),

    thread_as_form: $ => prec(5, seq(
      '(', 'as->',
      field('initial', $._form),
      field('binding', $.symbol),
      field('forms', repeat($._form)),
      ')'
    )),

    some_thread_first_form: $ => prec(5, seq(
      '(', 'some->',
      field('initial', $._form),
      field('forms', repeat($._form)),
      ')'
    )),

    some_thread_last_form: $ => prec(5, seq(
      '(', 'some->>',
      field('initial', $._form),
      field('forms', repeat($._form)),
      ')'
    )),

    cond_thread_form: $ => prec(5, seq(
      '(', choice('cond->', 'cond->>'),
      field('initial', $._form),
      field('clauses', repeat($._form)),
      ')'
    )),

    // =========================================================================
    // Binding Forms
    // =========================================================================

    binding_form: $ => prec(5, seq(
      '(', 'binding',
      field('bindings', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    with_open_form: $ => prec(5, seq(
      '(', 'with-open',
      field('bindings', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    with_redefs_form: $ => prec(5, seq(
      '(', 'with-redefs',
      field('bindings', $.vector),
      field('body', repeat($._form)),
      ')'
    )),

    // =========================================================================
    // Data Structures (lowest precedence for list)
    // =========================================================================

    list: $ => prec(-1, seq('(', repeat($._form), ')')),
    vector: $ => seq('[', repeat($._form), ']'),
    map: $ => seq('{', repeat($._form), '}'),
    set: $ => seq('#{', repeat($._form), '}'),

    // =========================================================================
    // Atoms
    // =========================================================================

    symbol: $ => token(choice(
      // Special symbols
      '/', '.', '&', '$',
      // Regular symbols: optional namespace, then name
      // Allows: letters, digits (not first), and special chars: _ * + ! - ' ? < > = . & $
      seq(
        optional(seq(/[a-zA-Z_*+!\-'?<>=$][a-zA-Z0-9_*+!\-'?<>=.$]*/, '/')),
        /[a-zA-Z_*+!\-'?<>=.$&][a-zA-Z0-9_*+!\-'?<>=.$]*/
      )
    )),

    keyword: $ => token(seq(
      ':',
      optional(':'),  // ::auto-resolved
      optional(seq(/[a-zA-Z_*+!\-'?<>=][a-zA-Z0-9_*+!\-'?<>=.]*/, '/')),
      /[a-zA-Z_*+!\-'?<>=.][a-zA-Z0-9_*+!\-'?<>=.]*/
    )),

    string: $ => token(seq(
      '"',
      repeat(choice(/[^"\\]/, /\\./)),
      '"'
    )),

    number: $ => token(choice(
      // Decimal with optional decimal point and exponent
      /[+-]?\d+(\.\d+)?([eE][+-]?\d+)?M?/,
      // Integer with optional N suffix (bigint)
      /[+-]?\d+N?/,
      // Ratio
      /[+-]?\d+\/\d+/,
      // Hex
      /0[xX][0-9a-fA-F]+N?/,
      // Octal
      /0[0-7]+N?/,
      // Binary
      /2r[01]+N?/,
      // Radix
      /\d+[rR][0-9a-zA-Z]+N?/,
    )),

    char: $ => token(seq('\\', choice(
      'newline', 'space', 'tab', 'return', 'backspace', 'formfeed',
      /u[0-9a-fA-F]{4}/,
      /o[0-7]{1,3}/,
      /./
    ))),

    nil: $ => 'nil',
    boolean: $ => choice('true', 'false'),

    regex: $ => token(seq('#"', repeat(choice(/[^"\\]/, /\\./)), '"')),

    // ##Inf, ##-Inf, ##NaN
    symbolic_value: $ => token(seq('##', choice('Inf', '-Inf', 'NaN'))),

    // =========================================================================
    // Reader Macros
    // =========================================================================

    quote: $ => seq("'", $._form),
    syntax_quote: $ => seq('`', $._form),
    unquote: $ => seq('~', $._form),
    unquote_splice: $ => seq('~@', $._form),
    deref: $ => seq('@', $._form),
    var_quote: $ => seq("#'", $.symbol),

    metadata: $ => prec(1, seq(
      choice('^', '#^'),
      choice($.keyword, $.map, $.symbol, $.string),
      $._form
    )),

    tagged_literal: $ => seq(
      '#',
      field('tag', $.symbol),
      field('value', $._form)
    ),

    // #(... % %1 %2 %&)
    anonymous_fn: $ => seq(
      '#(',
      // $._form now includes anon_arg, so listing it again here makes the
      // parse ambiguous — tree-sitter reports a conflict between _form and
      // anonymous_fn_repeat1. One path only.
      repeat($._form),
      ')'
    ),

    anon_arg: $ => token(choice('%', /%[1-9]/, '%&')),

    // #?(:clj ... :cljs ...)
    reader_conditional: $ => seq(
      choice('#?', '#?@'),
      '(',
      repeat(seq($.keyword, $._form)),
      ')'
    ),

    // #:foo{:a 1} or #::foo{:a 1} or #::{:a 1}
    namespaced_map: $ => seq(
      '#',
      choice(
        seq(':', optional($.symbol)),   // #:foo or #:
        seq('::', optional($.symbol))   // #::foo or #::
      ),
      $.map
    ),

    // =========================================================================
    // Comments
    // =========================================================================

    comment: $ => token(choice(
      seq(';', /.*/),
      seq('#!', /.*/),  // shebang
    )),

    // #_ discard
    discard: $ => seq('#_', $._form),
  }
});
