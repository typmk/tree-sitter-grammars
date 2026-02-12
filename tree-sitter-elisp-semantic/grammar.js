/**
 * Semantic Tree-sitter grammar for Emacs Lisp
 *
 * Recognizes forms by their leading keyword, extracts names.
 * Handles both standard Elisp and cl-lib extensions.
 */

module.exports = grammar({
  name: 'elisp_semantic',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  word: $ => $.symbol,

  rules: {
    source_file: $ => repeat($._form),

    _form: $ => choice(
      // Function/Macro definitions (highest precedence)
      $.defun_form,
      $.defmacro_form,
      $.defsubst_form,
      $.cl_defun_form,
      $.cl_defmacro_form,
      $.cl_defsubst_form,
      $.defadvice_form,

      // Variable definitions
      $.defvar_form,
      $.defconst_form,
      $.defcustom_form,
      $.defvaralias_form,

      // Type/Class definitions (EIEIO, cl-lib)
      $.defclass_form,
      $.cl_defstruct_form,
      $.cl_deftype_form,
      $.defmethod_form,
      $.cl_defmethod_form,
      $.defgeneric_form,
      $.cl_defgeneric_form,

      // Group/Face definitions
      $.defgroup_form,
      $.defface_form,
      $.deftheme_form,

      // Mode definitions
      $.define_minor_mode_form,
      $.define_derived_mode_form,
      $.define_generic_mode_form,
      $.define_globalized_minor_mode_form,

      // Package/Module
      $.provide_form,
      $.require_form,

      // Binding forms
      $.let_form,
      $.let_star_form,
      $.cl_let_form,
      $.cl_flet_form,
      $.cl_labels_form,
      $.cl_macrolet_form,

      // Conditionals
      $.if_form,
      $.when_form,
      $.unless_form,
      $.cond_form,
      $.cl_case_form,
      $.cl_ecase_form,
      $.cl_typecase_form,
      $.pcase_form,

      // Loops
      $.while_form,
      $.dolist_form,
      $.dotimes_form,
      $.cl_loop_form,
      $.cl_do_form,

      // Sequencing
      $.progn_form,
      $.prog1_form,
      $.prog2_form,
      $.save_excursion_form,
      $.save_restriction_form,
      $.with_current_buffer_form,
      $.with_temp_buffer_form,

      // Exception handling
      $.condition_case_form,
      $.unwind_protect_form,
      $.ignore_errors_form,

      // Lambda
      $.lambda_form,

      // Interactive
      $.interactive_form,

      // Assignment
      $.setq_form,
      $.setq_local_form,
      $.setf_form,

      // Generic list (lowest precedence)
      $.list,
      $._atom,
    ),

    // ==========================================================================
    // Function Definitions
    // ==========================================================================

    defun_form: $ => prec(10, seq(
      '(', 'defun',
      field('name', $.symbol),
      field('params', $.list),
      optional(field('docstring', $.string)),
      optional($.interactive_form),
      repeat($._form),
      ')'
    )),

    defmacro_form: $ => prec(10, seq(
      '(', 'defmacro',
      field('name', $.symbol),
      field('params', $.list),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    defsubst_form: $ => prec(10, seq(
      '(', 'defsubst',
      field('name', $.symbol),
      field('params', $.list),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    cl_defun_form: $ => prec(10, seq(
      '(', 'cl-defun',
      field('name', $.symbol),
      field('params', $.list),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    cl_defmacro_form: $ => prec(10, seq(
      '(', 'cl-defmacro',
      field('name', $.symbol),
      field('params', $.list),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    cl_defsubst_form: $ => prec(10, seq(
      '(', 'cl-defsubst',
      field('name', $.symbol),
      field('params', $.list),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    defadvice_form: $ => prec(10, seq(
      '(', 'defadvice',
      field('name', $.symbol),
      field('spec', $.list),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Variable Definitions
    // ==========================================================================

    defvar_form: $ => prec(10, seq(
      '(', 'defvar',
      field('name', $.symbol),
      optional($._form),
      optional(field('docstring', $.string)),
      ')'
    )),

    defconst_form: $ => prec(10, seq(
      '(', 'defconst',
      field('name', $.symbol),
      field('value', $._form),
      optional(field('docstring', $.string)),
      ')'
    )),

    defcustom_form: $ => prec(10, seq(
      '(', 'defcustom',
      field('name', $.symbol),
      field('value', $._form),
      optional(field('docstring', $.string)),
      repeat($._form),  // keyword args
      ')'
    )),

    defvaralias_form: $ => prec(10, seq(
      '(', 'defvaralias',
      field('name', $.symbol),
      field('target', $._form),
      optional(field('docstring', $.string)),
      ')'
    )),

    // ==========================================================================
    // Type/Class Definitions (EIEIO & cl-lib)
    // ==========================================================================

    defclass_form: $ => prec(10, seq(
      '(', 'defclass',
      field('name', $.symbol),
      field('superclasses', $.list),
      field('slots', $.list),
      repeat($._form),  // class options
      ')'
    )),

    cl_defstruct_form: $ => prec(10, seq(
      '(', 'cl-defstruct',
      field('name', choice($.symbol, $.list)),  // can have options
      repeat($._form),  // slots
      ')'
    )),

    cl_deftype_form: $ => prec(10, seq(
      '(', 'cl-deftype',
      field('name', $.symbol),
      field('params', $.list),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    defmethod_form: $ => prec(10, seq(
      '(', 'defmethod',
      field('name', $.symbol),
      repeat($._form),
      ')'
    )),

    cl_defmethod_form: $ => prec(10, seq(
      '(', 'cl-defmethod',
      field('name', $.symbol),
      repeat($._form),
      ')'
    )),

    defgeneric_form: $ => prec(10, seq(
      '(', 'defgeneric',
      field('name', $.symbol),
      field('params', $.list),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    cl_defgeneric_form: $ => prec(10, seq(
      '(', 'cl-defgeneric',
      field('name', $.symbol),
      field('params', $.list),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Group/Face/Theme Definitions
    // ==========================================================================

    defgroup_form: $ => prec(10, seq(
      '(', 'defgroup',
      field('name', $.symbol),
      field('value', $._form),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    defface_form: $ => prec(10, seq(
      '(', 'defface',
      field('name', $.symbol),
      field('spec', $._form),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    deftheme_form: $ => prec(10, seq(
      '(', 'deftheme',
      field('name', $.symbol),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Mode Definitions
    // ==========================================================================

    define_minor_mode_form: $ => prec(10, seq(
      '(', 'define-minor-mode',
      field('name', $.symbol),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    define_derived_mode_form: $ => prec(10, seq(
      '(', 'define-derived-mode',
      field('name', $.symbol),
      field('parent', $.symbol),
      field('mode_name', $.string),
      optional(field('docstring', $.string)),
      repeat($._form),
      ')'
    )),

    define_generic_mode_form: $ => prec(10, seq(
      '(', 'define-generic-mode',
      field('name', $.symbol),
      repeat($._form),
      ')'
    )),

    define_globalized_minor_mode_form: $ => prec(10, seq(
      '(', 'define-globalized-minor-mode',
      field('name', $.symbol),
      field('local_mode', $.symbol),
      field('turn_on', $.symbol),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Package/Module
    // ==========================================================================

    provide_form: $ => prec(10, seq(
      '(', 'provide',
      field('feature', choice($.quote, $.symbol)),
      ')'
    )),

    require_form: $ => prec(10, seq(
      '(', 'require',
      field('feature', choice($.quote, $.symbol)),
      optional($._form),  // optional filename
      optional($._form),  // optional noerror
      ')'
    )),

    // ==========================================================================
    // Binding Forms
    // ==========================================================================

    let_form: $ => prec(8, seq(
      '(', 'let',
      field('bindings', $.list),
      repeat($._form),
      ')'
    )),

    let_star_form: $ => prec(8, seq(
      '(', 'let*',
      field('bindings', $.list),
      repeat($._form),
      ')'
    )),

    cl_let_form: $ => prec(8, seq(
      '(', 'cl-let',
      field('bindings', $.list),
      repeat($._form),
      ')'
    )),

    cl_flet_form: $ => prec(8, seq(
      '(', 'cl-flet',
      field('bindings', $.list),
      repeat($._form),
      ')'
    )),

    cl_labels_form: $ => prec(8, seq(
      '(', 'cl-labels',
      field('bindings', $.list),
      repeat($._form),
      ')'
    )),

    cl_macrolet_form: $ => prec(8, seq(
      '(', 'cl-macrolet',
      field('bindings', $.list),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Conditionals
    // ==========================================================================

    if_form: $ => prec(6, seq(
      '(', 'if',
      field('condition', $._form),
      field('then', $._form),
      optional(field('else', $._form)),
      ')'
    )),

    when_form: $ => prec(6, seq(
      '(', 'when',
      field('condition', $._form),
      repeat($._form),
      ')'
    )),

    unless_form: $ => prec(6, seq(
      '(', 'unless',
      field('condition', $._form),
      repeat($._form),
      ')'
    )),

    cond_form: $ => prec(6, seq(
      '(', 'cond',
      repeat($.list),
      ')'
    )),

    cl_case_form: $ => prec(6, seq(
      '(', 'cl-case',
      field('key', $._form),
      repeat($.list),
      ')'
    )),

    cl_ecase_form: $ => prec(6, seq(
      '(', 'cl-ecase',
      field('key', $._form),
      repeat($.list),
      ')'
    )),

    cl_typecase_form: $ => prec(6, seq(
      '(', 'cl-typecase',
      field('key', $._form),
      repeat($.list),
      ')'
    )),

    pcase_form: $ => prec(6, seq(
      '(', 'pcase',
      field('expr', $._form),
      repeat($.list),
      ')'
    )),

    // ==========================================================================
    // Loops
    // ==========================================================================

    while_form: $ => prec(6, seq(
      '(', 'while',
      field('condition', $._form),
      repeat($._form),
      ')'
    )),

    dolist_form: $ => prec(6, seq(
      '(', 'dolist',
      field('spec', $.list),
      repeat($._form),
      ')'
    )),

    dotimes_form: $ => prec(6, seq(
      '(', 'dotimes',
      field('spec', $.list),
      repeat($._form),
      ')'
    )),

    cl_loop_form: $ => prec(6, seq(
      '(', 'cl-loop',
      repeat($._form),
      ')'
    )),

    cl_do_form: $ => prec(6, seq(
      '(', choice('cl-do', 'cl-do*'),
      field('bindings', $.list),
      field('end_test', $.list),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Sequencing
    // ==========================================================================

    progn_form: $ => prec(5, seq(
      '(', 'progn',
      repeat($._form),
      ')'
    )),

    prog1_form: $ => prec(5, seq(
      '(', 'prog1',
      repeat($._form),
      ')'
    )),

    prog2_form: $ => prec(5, seq(
      '(', 'prog2',
      repeat($._form),
      ')'
    )),

    save_excursion_form: $ => prec(5, seq(
      '(', 'save-excursion',
      repeat($._form),
      ')'
    )),

    save_restriction_form: $ => prec(5, seq(
      '(', 'save-restriction',
      repeat($._form),
      ')'
    )),

    with_current_buffer_form: $ => prec(5, seq(
      '(', 'with-current-buffer',
      field('buffer', $._form),
      repeat($._form),
      ')'
    )),

    with_temp_buffer_form: $ => prec(5, seq(
      '(', 'with-temp-buffer',
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Exception Handling
    // ==========================================================================

    condition_case_form: $ => prec(6, seq(
      '(', 'condition-case',
      field('var', choice($.symbol, $.nil)),
      field('bodyform', $._form),
      repeat($.list),  // handlers
      ')'
    )),

    unwind_protect_form: $ => prec(6, seq(
      '(', 'unwind-protect',
      field('protected', $._form),
      repeat($._form),  // cleanup forms
      ')'
    )),

    ignore_errors_form: $ => prec(6, seq(
      '(', 'ignore-errors',
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Lambda
    // ==========================================================================

    lambda_form: $ => prec(8, seq(
      '(', 'lambda',
      field('params', $.list),
      optional(field('docstring', $.string)),
      optional($.interactive_form),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Interactive
    // ==========================================================================

    interactive_form: $ => prec(9, seq(
      '(', 'interactive',
      optional($._form),
      ')'
    )),

    // ==========================================================================
    // Assignment
    // ==========================================================================

    setq_form: $ => prec(6, seq(
      '(', 'setq',
      repeat($._form),
      ')'
    )),

    setq_local_form: $ => prec(6, seq(
      '(', 'setq-local',
      repeat($._form),
      ')'
    )),

    setf_form: $ => prec(6, seq(
      '(', choice('setf', 'cl-setf'),
      repeat($._form),
      ')'
    )),

    // ==========================================================================
    // Generic List (fallback)
    // ==========================================================================

    list: $ => prec(1, seq('(', repeat($._form), ')')),

    // ==========================================================================
    // Atoms
    // ==========================================================================

    _atom: $ => choice(
      $.symbol,
      $.keyword,
      $.number,
      $.string,
      $.character,
      $.quote,
      $.backquote,
      $.unquote,
      $.unquote_splice,
      $.function_quote,
      $.vector,
      $.nil,
      $.t,
    ),

    symbol: $ => token(choice(
      /[a-zA-Z_*+!\-<>=&%@$?\/:][a-zA-Z0-9_*+!\-<>=&%@$?\/:.]*/,
      /\\./,  // escaped character
    )),

    keyword: $ => /:[a-zA-Z_*+!\-<>=&%@$?\/:][a-zA-Z0-9_*+!\-<>=&%@$?\/:]*/,

    number: $ => token(choice(
      /[+-]?[0-9]+/,
      /[+-]?[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/,
      /#[xXoObB][0-9a-fA-F]+/,
    )),

    string: $ => seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),

    character: $ => /\?./,

    quote: $ => seq("'", $._form),
    backquote: $ => seq('`', $._form),
    unquote: $ => seq(',', $._form),
    unquote_splice: $ => seq(',@', $._form),
    function_quote: $ => seq("#'", $._form),
    vector: $ => seq('[', repeat($._form), ']'),

    nil: $ => 'nil',
    t: $ => 't',

    // ==========================================================================
    // Comments
    // ==========================================================================

    comment: $ => /;[^\n]*/,
  },
});
