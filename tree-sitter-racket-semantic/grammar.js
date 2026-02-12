/**
 * Semantic Tree-sitter grammar for Racket
 *
 * Extends Scheme with Racket-specific forms:
 * - struct, class, interface, mixin
 * - module, module+, module*, submodule
 * - define/contract, define/match
 * - match, match*, match-let
 * - for, for/list, for/vector, for/hash, etc.
 * - require, provide
 * - syntax-parse, syntax-case, syntax-rules
 */

module.exports = grammar({
  name: 'racket_semantic',

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

    source_file: $ => seq(
      optional($.lang_line),
      repeat($._datum),
    ),

    lang_line: $ => seq('#lang', $.identifier),

    _datum: $ => choice(
      $._simple_datum,
      $._compound_datum,
      $._form,
    ),

    // ==========================================================================
    // Semantic Forms
    // ==========================================================================

    _form: $ => choice(
      // Racket-specific definitions
      $.module_form,
      $.module_plus_form,
      $.module_star_form,
      $.struct_form,
      $.class_form,
      $.interface_form,
      $.mixin_form,
      $.define_contract_form,
      $.define_match_form,

      // Standard definitions (from Scheme)
      $.define_function,
      $.define_variable,
      $.define_syntax,
      $.define_values,

      // Lambda
      $.lambda_expression,
      $.case_lambda_expression,

      // Binding forms (Scheme + Racket extensions)
      $.let_expression,
      $.let_star_expression,
      $.letrec_expression,
      $.letrec_star_expression,
      $.let_values_expression,
      $.let_star_values_expression,
      $.let_syntax_expression,
      $.letrec_syntax_expression,
      $.named_let,
      $.parameterize_expression,
      $.match_let_expression,

      // Conditionals
      $.if_expression,
      $.cond_expression,
      $.case_expression,
      $.when_expression,
      $.unless_expression,
      $.and_expression,
      $.or_expression,

      // Pattern matching (Racket-specific)
      $.match_expression,
      $.match_star_expression,
      $.match_lambda_expression,

      // Iteration (Racket for comprehensions)
      $.for_expression,
      $.for_list_expression,
      $.for_vector_expression,
      $.for_hash_expression,
      $.for_star_expression,
      $.do_expression,

      // Sequencing
      $.begin_expression,
      $.begin0_expression,

      // Assignment
      $.set_expression,

      // Quoting
      $.quote_expression,
      $.quasiquote_expression,
      $.unquote_expression,
      $.unquote_splicing_expression,
      $.syntax_expression,
      $.quasisyntax_expression,

      // Module system
      $.require_form,
      $.provide_form,

      // Macros (Racket-specific)
      $.syntax_parse_form,
      $.syntax_case_form,
      $.syntax_rules_form,
      $.with_syntax_form,

      // Contracts
      $.contract_out_form,

      // Exception handling
      $.with_handlers_form,
      $.raise_expression,

      // Generic call (fallback)
      $.call_expression,

      // Generic list (lowest precedence)
      $.list,
    ),

    // ==========================================================================
    // Racket-Specific Definitions
    // ==========================================================================

    // #lang racket
    // (module name racket body...)
    module_form: $ => prec(12, seq(
      '(',
      'module',
      field('name', $.identifier),
      field('language', $._datum),
      field('body', repeat($._datum)),
      ')',
    )),

    // (module+ test body...)
    module_plus_form: $ => prec(12, seq(
      '(',
      'module+',
      field('name', $.identifier),
      field('body', repeat($._datum)),
      ')',
    )),

    // (module* name #f body...)
    module_star_form: $ => prec(12, seq(
      '(',
      'module*',
      field('name', choice($.identifier, '#f')),
      field('language', optional($._datum)),
      field('body', repeat($._datum)),
      ')',
    )),

    // (struct name (fields...) options...)
    struct_form: $ => prec(11, seq(
      '(',
      'struct',
      field('name', $.identifier),
      optional(field('super', $.identifier)),
      '(',
      field('fields', repeat(choice($.identifier, $.field_spec))),
      ')',
      field('options', repeat($._datum)),
      ')',
    )),

    field_spec: $ => seq('[', $.identifier, repeat($._datum), ']'),

    // (class superclass body...)
    class_form: $ => prec(11, seq(
      '(',
      'class',
      field('superclass', $._datum),
      field('body', repeat($._datum)),
      ')',
    )),

    // (interface (supers...) methods...)
    interface_form: $ => prec(11, seq(
      '(',
      'interface',
      '(',
      field('supers', repeat($._datum)),
      ')',
      field('methods', repeat($.identifier)),
      ')',
    )),

    // (mixin (interfaces...) body...)
    mixin_form: $ => prec(11, seq(
      '(',
      'mixin',
      '(',
      field('interfaces', repeat($._datum)),
      ')',
      field('body', repeat($._datum)),
      ')',
    )),

    // (define/contract (name args) contract body...)
    define_contract_form: $ => prec(10, seq(
      '(',
      'define/contract',
      choice(
        seq('(', field('name', $.identifier), field('params', repeat($._datum)), ')'),
        field('name', $.identifier),
      ),
      field('contract', $._datum),
      field('body', repeat1($._datum)),
      ')',
    )),

    // (define/match (name args) clauses...)
    define_match_form: $ => prec(10, seq(
      '(',
      'define/match',
      '(',
      field('name', $.identifier),
      field('params', repeat($._datum)),
      ')',
      field('clauses', repeat($.match_clause)),
      ')',
    )),

    // ==========================================================================
    // Standard Definitions (Scheme-compatible)
    // ==========================================================================

    define_function: $ => prec(10, seq(
      '(',
      'define',
      '(',
      field('name', $.identifier),
      field('params', repeat(choice($.identifier, $.rest_param))),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    define_variable: $ => prec(9, seq(
      '(',
      'define',
      field('name', $.identifier),
      field('value', $._datum),
      ')',
    )),

    define_syntax: $ => prec(10, seq(
      '(',
      choice('define-syntax', 'define-syntax-rule'),
      field('name', $.identifier),
      field('transformer', $._datum),
      ')',
    )),

    define_values: $ => prec(10, seq(
      '(',
      'define-values',
      '(',
      field('names', repeat($.identifier)),
      ')',
      field('expr', $._datum),
      ')',
    )),

    // ==========================================================================
    // Lambda
    // ==========================================================================

    lambda_expression: $ => prec(8, seq(
      '(',
      choice('lambda', 'λ'),
      field('params', $.formals),
      field('body', repeat1($._datum)),
      ')',
    )),

    case_lambda_expression: $ => prec(8, seq(
      '(',
      'case-lambda',
      field('clauses', repeat($.case_lambda_clause)),
      ')',
    )),

    case_lambda_clause: $ => seq(
      '[',
      $.formals,
      repeat1($._datum),
      ']',
    ),

    formals: $ => choice(
      seq('(', repeat(choice($.identifier, $.rest_param)), ')'),
      $.identifier,
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

    let_star_values_expression: $ => prec(7, seq(
      '(',
      'let*-values',
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

    match_let_expression: $ => prec(7, seq(
      '(',
      choice('match-let', 'match-let*'),
      '(',
      field('bindings', repeat($.match_binding)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    binding: $ => choice(
      seq('(', $.identifier, $._datum, ')'),
      seq('[', $.identifier, $._datum, ']'),
    ),

    mv_binding: $ => choice(
      seq('(', $.formals, $._datum, ')'),
      seq('[', $.formals, $._datum, ']'),
    ),

    syntax_binding: $ => choice(
      seq('(', $.identifier, $._datum, ')'),
      seq('[', $.identifier, $._datum, ']'),
    ),

    match_binding: $ => choice(
      seq('(', $._datum, $._datum, ')'),
      seq('[', $._datum, $._datum, ']'),
    ),

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
      seq('[', 'else', repeat1($._datum), ']'),
      seq('(', 'else', repeat1($._datum), ')'),
      seq('[', $._datum, '=>', $._datum, ']'),
      seq('(', $._datum, '=>', $._datum, ')'),
      seq('[', $._datum, repeat($._datum), ']'),
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
      seq('[', 'else', repeat1($._datum), ']'),
      seq('(', 'else', repeat1($._datum), ')'),
      seq('[', '(', repeat($._datum), ')', repeat1($._datum), ']'),
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

    and_expression: $ => prec(5, seq('(', 'and', repeat($._datum), ')')),

    or_expression: $ => prec(5, seq('(', 'or', repeat($._datum), ')')),

    // ==========================================================================
    // Pattern Matching (Racket-specific)
    // ==========================================================================

    match_expression: $ => prec(6, seq(
      '(',
      'match',
      field('expr', $._datum),
      field('clauses', repeat1($.match_clause)),
      ')',
    )),

    match_star_expression: $ => prec(6, seq(
      '(',
      'match*',
      '(',
      field('exprs', repeat($._datum)),
      ')',
      field('clauses', repeat1($.match_multi_clause)),
      ')',
    )),

    match_lambda_expression: $ => prec(6, seq(
      '(',
      choice('match-lambda', 'match-lambda*', 'match-lambda**'),
      field('clauses', repeat1($.match_clause)),
      ')',
    )),

    match_clause: $ => choice(
      seq('[', field('pattern', $._datum), field('body', repeat1($._datum)), ']'),
      seq('(', field('pattern', $._datum), field('body', repeat1($._datum)), ')'),
    ),

    match_multi_clause: $ => choice(
      seq('[', '(', field('patterns', repeat($._datum)), ')', field('body', repeat1($._datum)), ']'),
      seq('(', '(', field('patterns', repeat($._datum)), ')', field('body', repeat1($._datum)), ')'),
    ),

    // ==========================================================================
    // Iteration (Racket for comprehensions)
    // ==========================================================================

    for_expression: $ => prec(6, seq(
      '(',
      'for',
      '(',
      field('clauses', repeat($.for_clause)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    for_list_expression: $ => prec(6, seq(
      '(',
      choice('for/list', 'for*/list'),
      '(',
      field('clauses', repeat($.for_clause)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    for_vector_expression: $ => prec(6, seq(
      '(',
      choice('for/vector', 'for*/vector'),
      '(',
      field('clauses', repeat($.for_clause)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    for_hash_expression: $ => prec(6, seq(
      '(',
      choice('for/hash', 'for*/hash', 'for/hasheq', 'for*/hasheq'),
      '(',
      field('clauses', repeat($.for_clause)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    for_star_expression: $ => prec(6, seq(
      '(',
      'for*',
      '(',
      field('clauses', repeat($.for_clause)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    for_clause: $ => choice(
      seq('[', $.identifier, $._datum, ']'),
      seq('(', $.identifier, $._datum, ')'),
      seq('[', '(', repeat($.identifier), ')', $._datum, ']'),
      seq('#:when', $._datum),
      seq('#:unless', $._datum),
      seq('#:break', $._datum),
      seq('#:final', $._datum),
    ),

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

    do_binding: $ => seq('(', $.identifier, $._datum, optional($._datum), ')'),

    // ==========================================================================
    // Sequencing
    // ==========================================================================

    begin_expression: $ => prec(5, seq('(', 'begin', field('body', repeat($._datum)), ')')),

    begin0_expression: $ => prec(5, seq('(', 'begin0', field('first', $._datum), field('rest', repeat($._datum)), ')')),

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

    syntax_expression: $ => prec(6, choice(
      seq('(', 'syntax', $._datum, ')'),
      seq('#\'', $._datum),
    )),

    quasisyntax_expression: $ => prec(6, choice(
      seq('(', 'quasisyntax', $._datum, ')'),
      seq('#`', $._datum),
    )),

    // ==========================================================================
    // Module System
    // ==========================================================================

    require_form: $ => prec(6, seq(
      '(',
      'require',
      field('specs', repeat($._datum)),
      ')',
    )),

    provide_form: $ => prec(6, seq(
      '(',
      'provide',
      field('specs', repeat($._datum)),
      ')',
    )),

    contract_out_form: $ => prec(6, seq(
      '(',
      'contract-out',
      repeat($._datum),
      ')',
    )),

    // ==========================================================================
    // Macro Forms
    // ==========================================================================

    syntax_parse_form: $ => prec(6, seq(
      '(',
      'syntax-parse',
      field('stx', $._datum),
      field('options', repeat($.syntax_parse_option)),
      field('clauses', repeat($.syntax_clause)),
      ')',
    )),

    syntax_parse_option: $ => choice(
      seq('#:datum-literals', '(', repeat($.identifier), ')'),
      seq('#:literal-sets', '(', repeat($._datum), ')'),
      seq('#:conventions', '(', repeat($._datum), ')'),
    ),

    syntax_case_form: $ => prec(6, seq(
      '(',
      'syntax-case',
      field('stx', $._datum),
      '(',
      field('literals', repeat($.identifier)),
      ')',
      field('clauses', repeat($.syntax_clause)),
      ')',
    )),

    syntax_rules_form: $ => prec(6, seq(
      '(',
      'syntax-rules',
      '(',
      field('literals', repeat($.identifier)),
      ')',
      field('clauses', repeat($.syntax_rule_clause)),
      ')',
    )),

    with_syntax_form: $ => prec(6, seq(
      '(',
      'with-syntax',
      '(',
      field('bindings', repeat($.syntax_binding)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    syntax_clause: $ => choice(
      seq('[', field('pattern', $._datum), field('guard', optional(seq('#:when', $._datum))), field('body', repeat1($._datum)), ']'),
      seq('(', field('pattern', $._datum), field('body', repeat1($._datum)), ')'),
    ),

    syntax_rule_clause: $ => seq('(', $._datum, $._datum, ')'),

    // ==========================================================================
    // Exception Handling
    // ==========================================================================

    with_handlers_form: $ => prec(6, seq(
      '(',
      choice('with-handlers', 'with-handlers*'),
      '(',
      field('handlers', repeat($.handler_clause)),
      ')',
      field('body', repeat1($._datum)),
      ')',
    )),

    handler_clause: $ => choice(
      seq('[', $._datum, $._datum, ']'),
      seq('(', $._datum, $._datum, ')'),
    ),

    raise_expression: $ => prec(6, seq(
      '(',
      choice('raise', 'raise-argument-error', 'raise-user-error', 'error'),
      field('args', repeat($._datum)),
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
    // Data
    // ==========================================================================

    list: $ => prec(1, seq('(', repeat($._datum), ')')),

    vector: $ => seq('#(', repeat($._datum), ')'),

    hash: $ => seq(choice('#hash', '#hasheq', '#hasheqv'), '(', repeat($.hash_pair), ')'),

    hash_pair: $ => seq('(', $._datum, '.', $._datum, ')'),

    box: $ => seq('#&', $._datum),

    _simple_datum: $ => choice(
      $.boolean,
      $.number,
      $.character,
      $.string,
      $.identifier,
      $.keyword,
    ),

    _compound_datum: $ => choice(
      $.vector,
      $.hash,
      $.box,
    ),

    boolean: $ => choice('#t', '#f', '#true', '#false'),

    number: $ => token(choice(
      /[+-]?[0-9]+/,
      /#[bdoxe][+-]?[0-9a-fA-F]+/,
      /[+-]?[0-9]+\/[0-9]+/,
      /[+-]?[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/,
      /[+-]?[0-9]+\.[0-9]*([eE][+-]?[0-9]+)?/,
      /[+-]?[0-9]+[eE][+-]?[0-9]+/,
      /[+-]?[0-9]+(\.[0-9]+)?[+-][0-9]+(\.[0-9]+)?i/,
      /[+-]?[0-9]+(\.[0-9]+)?i/,
      /[+-]inf\.0/,
      /[+-]nan\.0/,
    )),

    character: $ => choice(
      /#\\./,
      /#\\newline/,
      /#\\space/,
      /#\\tab/,
      /#\\u[0-9a-fA-F]{1,6}/,
    ),

    string: $ => seq(
      '"',
      repeat(choice(/[^"\\]/, $.escape_sequence)),
      '"',
    ),

    escape_sequence: $ => token(choice(
      /\\[abtnvfr"\\]/,
      /\\x[0-9a-fA-F]{1,2}/,
      /\\u[0-9a-fA-F]{1,4}/,
      /\\\n\s*/,
    )),

    identifier: $ => token(choice(
      /[a-zA-Z!$%&*+\-./:<=>?@^_~][a-zA-Z0-9!$%&*+\-./:<=>?@^_~]*/,
      '+', '-', '...', '->',
      /\|[^|]*\|/,
    )),

    keyword: $ => /#:[a-zA-Z0-9!$%&*+\-./<=>?@^_~]+/,

    // ==========================================================================
    // Comments
    // ==========================================================================

    comment: $ => token(choice(
      /;[^\n]*/,
      /#;/,
    )),

    block_comment: $ => token(seq(
      '#|',
      /([^|#]|\|[^#]|#[^|])*/,
      '|#',
    )),
  },
});
