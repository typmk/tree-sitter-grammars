/**
 * Tree-sitter grammar for Graal IR (Human-readable debug format)
 *
 * Based on Graal compiler debug output and IGV text representation.
 * Graal uses a graph-based IR where nodes represent operations
 * and edges represent data/control flow.
 *
 * The textual format is primarily used for debugging and visualization.
 */

module.exports = grammar({
  name: "graal_ir",

  extras: $ => [
    /\s+/,
    $.comment,
  ],

  conflicts: $ => [
    [$.graph],
    [$.type],
    [$.node_class],
    [$.qualified_name],
    [$.node_successors],
  ],

  rules: {
    source_file: $ => repeat(
      choice(
        $.graph,
        $.method_header,
      ),
    ),

    comment: $ => choice(
      /\/\/.*/,
      /#.*/,
    ),

    // Basic tokens
    identifier: $ => /[a-zA-Z_][a-zA-Z_0-9]*/,

    node_id: $ => /\d+\|/,

    qualified_name: $ => seq(
      $.identifier,
      repeat(seq('.', $.identifier)),
    ),

    method_signature: $ => seq(
      $.qualified_name,
      '.',
      $.identifier,
      '(',
      optional(commaSep1($.type)),
      ')',
    ),

    number: $ => choice(
      /[+-]?\d+/,
      /0[xX][0-9a-fA-F]+/,
    ),

    float_number: $ => choice(
      /[+-]?\d+\.\d*([eE][+-]?\d+)?[fFdD]?/,
      /[+-]?\d+[eE][+-]?\d+[fFdD]?/,
      /[+-]?Infinity/,
      /[+-]?NaN/,
    ),

    string: $ => /"([^"\\]|\\.)*"/,

    // Types (Java-style)
    type: $ => choice(
      'void', 'boolean', 'byte', 'char', 'short', 'int', 'long', 'float', 'double',
      seq($.qualified_name, optional($.type_params)),
      seq($.type, '[', ']'),
    ),

    type_params: $ => seq(
      '<',
      commaSep1($.type),
      '>',
    ),

    // Method header
    method_header: $ => seq(
      optional(repeat($.modifier)),
      $.type,
      $.method_signature,
      optional(seq('throws', commaSep1($.qualified_name))),
    ),

    modifier: $ => choice(
      'public', 'private', 'protected', 'static', 'final',
      'abstract', 'native', 'synchronized', 'volatile', 'transient',
      'strictfp',
    ),

    // Graph structure
    graph: $ => seq(
      optional($.graph_header),
      repeat1($.node),
    ),

    graph_header: $ => seq(
      choice('Graph', 'HIR', 'LIR', 'Structured Graph'),
      ':',
      optional($.string),
    ),

    // Node definition
    node: $ => seq(
      field('id', $.node_id),
      field('class', $.node_class),
      optional($.node_properties),
      optional($.node_inputs),
      optional($.node_successors),
    ),

    node_class: $ => choice(
      // Control flow nodes
      'StartNode', 'EndNode', 'MergeNode', 'LoopBeginNode', 'LoopEndNode',
      'LoopExitNode', 'ReturnNode', 'UnwindNode', 'DeoptimizeNode',
      'IfNode', 'SwitchNode', 'InvokeNode', 'InvokeWithExceptionNode',
      'BeginNode', 'KillingBeginNode', 'AbstractBeginNode', 'ControlSplitNode',

      // Frame state nodes
      'FrameState', 'FrameStateNode', 'VirtualState', 'VirtualObjectNode',

      // Value nodes - Constants
      'ConstantNode', 'LogicConstantNode', 'PrimitiveConstantNode',
      'NullConstantNode', 'JavaConstant', 'RawConstant',

      // Value nodes - Parameters
      'ParameterNode', 'LocalNode',

      // Value nodes - Arithmetic
      'AddNode', 'SubNode', 'MulNode', 'DivNode', 'RemNode',
      'NegateNode', 'AbsNode', 'SqrtNode',
      'LeftShiftNode', 'RightShiftNode', 'UnsignedRightShiftNode',
      'AndNode', 'OrNode', 'XorNode', 'NotNode',
      'MulHighNode', 'UMulHighNode',
      'IntegerAddExactNode', 'IntegerSubExactNode', 'IntegerMulExactNode',

      // Value nodes - Comparison
      'IntegerEqualsNode', 'IntegerLessThanNode', 'IntegerBelowNode',
      'FloatEqualsNode', 'FloatLessThanNode',
      'ObjectEqualsNode', 'PointerEqualsNode',
      'ConditionalNode', 'CompareNode',
      'NormalizeCompareNode',

      // Value nodes - Conversions
      'SignExtendNode', 'ZeroExtendNode', 'NarrowNode',
      'FloatConvertNode', 'ReinterpretNode',

      // Memory nodes
      'ReadNode', 'WriteNode', 'LoadFieldNode', 'StoreFieldNode',
      'LoadIndexedNode', 'StoreIndexedNode',
      'AtomicReadAndWriteNode', 'AtomicReadAndAddNode',
      'CompareAndSwapNode', 'UnsafeCompareAndSwapNode',
      'VolatileReadNode', 'VolatileWriteNode',
      'MembarNode', 'MemoryCheckpoint',
      'ArrayLengthNode', 'ArrayCopyNode',

      // Allocation nodes
      'NewInstanceNode', 'NewArrayNode', 'NewMultiArrayNode',
      'DynamicNewInstanceNode', 'DynamicNewArrayNode',
      'AllocatedObjectNode', 'CommitAllocationNode',

      // Type nodes
      'CheckCastNode', 'InstanceOfNode', 'InstanceOfDynamicNode',
      'ClassIsAssignableFromNode', 'TypeSwitchNode',
      'PiNode', 'GuardedValueNode',

      // Guard nodes
      'GuardNode', 'FixedGuardNode', 'AnchorNode', 'ValueAnchorNode',

      // Call nodes
      'MethodCallTargetNode', 'DirectCallTargetNode', 'IndirectCallTargetNode',
      'InvokeNode', 'InvokeWithExceptionNode',

      // Exception nodes
      'ExceptionObjectNode', 'UnreachableBeginNode',

      // Phi nodes
      'PhiNode', 'ValuePhiNode', 'MemoryPhiNode', 'GuardPhiNode',
      'ProxyNode', 'ValueProxyNode', 'GuardProxyNode',

      // Intrinsic nodes
      'IntrinsicNode', 'ForeignCallNode', 'RuntimeCallNode',

      // Debug/Meta nodes
      'FullInfopointNode', 'SimpleInfopointNode', 'BytecodeExceptionNode',
      'MonitorEnterNode', 'MonitorExitNode', 'MonitorIdNode',
      'SynchronizedEntryNode', 'RawMonitorEnterNode',

      // SIMD/Vector nodes
      'VectorLoadNode', 'VectorStoreNode',

      // Unsafe nodes
      'UnsafeLoadNode', 'UnsafeStoreNode', 'UnsafeCopyMemoryNode',

      // Catch-all
      $.identifier,
    ),

    node_properties: $ => seq(
      '[',
      commaSep($.property),
      ']',
    ),

    property: $ => seq(
      $.identifier,
      '=',
      $.property_value,
    ),

    property_value: $ => choice(
      $.number,
      $.float_number,
      $.string,
      $.qualified_name,
      'true', 'false', 'null',
      seq('{', commaSep($.property_value), '}'),
      seq('[', commaSep($.property_value), ']'),
    ),

    node_inputs: $ => seq(
      '(',
      commaSep($.edge),
      ')',
    ),

    node_successors: $ => seq(
      '->',
      commaSep($.successor),
    ),

    edge: $ => seq(
      optional(seq($.identifier, ':')),
      $.node_ref,
    ),

    successor: $ => seq(
      optional(seq($.identifier, ':')),
      $.node_ref,
    ),

    node_ref: $ => choice(
      $.number,
      seq('#', $.number),
      'null',
      '_',
    ),

    // LIR (Low-Level IR) specific
    lir_instruction: $ => seq(
      optional($.label),
      $.lir_opcode,
      repeat($.lir_operand),
    ),

    label: $ => seq(
      'B',
      $.number,
      ':',
    ),

    lir_opcode: $ => choice(
      // x86-64 specific
      'MOV', 'MOVSX', 'MOVZX', 'LEA', 'PUSH', 'POP',
      'ADD', 'SUB', 'IMUL', 'IDIV', 'DIV', 'NEG', 'INC', 'DEC',
      'AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR', 'SAR', 'ROL', 'ROR',
      'CMP', 'TEST', 'JMP', 'JE', 'JNE', 'JL', 'JLE', 'JG', 'JGE',
      'JB', 'JBE', 'JA', 'JAE', 'JS', 'JNS', 'JO', 'JNO',
      'CALL', 'RET', 'NOP', 'INT',
      'CMOV', 'CMOVE', 'CMOVNE', 'CMOVL', 'CMOVLE', 'CMOVG', 'CMOVGE',
      'SET', 'SETE', 'SETNE', 'SETL', 'SETLE', 'SETG', 'SETGE',
      // SSE/AVX
      'MOVSS', 'MOVSD', 'MOVAPS', 'MOVAPD', 'MOVUPS', 'MOVUPD',
      'ADDSS', 'ADDSD', 'SUBSS', 'SUBSD', 'MULSS', 'MULSD', 'DIVSS', 'DIVSD',
      'SQRTSS', 'SQRTSD', 'MAXSS', 'MAXSD', 'MINSS', 'MINSD',
      'COMISS', 'COMISD', 'UCOMISS', 'UCOMISD',
      'CVTSI2SS', 'CVTSI2SD', 'CVTSS2SI', 'CVTSD2SI',
      'CVTSS2SD', 'CVTSD2SS', 'CVTTSS2SI', 'CVTTSD2SI',
      // AArch64 specific
      'LDR', 'STR', 'LDRB', 'STRB', 'LDRH', 'STRH',
      'ADRP', 'BL', 'BR', 'BLR', 'CBZ', 'CBNZ', 'TBZ', 'TBNZ',
      'MADD', 'MSUB', 'SDIV', 'UDIV',
      'CSEL', 'CSINC', 'CSINV', 'CSNEG',
      // Generic
      $.identifier,
    ),

    lir_operand: $ => choice(
      $.register,
      $.memory_operand,
      $.immediate,
    ),

    register: $ => choice(
      // x86-64
      /[er]?[abcd]x/, /[er]?[sb]p/, /[er]?[sd]i/,
      /r[89]|r1[0-5]/, /r[89][dwb]|r1[0-5][dwb]/,
      /[abcd][lh]/,
      /xmm[0-9]|xmm1[0-5]/, /ymm[0-9]|ymm1[0-5]/, /zmm[0-9]|zmm[12]?[0-9]|zmm3[01]/,
      // AArch64
      /x[0-9]|x[12][0-9]|x30/, /w[0-9]|w[12][0-9]|w30/,
      /v[0-9]|v[12][0-9]|v3[01]/, /d[0-9]|d[12][0-9]|d3[01]/,
      /s[0-9]|s[12][0-9]|s3[01]/, /h[0-9]|h[12][0-9]|h3[01]/,
      /b[0-9]|b[12][0-9]|b3[01]/,
      'sp', 'xzr', 'wzr', 'lr', 'fp',
      // Stack/frame references
      seq('stack:', $.number),
      seq('v', $.number),
    ),

    memory_operand: $ => seq(
      '[',
      choice(
        $.register,
        seq($.register, ',', $.register),
        seq($.register, ',', $.register, ',', $.number),
        seq($.register, ',', $.number),
        $.number,
      ),
      ']',
    ),

    immediate: $ => choice(
      $.number,
      $.float_number,
      seq('#', $.number),
    ),
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
