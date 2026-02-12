/**
 * Semantic Tree-sitter grammar for Common Lisp
 *
 * Simplified approach: recognize forms by their leading keyword,
 * extract name, but let body be generic. Avoids ambiguity conflicts.
 */

module.exports = grammar({
  name: 'commonlisp_semantic',

  extras: $ => [
    /\s/,
    $.comment,
    $.block_comment,
  ],

  word: $ => $.symbol,

  rules: {
    source_file: $ => repeat($._form),

    _form: $ => choice(
      // Definitions (high precedence)
      $.defun_form,
      $.defmacro_form,
      $.defmethod_form,
      $.defgeneric_form,
      $.defclass_form,
      $.defstruct_form,
      $.deftype_form,
      $.defvar_form,
      $.defparameter_form,
      $.defconstant_form,
      $.defpackage_form,
      $.in_package_form,
      $.define_condition_form,

      // Binding forms
      $.let_form,
      $.let_star_form,
      $.flet_form,
      $.labels_form,
      $.multiple_value_bind_form,

      // Conditionals
      $.if_form,
      $.when_form,
      $.unless_form,
      $.cond_form,
      $.case_form,

      // Iteration
      $.loop_form,
      $.do_form,
      $.dotimes_form,
      $.dolist_form,

      // Lambda
      $.lambda_form,

      // Exception handling
      $.handler_case_form,
      $.unwind_protect_form,

      // Sequencing
      $.progn_form,
      $.block_form,

      // Assignment
      $.setq_form,
      $.setf_form,

      // Generic (lowest precedence)
      $.list,
      $._atom,
    ),

    // ==========================================================================
    // Function/Macro Definitions - capture name, let body be generic
    // ==========================================================================

    defun_form: $ => prec(10, seq(
      '(', choice('defun', 'DEFUN'),
      field('name', $.symbol),
      field('params', $.list),
      repeat($._form),
      ')'
    )),

    defmacro_form: $ => prec(10, seq(
      '(', choice('defmacro', 'DEFMACRO'),
      field('name', $.symbol),
      field('params', $.list),
      repeat($._form),
      ')'
    )),

    defmethod_form: $ => prec(10, seq(
      '(', choice('defmethod', 'DEFMETHOD'),
      field('name', $.symbol),
      repeat($._form),  // qualifiers, params, body all generic
      ')'
    )),

    defgeneric_form: $ => prec(10, seq(
      '(', choice('defgeneric', 'DEFGENERIC'),
      field('name', $.symbol),
      field('params', $.list),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Type Definitions
    // ==========================================================================

    defclass_form: $ => prec(10, seq(
      '(', choice('defclass', 'DEFCLASS'),
      field('name', $.symbol),
      field('superclasses', $.list),
      field('slots', $.list),
      repeat($._form),
      ')'
    )),

    defstruct_form: $ => prec(10, seq(
      '(', choice('defstruct', 'DEFSTRUCT'),
      field('name', choice($.symbol, $.list)),
      repeat($._form),
      ')'
    )),

    deftype_form: $ => prec(10, seq(
      '(', choice('deftype', 'DEFTYPE'),
      field('name', $.symbol),
      field('params', $.list),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Variable Definitions
    // ==========================================================================

    defvar_form: $ => prec(10, seq(
      '(', choice('defvar', 'DEFVAR'),
      field('name', $.symbol),
      repeat($._form),
      ')'
    )),

    defparameter_form: $ => prec(10, seq(
      '(', choice('defparameter', 'DEFPARAMETER'),
      field('name', $.symbol),
      repeat($._form),
      ')'
    )),

    defconstant_form: $ => prec(10, seq(
      '(', choice('defconstant', 'DEFCONSTANT'),
      field('name', $.symbol),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Package Definitions
    // ==========================================================================

    defpackage_form: $ => prec(10, seq(
      '(', choice('defpackage', 'DEFPACKAGE'),
      field('name', choice($.symbol, $.string, $.keyword)),
      repeat($._form),
      ')'
    )),

    in_package_form: $ => prec(10, seq(
      '(', choice('in-package', 'IN-PACKAGE'),
      field('name', choice($.symbol, $.string, $.keyword)),
      ')'
    )),

    define_condition_form: $ => prec(10, seq(
      '(', choice('define-condition', 'DEFINE-CONDITION'),
      field('name', $.symbol),
      field('parent_types', $.list),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Binding Forms
    // ==========================================================================

    let_form: $ => prec(8, seq(
      '(', choice('let', 'LET'),
      field('bindings', $.list),
      repeat($._form),
      ')'
    )),

    let_star_form: $ => prec(8, seq(
      '(', choice('let*', 'LET*'),
      field('bindings', $.list),
      repeat($._form),
      ')'
    )),

    flet_form: $ => prec(8, seq(
      '(', choice('flet', 'FLET'),
      field('bindings', $.list),
      repeat($._form),
      ')'
    )),

    labels_form: $ => prec(8, seq(
      '(', choice('labels', 'LABELS'),
      field('bindings', $.list),
      repeat($._form),
      ')'
    )),

    multiple_value_bind_form: $ => prec(8, seq(
      '(', choice('multiple-value-bind', 'MULTIPLE-VALUE-BIND'),
      field('vars', $.list),
      field('values_form', $._form),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Conditionals
    // ==========================================================================

    if_form: $ => prec(6, seq(
      '(', choice('if', 'IF'),
      field('condition', $._form),
      field('then', $._form),
      optional(field('else', $._form)),
      ')'
    )),

    when_form: $ => prec(6, seq(
      '(', choice('when', 'WHEN'),
      field('condition', $._form),
      repeat($._form),
      ')'
    )),

    unless_form: $ => prec(6, seq(
      '(', choice('unless', 'UNLESS'),
      field('condition', $._form),
      repeat($._form),
      ')'
    )),

    cond_form: $ => prec(6, seq(
      '(', choice('cond', 'COND'),
      repeat($.list),  // each clause is a list
      ')'
    )),

    case_form: $ => prec(6, seq(
      '(', choice('case', 'CASE', 'ecase', 'ECASE', 'typecase', 'TYPECASE', 'etypecase', 'ETYPECASE'),
      field('key', $._form),
      repeat($.list),  // each clause is a list
      ')'
    )),

    // ==========================================================================
    // Iteration
    // ==========================================================================

    loop_form: $ => prec(6, seq(
      '(', choice('loop', 'LOOP'),
      repeat($._form),
      ')'
    )),

    do_form: $ => prec(6, seq(
      '(', choice('do', 'DO', 'do*', 'DO*'),
      field('bindings', $.list),
      field('end_test', $.list),
      repeat($._form),
      ')'
    )),

    dotimes_form: $ => prec(6, seq(
      '(', choice('dotimes', 'DOTIMES'),
      field('spec', $.list),
      repeat($._form),
      ')'
    )),

    dolist_form: $ => prec(6, seq(
      '(', choice('dolist', 'DOLIST'),
      field('spec', $.list),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Lambda
    // ==========================================================================

    lambda_form: $ => prec(8, seq(
      '(', choice('lambda', 'LAMBDA'),
      field('params', $.list),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Exception Handling
    // ==========================================================================

    handler_case_form: $ => prec(6, seq(
      '(', choice('handler-case', 'HANDLER-CASE', 'handler-bind', 'HANDLER-BIND'),
      field('form', $._form),
      repeat($.list),
      ')'
    )),

    unwind_protect_form: $ => prec(6, seq(
      '(', choice('unwind-protect', 'UNWIND-PROTECT'),
      field('protected', $._form),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Sequencing & Control
    // ==========================================================================

    progn_form: $ => prec(5, seq(
      '(', choice('progn', 'PROGN', 'prog1', 'PROG1', 'prog2', 'PROG2'),
      repeat($._form),
      ')'
    )),

    block_form: $ => prec(6, seq(
      '(', choice('block', 'BLOCK'),
      field('name', $.symbol),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Assignment
    // ==========================================================================

    setq_form: $ => prec(6, seq(
      '(', choice('setq', 'SETQ', 'psetq', 'PSETQ'),
      repeat($._form),
      ')'
    )),

    setf_form: $ => prec(6, seq(
      '(', choice('setf', 'SETF', 'psetf', 'PSETF'),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Generic List (fallback for function calls and other forms)
    // ==========================================================================

    list: $ => prec(1, seq('(', repeat($._form), ')')),

    // ==========================================================================
    // Atoms
    // ==========================================================================

    _atom: $ => choice(
      $.symbol,
      $.keyword,
      $.uninterned_symbol,
      $.number,
      $.string,
      $.character,
      $.quote,
      $.backquote,
      $.unquote,
      $.unquote_splicing,
      $.function_quote,
      $.vector,
      $.array,
      $.pathname,
    ),

    symbol: $ => token(choice(
      /[a-zA-Z_*+!\-<>=&%@$?\/][a-zA-Z0-9_*+!\-<>=&%@$?\/.]*/,
      /\|[^|]*\|/,
    )),

    keyword: $ => /:[a-zA-Z_*+!\-<>=&%@$?\/][a-zA-Z0-9_*+!\-<>=&%@$?\/.]*/,

    // Uninterned symbols: #:foo
    uninterned_symbol: $ => /#:[a-zA-Z_*+!\-<>=&%@$?\/][a-zA-Z0-9_*+!\-<>=&%@$?\/.]*/,

    number: $ => token(choice(
      /[+-]?[0-9]+/,
      /[+-]?[0-9]*\.[0-9]+([eEdDsSlL][+-]?[0-9]+)?/,
      /[+-]?[0-9]+\/[0-9]+/,
      /#[bBoOxX][0-9a-fA-F]+/,
      /#[0-9]+[rR][0-9a-zA-Z]+/,
    )),

    string: $ => seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),

    character: $ => choice(/#\\./, /#\\[a-zA-Z]+/),

    quote: $ => seq("'", $._form),
    backquote: $ => seq('`', $._form),
    unquote: $ => seq(',', $._form),
    unquote_splicing: $ => seq(',@', $._form),
    function_quote: $ => seq("#'", $._form),
    vector: $ => seq('#(', repeat($._form), ')'),
    // Multi-dimensional arrays: #2A((1 2) (3 4))
    array: $ => seq(/#[0-9]+[aA]/, $._form),
    // Pathname: #p"/path/to/file"
    pathname: $ => seq(/#[pP]/, $.string),

    // ==========================================================================
    // Comments
    // ==========================================================================

    comment: $ => /;[^\n]*/,
    block_comment: $ => seq('#|', /([^|]|\|[^#])*/, '|#'),
  },
});
