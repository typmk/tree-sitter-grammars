/**
 * Tree-sitter grammar for Cranelift IR (CLIF)
 *
 * Based on Cranelift IR specification:
 * https://github.com/bytecodealliance/wasmtime/blob/main/cranelift/docs/ir.md
 *
 * Cranelift is a code generator used by Wasmtime and other projects.
 * CLIF files use .clif extension.
 */

module.exports = grammar({
  name: "clif",

  extras: $ => [
    /\s+/,
    $.comment,
  ],

  conflicts: $ => [
    [$.instruction],
    [$.basic_block],
    [$.instruction_operands],
    [$.memflags],
  ],

  rules: {
    source_file: $ => repeat(
      choice(
        $.function,
        $.test_directive,
      ),
    ),

    comment: $ => /;.*/,

    // Basic tokens
    identifier: $ => /[a-zA-Z_][a-zA-Z_0-9]*/,

    value: $ => /v\d+/,

    block: $ => /block\d+/,

    stack_slot: $ => /ss\d+/,

    global_value: $ => /gv\d+/,

    func_ref: $ => /fn\d+/,

    sig_ref: $ => /sig\d+/,

    heap: $ => /heap\d+/,

    table: $ => /table\d+/,

    jump_table: $ => /jt\d+/,

    constant: $ => /const\d+/,

    number: $ => choice(
      /[+-]?\d+/,
      /0[xX][0-9a-fA-F]+/,
    ),

    float_number: $ => choice(
      /0x[0-9a-fA-F]+\.[0-9a-fA-F]+p[+-]?\d+/,
      /[+-]?\d+\.\d*([eE][+-]?\d+)?/,
      /[+-]?Inf/,
      /[+-]?NaN(:0x[0-9a-fA-F]+)?/,
    ),

    // Types
    type: $ => choice(
      // Scalar integer types
      'i8', 'i16', 'i32', 'i64', 'i128',
      // Floating point types
      'f32', 'f64',
      // SIMD vector types
      /i8x\d+/, /i16x\d+/, /i32x\d+/, /i64x\d+/,
      /f32x\d+/, /f64x\d+/,
      // Reference types
      'r32', 'r64',
      // Boolean types (for flags)
      'b1',
      // Special types
      'iflags', 'fflags',
    ),

    // Function definition
    function: $ => seq(
      'function',
      optional('%'),
      field('name', $.identifier),
      field('signature', $.signature),
      optional($.function_flags),
      optional($.function_body),
    ),

    signature: $ => seq(
      '(',
      commaSep($.sig_param),
      ')',
      optional(seq('->', commaSep1($.sig_result))),
      optional($.call_conv),
    ),

    sig_param: $ => seq(
      $.type,
      optional($.param_extension),
      optional($.param_special),
    ),

    sig_result: $ => seq(
      $.type,
      optional($.param_extension),
    ),

    param_extension: $ => choice(
      'uext',
      'sext',
    ),

    param_special: $ => choice(
      seq('sarg', '(', $.number, ')'),
      'sret',
      'vmctx',
      'stack_limit',
      'sigid',
    ),

    call_conv: $ => choice(
      'fast',
      'cold',
      'system_v',
      'windows_fastcall',
      'apple_aarch64',
      'probestack',
      'winch',
      'tail',
    ),

    function_flags: $ => repeat1($.function_flag),

    function_flag: $ => choice(
      seq('windows_fastcall_first_v_reg', '=', $.identifier),
    ),

    function_body: $ => seq(
      '{',
      repeat($.preamble_decl),
      repeat($.basic_block),
      '}',
    ),

    // Preamble declarations
    preamble_decl: $ => choice(
      $.stack_slot_decl,
      $.global_value_decl,
      $.heap_decl,
      $.table_decl,
      $.signature_decl,
      $.func_decl,
      $.jump_table_decl,
      $.constant_decl,
    ),

    stack_slot_decl: $ => seq(
      $.stack_slot,
      '=',
      choice('explicit_slot', 'spill_slot', 'incoming_arg', 'outgoing_arg', 'emergency_slot'),
      $.number,
      optional(seq(',', 'align', '=', $.number)),
    ),

    global_value_decl: $ => seq(
      $.global_value,
      '=',
      choice(
        'vmctx',
        seq('load', '.', $.type, optional('notrap'), optional('aligned'), optional('readonly'), $.global_value, optional($.offset)),
        seq('iadd_imm', '.', $.type, $.global_value, ',', $.number),
        seq(optional('colocated'), 'symbol', optional('%'), $.identifier, optional($.offset)),
        seq('dyn_scale_target_const', '.', $.type),
      ),
    ),

    heap_decl: $ => seq(
      $.heap,
      '=',
      choice('static', 'dynamic'),
      ',',
      'guard', '=', $.number,
      ',',
      'bound', '=', $.number,
      optional(seq(',', 'offset_guard', '=', $.number)),
      optional(seq(',', 'style', '=', choice('static', 'dynamic'))),
      optional(seq(',', 'index_type', '=', $.type)),
    ),

    table_decl: $ => seq(
      $.table,
      '=',
      choice('static', 'dynamic'),
      ',',
      'min', '=', $.number,
      ',',
      'bound', '=', choice($.number, 'none'),
      optional(seq(',', 'element_size', '=', $.number)),
      optional(seq(',', 'index_type', '=', $.type)),
    ),

    signature_decl: $ => seq(
      $.sig_ref,
      '=',
      $.signature,
    ),

    func_decl: $ => seq(
      $.func_ref,
      '=',
      optional('colocated'),
      optional('%'),
      $.identifier,
      $.sig_ref,
    ),

    jump_table_decl: $ => seq(
      $.jump_table,
      '=',
      'jump_table',
      '[',
      commaSep($.block),
      ']',
    ),

    constant_decl: $ => seq(
      $.constant,
      '=',
      $.immediate,
    ),

    offset: $ => seq(
      choice('+', '-'),
      $.number,
    ),

    // Basic blocks
    basic_block: $ => seq(
      field('label', $.block),
      optional(seq('(', commaSep(seq($.value, ':', $.type)), ')')),
      optional(seq('cold', ':')),
      ':',
      repeat($.instruction),
    ),

    // Instructions
    instruction: $ => seq(
      optional(seq(commaSep1($.value), '=')),
      field('opcode', $.opcode),
      optional($.type_suffix),
      optional($.instruction_operands),
    ),

    type_suffix: $ => seq('.', $.type),

    instruction_operands: $ => repeat1($.operand),

    operand: $ => choice(
      $.value,
      $.block,
      $.stack_slot,
      $.global_value,
      $.func_ref,
      $.sig_ref,
      $.heap,
      $.table,
      $.jump_table,
      $.constant,
      $.immediate,
      $.block_args,
      $.condition,
      $.memflags,
      $.offset,
    ),

    block_args: $ => seq(
      $.block,
      '(',
      commaSep($.value),
      ')',
    ),

    immediate: $ => choice(
      $.number,
      $.float_number,
      seq('[', commaSep($.number), ']'),
    ),

    condition: $ => choice(
      // Integer conditions
      'eq', 'ne', 'ult', 'uge', 'ugt', 'ule', 'slt', 'sge', 'sgt', 'sle',
      'of', 'nof',
      // Floating point conditions
      'ord', 'uno',
    ),

    memflags: $ => repeat1(choice(
      'notrap',
      'aligned',
      'readonly',
      seq('align', '=', $.number),
      seq('offset', '=', $.number),
      'little', 'big',
    )),

    // Opcodes
    opcode: $ => choice(
      // Control flow
      'jump', 'brif', 'br_table', 'trap', 'trapz', 'trapnz', 'resumable_trap',
      'return', 'call', 'call_indirect', 'return_call', 'return_call_indirect',
      'func_addr',

      // Constant materialization
      'iconst', 'f32const', 'f64const', 'bconst', 'vconst', 'null',

      // Stack operations
      'stack_load', 'stack_store', 'stack_addr',

      // Global operations
      'global_value', 'symbol_value', 'tls_value',

      // Heap operations
      'heap_addr', 'heap_load', 'heap_store',

      // Table operations
      'table_addr',

      // Integer arithmetic
      'iadd', 'isub', 'imul', 'udiv', 'sdiv', 'urem', 'srem',
      'iadd_imm', 'imul_imm', 'udiv_imm', 'sdiv_imm', 'urem_imm', 'srem_imm',
      'irsub_imm',
      'iadd_cin', 'iadd_cout', 'iadd_carry',
      'isub_bin', 'isub_bout', 'isub_borrow',
      'band', 'bor', 'bxor', 'bnot', 'band_not', 'bor_not', 'bxor_not',
      'band_imm', 'bor_imm', 'bxor_imm',
      'rotl', 'rotr', 'rotl_imm', 'rotr_imm',
      'ishl', 'ushr', 'sshr', 'ishl_imm', 'ushr_imm', 'sshr_imm',

      // Integer comparison
      'icmp', 'icmp_imm',

      // Integer min/max
      'umin', 'umax', 'smin', 'smax',

      // Integer conversion
      'uextend', 'sextend', 'ireduce',
      'snarrow', 'unarrow', 'uunarrow',

      // Floating point arithmetic
      'fadd', 'fsub', 'fmul', 'fdiv', 'fmin', 'fmax',
      'sqrt', 'fma',
      'fneg', 'fabs', 'fcopysign',
      'ceil', 'floor', 'trunc', 'nearest',

      // Floating point comparison
      'fcmp',

      // Floating point conversion
      'fcvt_from_sint', 'fcvt_from_uint',
      'fcvt_to_sint', 'fcvt_to_uint',
      'fcvt_to_sint_sat', 'fcvt_to_uint_sat',
      'fpromote', 'fdemote',
      'fvpromote_low', 'fvdemote',

      // Bitcast
      'bitcast',

      // Boolean/flags
      'bint', 'bmask',

      // Loads and stores
      'load', 'store', 'uload8', 'sload8', 'istore8',
      'uload16', 'sload16', 'istore16',
      'uload32', 'sload32', 'istore32',
      'uload8x8', 'sload8x8', 'uload16x4', 'sload16x4', 'uload32x2', 'sload32x2',

      // Select
      'select', 'selectif', 'select_spectre_guard',

      // Spill/fill
      'spill', 'fill', 'fill_nop',

      // Vector operations
      'splat', 'swizzle', 'shuffle',
      'insertlane', 'extractlane',
      'smin_lane', 'smax_lane', 'umin_lane', 'umax_lane',
      'vconst', 'vselect',
      'vany_true', 'vall_true', 'vhigh_bits',

      // SIMD arithmetic
      'iadd_pairwise', 'x86_pmaddubsw',
      'avg_round', 'sqmul_round_sat',
      'imin', 'imax',
      'sadd_sat', 'ssub_sat', 'uadd_sat', 'usub_sat',
      'popcnt', 'cls', 'clz', 'ctz', 'bitrev', 'bswap',
      'widening_pairwise_dot_product_s',

      // Atomic operations
      'atomic_rmw', 'atomic_cas', 'atomic_load', 'atomic_store', 'fence',

      // Other
      'nop', 'debugtrap', 'copy', 'ireduce',
      'vsplit', 'vconcat',
      'get_frame_pointer', 'get_stack_pointer', 'get_return_address',
      'set_frame_pointer',
      'adjust_sp_down', 'adjust_sp_up', 'adjust_sp_down_imm', 'adjust_sp_up_imm',

      // Catch-all for unknown opcodes
      $.identifier,
    ),

    // Test directives
    test_directive: $ => seq(
      'test',
      choice(
        'compile',
        'run',
        'interpret',
        'verifier',
        seq('alias_analysis', '=', choice('true', 'false')),
        seq('print', optional('cfg')),
      ),
    ),
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
