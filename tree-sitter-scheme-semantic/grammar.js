/**
 * Semantic Tree-sitter grammar for Scheme (R5RS/R6RS/R7RS)
 *
 * Unlike generic s-expression grammars, this produces semantic node types:
 * - define_function, define_variable, define_syntax
 * - lambda_expression
 * - let_expression, let_star_expression, letrec_expression
 * - if_expression, cond_expression, case_expression
 * - do_expression (loops)
 * - begin_expression, set_expression
 * - quote_expression, quasiquote_expression
 *
 * Compatible with R5RS, R6RS, and R7RS Scheme standards.
 */

module.exports = grammar({
  name: 'scheme_semantic',

  extras: $ => [
    /\s/,
    $.comment,
    $.block_comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.define_function, $.define_variable],
    [$.let_expression, $.named_let],
  ],

  rules: {
    // ==========================================================================
    // Top Level
    // ==========================================================================

    source_file: $ => repeat($._datum),

    _datum: $ => choice(
      $._simple_datum,
      $._compound_datum,
      $._form,
    ),

    // ==========================================================================
    // Semantic Forms (high precedence)
    // ==========================================================================

    _form: $ => choice(
      // Definitions
      $.define_function,
      $.define_variable,
      $.define_syntax,
      $.define_values,
      $.define_record_type,
      $.define_library,

      // Lambda and procedures
      $.lambda_expression,

      // Binding forms
      $.let_expression,
      $.let_star_expression,
      $.letrec_expression,
      $.letrec_star_expression,
      $.let_values_expression,
      $.let_syntax_expression,
      $.letrec_syntax_expression,
      $.named_let,
      $.parameterize_expression,

      // Conditionals
      $.if_expression,
      $.cond_expression,
      $.case_expression,
      $.when_expression,
      $.unless_expression,
      $.and_expression,
      $.or_expression,

      // Iteration
      $.do_expression,

      // Sequencing
      $.begin_expression,

      // Assignment
      $.set_expression,

      // Quoting
      $.quote_expression,
      $.quasiquote_expression,
      $.unquote_expression,
      $.unquote_splicing_expression,

      // Module system (R6RS/R7RS)
      $.import_expression,
      $.export_expression,
      $.library_expression,

      // Exception handling
      $.guard_expression,
      $.with_exception_handler,
      $.raise_expression,

      // Delay/force
      $.delay_expression,
      $.force_expression,

      // Call/cc
      $.call_cc_expression,

      // Generic call (fallback)
      $.call_expression,

      // Generic list (lowest precedence fallback)
      $.list,
    ),

    // ==========================================================================
    // Definitions
    // ==========================================================================

    // (define (name args...) body...)
    define_function: $ => prec(10, seq(
      '(',
      'define',
      seq(
        '(',
        field('name', $.identifier),
        field('params', repeat(choice($.identifier, $.rest_param))),
        ')',
      ),
      field('body', repeat1($._datum)),
      ')',
    )),

    // (define name value)
    define_variable: $ => prec(9, seq(
      '(',
      'define',
      field('name', $.identifier),
      field('value', $._datum),
      ')',
    )),

    // (define-syntax name transformer)
    define_syntax: $ => prec(10, seq(
      '(',
      'define-syntax',
      field('name', $.identifier),
      field('transformer', $._datum),
      ')',
    )),

    // (define-values (name...) expr)
    define_values: $ => prec(10, seq(
      '(',
      'define-values',
      '(',
      field('names', repeat($.identifier)),
      ')',
      field('expr', $._datum),
      ')',
    )),

    // (define-record-type name ...)  R6RS/R7RS
    define_record_type: $ => prec(10, seq(
      '(',
      'define-record-type',
      field('name', $.identifier),
      repeat($._datum),
      ')',
    )),

    // (define-library name ...)  R7RS
    define_library: $ => prec(10, seq(
      '(',
      'define-library',
      field('name', $._datum),
      repeat($._datum),
      ')',
    )),

    // ==========================================================================
    // Lambda
    // ==========================================================================

    lambda_expression: $ => prec(8, seq(
      '(',
      'lambda',
      field('params', $.formals),
      field('body', repeat1($._datum)),
      ')',
    )),

    formals: $ => choice(
      seq('(', repeat(choice($.identifier, $.rest_param)), ')'),
      $.identifier,  // (lambda x body) - single var captures all args
    ),

    rest_param: $ => seq('.', $.identifier),

    // ==========================================================================
    // Binding Forms
    // ==========================================================================

    let_expression: $ => prec(7, seq(
      '(',
      'let',
      '(',
      field('bindings', repeat($.binding)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    // Named let: (let name ((var init) ...) body)
    named_let: $ => prec(8, seq(
      '(',
      'let',
      field('name', $.identifier),
      '(',
      field('bindings', repeat($.binding)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    let_star_expression: $ => prec(7, seq(
      '(',
      'let*',
      '(',
      field('bindings', repeat($.binding)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    letrec_expression: $ => prec(7, seq(
      '(',
      'letrec',
      '(',
      field('bindings', repeat($.binding)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    letrec_star_expression: $ => prec(7, seq(
      '(',
      'letrec*',
      '(',
      field('bindings', repeat($.binding)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    let_values_expression: $ => prec(7, seq(
      '(',
      'let-values',
      '(',
      field('bindings', repeat($.mv_binding)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    let_syntax_expression: $ => prec(7, seq(
      '(',
      'let-syntax',
      '(',
      field('bindings', repeat($.syntax_binding)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    letrec_syntax_expression: $ => prec(7, seq(
      '(',
      'letrec-syntax',
      '(',
      field('bindings', repeat($.syntax_binding)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    parameterize_expression: $ => prec(7, seq(
      '(',
      'parameterize',
      '(',
      field('bindings', repeat($.binding)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    binding: $ => seq('(', $.identifier, $._datum, ')'),

    mv_binding: $ => seq('(', $.formals, $._datum, ')'),

    syntax_binding: $ => seq('(', $.identifier, $._datum, ')'),

    // ==========================================================================
    // Conditionals
    // ==========================================================================

    if_expression: $ => prec(6, seq(
      '(',
      'if',
      field('condition', $._datum),
      field('then', $._datum),
      optional(field('else', $._datum)),
      ')',
    )),

    cond_expression: $ => prec(6, seq(
      '(',
      'cond',
      field('clauses', repeat1($.cond_clause)),
      ')',
    )),

    cond_clause: $ => choice(
      seq('(', 'else', repeat1($._datum), ')'),
      seq('(', $._datum, '=>', $._datum, ')'),
      seq('(', $._datum, repeat($._datum), ')'),
    ),

    case_expression: $ => prec(6, seq(
      '(',
      'case',
      field('key', $._datum),
      field('clauses', repeat1($.case_clause)),
      ')',
    )),

    case_clause: $ => choice(
      seq('(', 'else', repeat1($._datum), ')'),
      seq('(', '(', repeat($._datum), ')', repeat1($._datum), ')'),
    ),

    when_expression: $ => prec(6, seq(
      '(',
      'when',
      field('condition', $._datum),
      field('body', repeat1($._datum)),
      ')',
    )),

    unless_expression: $ => prec(6, seq(
      '(',
      'unless',
      field('condition', $._datum),
      field('body', repeat1($._datum)),
      ')',
    )),

    and_expression: $ => prec(5, seq(
      '(',
      'and',
      repeat($._datum),
      ')',
    )),

    or_expression: $ => prec(5, seq(
      '(',
      'or',
      repeat($._datum),
      ')',
    )),

    // ==========================================================================
    // Iteration
    // ==========================================================================

    do_expression: $ => prec(6, seq(
      '(',
      'do',
      '(',
      field('bindings', repeat($.do_binding)),
      ')',
      '(',
      field('test', $._datum),
      field('result', repeat($._datum)),
      ')',
      field('commands', repeat($._datum)),
      ')',
    )),

    do_binding: $ => seq(
      '(',
      $.identifier,
      $._datum,  // init
      optional($._datum),  // step
      ')',
    ),

    // ==========================================================================
    // Sequencing and Assignment
    // ==========================================================================

    begin_expression: $ => prec(5, seq(
      '(',
      'begin',
      field('body', repeat($._datum)),
      ')',
    )),

    set_expression: $ => prec(6, seq(
      '(',
      'set!',
      field('name', $.identifier),
      field('value', $._datum),
      ')',
    )),

    // ==========================================================================
    // Quoting
    // ==========================================================================

    quote_expression: $ => prec(6, choice(
      seq('(', 'quote', $._datum, ')'),
      seq("'", $._datum),
    )),

    quasiquote_expression: $ => prec(6, choice(
      seq('(', 'quasiquote', $._datum, ')'),
      seq('`', $._datum),
    )),

    unquote_expression: $ => prec(6, choice(
      seq('(', 'unquote', $._datum, ')'),
      seq(',', $._datum),
    )),

    unquote_splicing_expression: $ => prec(6, choice(
      seq('(', 'unquote-splicing', $._datum, ')'),
      seq(',@', $._datum),
    )),

    // ==========================================================================
    // Module System (R6RS/R7RS)
    // ==========================================================================

    library_expression: $ => prec(10, seq(
      '(',
      'library',
      field('name', $._datum),
      repeat($._datum),
      ')',
    )),

    import_expression: $ => prec(6, seq(
      '(',
      'import',
      field('specs', repeat($._datum)),
      ')',
    )),

    export_expression: $ => prec(6, seq(
      '(',
      'export',
      field('specs', repeat($._datum)),
      ')',
    )),

    // ==========================================================================
    // Exception Handling (R6RS/R7RS)
    // ==========================================================================

    guard_expression: $ => prec(6, seq(
      '(',
      'guard',
      '(',
      field('var', $.identifier),
      field('clauses', repeat($.cond_clause)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    with_exception_handler: $ => prec(6, seq(
      '(',
      'with-exception-handler',
      field('handler', $._datum),
      field('thunk', $._datum),
      ')',
    )),

    raise_expression: $ => prec(6, seq(
      '(',
      choice('raise', 'raise-continuable'),
      field('obj', $._datum),
      ')',
    )),

    // ==========================================================================
    // Delay/Force
    // ==========================================================================

    delay_expression: $ => prec(6, seq(
      '(',
      choice('delay', 'delay-force'),
      field('expr', $._datum),
      ')',
    )),

    force_expression: $ => prec(6, seq(
      '(',
      'force',
      field('promise', $._datum),
      ')',
    )),

    // ==========================================================================
    // Continuations
    // ==========================================================================

    call_cc_expression: $ => prec(6, seq(
      '(',
      choice('call-with-current-continuation', 'call/cc'),
      field('proc', $._datum),
      ')',
    )),

    // ==========================================================================
    // Generic Call (fallback)
    // ==========================================================================

    call_expression: $ => prec(2, seq(
      '(',
      field('function', $._datum),
      field('arguments', repeat($._datum)),
      ')',
    )),

    // ==========================================================================
    // Lists, Vectors, Bytevectors
    // ==========================================================================

    list: $ => prec(1, seq(
      '(',
      repeat($._datum),
      ')',
    )),

    vector: $ => seq(
      '#(',
      repeat($._datum),
      ')',
    ),

    bytevector: $ => seq(
      '#u8(',
      repeat($.number),
      ')',
    ),

    // ==========================================================================
    // Simple Data
    // ==========================================================================

    _simple_datum: $ => choice(
      $.boolean,
      $.number,
      $.character,
      $.string,
      $.identifier,
    ),

    _compound_datum: $ => choice(
      $.vector,
      $.bytevector,
    ),

    boolean: $ => choice('#t', '#f', '#true', '#false'),

    number: $ => token(choice(
      // Integer (with optional radix)
      /[+-]?[0-9]+/,
      /#[bdox][+-]?[0-9a-fA-F]+/,
      // Rational
      /[+-]?[0-9]+\/[0-9]+/,
      // Floating point
      /[+-]?[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/,
      /[+-]?[0-9]+\.[0-9]*([eE][+-]?[0-9]+)?/,
      /[+-]?[0-9]+[eE][+-]?[0-9]+/,
      // Complex
      /[+-]?[0-9]+(\.[0-9]+)?[+-][0-9]+(\.[0-9]+)?i/,
      /[+-]?[0-9]+(\.[0-9]+)?i/,
      // Special
      /[+-]inf\.0/,
      /[+-]nan\.0/,
    )),

    character: $ => choice(
      /#\\./,
      /#\\newline/,
      /#\\space/,
      /#\\tab/,
      /#\\alarm/,
      /#\\backspace/,
      /#\\delete/,
      /#\\escape/,
      /#\\null/,
      /#\\return/,
      /#\\x[0-9a-fA-F]+/,
    ),

    string: $ => seq(
      '"',
      repeat(choice(
        /[^"\\]/,
        $.escape_sequence,
      )),
      '"',
    ),

    escape_sequence: $ => token(choice(
      /\\[abtnvfr"\\]/,
      /\\x[0-9a-fA-F]+;/,
      /\\\n\s*/,  // line continuation
    )),

    identifier: $ => token(choice(
      // Regular identifier
      /[a-zA-Z!$%&*+\-./:<=>?@^_~][a-zA-Z0-9!$%&*+\-./:<=>?@^_~]*/,
      // Peculiar identifiers
      '+', '-', '...', '->',
      /\|[^|]*\|/,  // Vertical bar notation
    )),

    // ==========================================================================
    // Comments
    // ==========================================================================

    comment: $ => token(choice(
      /;[^\n]*/,
      /#;/,  // Datum comment prefix
    )),

    block_comment: $ => token(seq(
      '#|',
      /([^|#]|\|[^#]|#[^|])*/,
      '|#',
    )),
  },
});
