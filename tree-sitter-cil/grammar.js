/**
 * Tree-sitter grammar for CIL (Common Intermediate Language) / MSIL
 *
 * Based on ECMA-335 specification and ILAsm syntax
 * https://www.ecma-international.org/publications-and-standards/standards/ecma-335/
 *
 * CIL is the bytecode format for .NET/CLR applications.
 */

module.exports = grammar({
  name: "cil",

  extras: $ => [
    /\s+/,
    $.comment,
  ],

  conflicts: $ => [
    [$.calling_convention, $.method_reference],
    [$.calling_convention],
    [$.type],
    [$.class_decl],
    [$.field_init, $.custom_attribute],
  ],

  rules: {
    source_file: $ => repeat(
      choice(
        $.assembly_decl,
        $.module_decl,
        $.class_decl,
        $.custom_attribute,
        $.data_decl,
        $.vtfixup_decl,
      ),
    ),

    comment: $ => choice(
      /\/\/.*/,
      /\/\*[^*]*\*+([^/*][^*]*\*+)*\//,
    ),

    // Basic tokens
    identifier: $ => choice(
      /[a-zA-Z_][a-zA-Z_0-9]*/,
      /'[^']+'/,
    ),

    dotted_name: $ => seq(
      $.identifier,
      repeat(seq('.', $.identifier)),
    ),

    slashed_name: $ => seq(
      $.dotted_name,
      repeat(seq('/', $.dotted_name)),
    ),

    label: $ => token(seq(
      /[a-zA-Z_][a-zA-Z_0-9]*/,
      token.immediate(':'),
    )),

    number: $ => choice(
      /[+-]?\d+/,
      /0[xX][0-9a-fA-F]+/,
    ),

    float_number: $ => choice(
      /[+-]?\d+\.\d*([eE][+-]?\d+)?/,
      /[+-]?\d+[eE][+-]?\d+/,
      /float32\([^)]+\)/,
      /float64\([^)]+\)/,
    ),

    string: $ => /"([^"\\]|\\.)*"/,

    bytes: $ => seq('bytearray', '(', repeat(/[0-9a-fA-F ]+/), ')'),

    // Type system
    type: $ => choice(
      // Primitive types
      'void', 'bool', 'char', 'int8', 'int16', 'int32', 'int64',
      'unsigned int8', 'unsigned int16', 'unsigned int32', 'unsigned int64',
      'float32', 'float64', 'native int', 'native unsigned int',
      'object', 'string', 'typedref',
      // Class/valuetype reference
      seq(choice('class', 'valuetype'), $.type_reference),
      // Array types
      seq($.type, '[', optional($.bounds_spec), ']'),
      // Pointer types
      seq($.type, '*'),
      seq($.type, '&'),
      // Generic types
      seq($.type, '<', commaSep1($.type), '>'),
      // Method pointer
      seq('method', $.calling_convention, $.type, '*', '(', commaSep($.type), ')'),
      // Generic parameters
      seq('!', $.number),
      seq('!!', $.number),
      seq('!', $.identifier),
      seq('!!', $.identifier),
      // Modifiers
      seq($.type, 'modreq', '(', $.type_reference, ')'),
      seq($.type, 'modopt', '(', $.type_reference, ')'),
      seq($.type, 'pinned'),
    ),

    type_reference: $ => seq(
      optional(seq('[', $.dotted_name, ']')),
      $.slashed_name,
    ),

    bounds_spec: $ => choice(
      '...',
      commaSep1(choice(
        $.number,
        seq($.number, '...'),
        seq($.number, '...', $.number),
      )),
    ),

    calling_convention: $ => choice(
      'default',
      'vararg',
      'unmanaged cdecl',
      'unmanaged stdcall',
      'unmanaged thiscall',
      'unmanaged fastcall',
      seq('instance', optional(choice('explicit', 'default', 'vararg'))),
    ),

    // Assembly declarations
    assembly_decl: $ => seq(
      '.assembly',
      optional('extern'),
      $.dotted_name,
      optional($.assembly_body),
    ),

    assembly_body: $ => seq(
      '{',
      repeat(choice(
        $.custom_attribute,
        $.security_decl,
        seq('.hash', 'algorithm', $.number),
        seq('.hash', '=', $.bytes),
        seq('.publickey', '=', $.bytes),
        seq('.publickeytoken', '=', $.bytes),
        seq('.ver', $.number, ':', $.number, ':', $.number, ':', $.number),
        seq('.locale', $.string),
        seq('.culture', $.string),
      )),
      '}',
    ),

    module_decl: $ => seq(
      '.module',
      optional(choice(
        'extern',
        $.dotted_name,
      )),
    ),

    // Class declaration
    class_decl: $ => seq(
      '.class',
      repeat($.class_attr),
      $.dotted_name,
      optional(seq('extends', $.type_reference)),
      optional(seq('implements', commaSep1($.type_reference))),
      $.class_body,
    ),

    class_attr: $ => choice(
      'public', 'private', 'nested public', 'nested private',
      'nested family', 'nested assembly', 'nested famandassem', 'nested famorassem',
      'value', 'enum', 'interface', 'sealed', 'abstract', 'auto', 'sequential', 'explicit',
      'ansi', 'unicode', 'autochar', 'import', 'serializable', 'windowsruntime',
      'nested', 'beforefieldinit', 'specialname', 'rtspecialname',
    ),

    class_body: $ => seq(
      '{',
      repeat(choice(
        $.field_decl,
        $.method_decl,
        $.property_decl,
        $.event_decl,
        $.class_decl,
        $.custom_attribute,
        $.security_decl,
        seq('.size', $.number),
        seq('.pack', $.number),
        seq('.override', $.type_reference, '::', $.identifier, 'with', $.type_reference, '::', $.identifier),
        seq('.data', $.data_body),
      )),
      '}',
    ),

    // Field declaration
    field_decl: $ => seq(
      '.field',
      optional(seq('[', $.number, ']')),
      repeat($.field_attr),
      $.type,
      $.identifier,
      optional(seq('=', $.field_init)),
      optional(seq('at', $.identifier)),
    ),

    field_attr: $ => choice(
      'public', 'private', 'family', 'assembly', 'famandassem', 'famorassem',
      'privatescope', 'static', 'initonly', 'literal', 'notserialized',
      'specialname', 'rtspecialname', 'marshal', '(',
    ),

    field_init: $ => choice(
      seq('bool', '(', choice('true', 'false'), ')'),
      seq('int8', '(', $.number, ')'),
      seq('int16', '(', $.number, ')'),
      seq('int32', '(', $.number, ')'),
      seq('int64', '(', $.number, ')'),
      seq('float32', '(', $.float_number, ')'),
      seq('float64', '(', $.float_number, ')'),
      seq('char', '(', $.number, ')'),
      $.string,
      'nullref',
      $.bytes,
    ),

    // Method declaration
    method_decl: $ => seq(
      '.method',
      repeat($.method_attr),
      optional($.calling_convention),
      $.type,
      optional(seq('marshal', '(', $.native_type, ')')),
      $.identifier,
      optional($.generic_params),
      '(',
      commaSep($.param_decl),
      ')',
      repeat($.impl_attr),
      optional($.method_body),
    ),

    method_attr: $ => choice(
      'public', 'private', 'family', 'assembly', 'famandassem', 'famorassem',
      'privatescope', 'static', 'final', 'virtual', 'hidebysig',
      'newslot', 'abstract', 'specialname', 'rtspecialname',
      'pinvokeimpl', 'unmanagedexp', 'reqsecobj', 'strict',
    ),

    impl_attr: $ => choice(
      'cil', 'native', 'optil', 'managed', 'unmanaged',
      'forwardref', 'preservesig', 'runtime', 'internalcall',
      'synchronized', 'noinlining', 'nooptimization', 'aggressiveinlining',
    ),

    generic_params: $ => seq(
      '<',
      commaSep1(seq(
        optional(choice('+', '-')),
        optional(choice('class', 'valuetype', '.ctor')),
        optional(seq('(', commaSep1($.type_reference), ')')),
        $.identifier,
      )),
      '>',
    ),

    param_decl: $ => seq(
      repeat($.param_attr),
      $.type,
      optional(seq('marshal', '(', $.native_type, ')')),
      optional($.identifier),
    ),

    param_attr: $ => choice(
      '[in]', '[out]', '[opt]',
    ),

    native_type: $ => choice(
      'void', 'bool', 'int8', 'int16', 'int32', 'int64',
      'unsigned int8', 'unsigned int16', 'unsigned int32', 'unsigned int64',
      'float32', 'float64', 'syschar', 'currency', 'void*',
      'int', 'unsigned int', 'error', 'struct',
      seq('fixed array', '[', $.number, ']'),
      seq('fixed sysstring', '[', $.number, ']'),
      'lpstr', 'lpwstr', 'lptstr', 'bstr', 'tbstr', 'byvalstr',
      'ansibstr', 'lpstruct', 'safearray', 'iunknown', 'idispatch',
      seq('custom', '(', $.string, ',', $.string, ')'),
    ),

    method_body: $ => seq(
      '{',
      repeat(choice(
        $.maxstack_decl,
        $.locals_decl,
        $.entrypoint_decl,
        $.param_directive,
        $.exception_clause,
        $.custom_attribute,
        $.security_decl,
        seq('.override', $.type_reference, '::', $.identifier),
        $.label,
        $.instruction,
      )),
      '}',
    ),

    maxstack_decl: $ => seq('.maxstack', $.number),

    locals_decl: $ => seq(
      '.locals',
      optional('init'),
      '(',
      commaSep(seq(
        optional(seq('[', $.number, ']')),
        $.type,
        optional($.identifier),
      )),
      ')',
    ),

    entrypoint_decl: $ => '.entrypoint',

    param_directive: $ => seq(
      '.param',
      '[',
      $.number,
      ']',
      optional(seq('=', $.field_init)),
    ),

    exception_clause: $ => choice(
      seq('.try', $.scope_block, 'catch', $.type_reference, $.scope_block),
      seq('.try', $.scope_block, 'filter', $.identifier, $.scope_block),
      seq('.try', $.scope_block, 'finally', $.scope_block),
      seq('.try', $.scope_block, 'fault', $.scope_block),
      seq('.try', $.identifier, 'to', $.identifier,
          choice('catch', 'filter', 'finally', 'fault'),
          $.type_reference, 'handler', $.identifier, 'to', $.identifier),
    ),

    scope_block: $ => seq(
      '{',
      repeat(choice($.label, $.instruction)),
      '}',
    ),

    // Property declaration
    property_decl: $ => seq(
      '.property',
      repeat(choice('specialname', 'rtspecialname', 'instance')),
      $.type,
      $.identifier,
      '(',
      commaSep($.type),
      ')',
      optional($.property_body),
    ),

    property_body: $ => seq(
      '{',
      repeat(choice(
        seq('.get', $.method_reference),
        seq('.set', $.method_reference),
        seq('.other', $.method_reference),
        $.custom_attribute,
      )),
      '}',
    ),

    // Event declaration
    event_decl: $ => seq(
      '.event',
      repeat(choice('specialname', 'rtspecialname')),
      $.type_reference,
      $.identifier,
      optional($.event_body),
    ),

    event_body: $ => seq(
      '{',
      repeat(choice(
        seq('.addon', $.method_reference),
        seq('.removeon', $.method_reference),
        seq('.fire', $.method_reference),
        seq('.other', $.method_reference),
        $.custom_attribute,
      )),
      '}',
    ),

    method_reference: $ => seq(
      optional(choice('instance', 'explicit')),
      optional($.calling_convention),
      $.type,
      optional($.type_reference),
      '::',
      $.identifier,
      '(',
      commaSep($.type),
      ')',
    ),

    // Custom attributes
    custom_attribute: $ => seq(
      '.custom',
      $.method_reference,
      optional(seq('=', choice($.bytes, '(', repeat1(choice($.field_init, $.identifier, $.number, $.string)), ')'))),
    ),

    // Security declarations
    security_decl: $ => seq(
      '.permissionset',
      choice('assert', 'demand', 'deny', 'inheritcheck', 'linkcheck',
             'permitonly', 'prejitdeny', 'prejitgrant', 'request',
             'requestminimum', 'requestoptional', 'requestrefuse'),
      '=',
      $.bytes,
    ),

    // Data declarations
    data_decl: $ => seq(
      '.data',
      optional(choice('tls', 'cil')),
      optional($.identifier),
      '=',
      $.data_body,
    ),

    data_body: $ => choice(
      $.bytes,
      seq('{', repeat($.data_item), '}'),
    ),

    data_item: $ => choice(
      seq('int8', '(', $.number, ')'),
      seq('int16', '(', $.number, ')'),
      seq('int32', '(', $.number, ')'),
      seq('int64', '(', $.number, ')'),
      seq('float32', '(', $.float_number, ')'),
      seq('float64', '(', $.float_number, ')'),
      seq('char*', '(', $.string, ')'),
      seq('&', '(', $.identifier, ')'),
    ),

    vtfixup_decl: $ => seq(
      '.vtfixup',
      '[', $.number, ']',
      repeat(choice('int32', 'int64', 'fromunmanaged', 'retainappdomain')),
      'at', $.identifier,
    ),

    // CIL Instructions
    instruction: $ => choice(
      $.instruction_none,
      $.instruction_var,
      $.instruction_int,
      $.instruction_float,
      $.instruction_string,
      $.instruction_branch,
      $.instruction_method,
      $.instruction_field,
      $.instruction_type,
      $.instruction_token,
      $.instruction_switch,
      $.instruction_sig,
    ),

    // No operand instructions
    instruction_none: $ => choice(
      'add', 'add.ovf', 'add.ovf.un', 'and', 'arglist',
      'break', 'ceq', 'cgt', 'cgt.un', 'ckfinite', 'clt', 'clt.un',
      'conv.i', 'conv.i1', 'conv.i2', 'conv.i4', 'conv.i8',
      'conv.ovf.i', 'conv.ovf.i.un', 'conv.ovf.i1', 'conv.ovf.i1.un',
      'conv.ovf.i2', 'conv.ovf.i2.un', 'conv.ovf.i4', 'conv.ovf.i4.un',
      'conv.ovf.i8', 'conv.ovf.i8.un', 'conv.ovf.u', 'conv.ovf.u.un',
      'conv.ovf.u1', 'conv.ovf.u1.un', 'conv.ovf.u2', 'conv.ovf.u2.un',
      'conv.ovf.u4', 'conv.ovf.u4.un', 'conv.ovf.u8', 'conv.ovf.u8.un',
      'conv.r.un', 'conv.r4', 'conv.r8', 'conv.u', 'conv.u1', 'conv.u2',
      'conv.u4', 'conv.u8', 'cpblk', 'div', 'div.un', 'dup', 'endfilter',
      'endfinally', 'initblk', 'ldarg.0', 'ldarg.1', 'ldarg.2', 'ldarg.3',
      'ldc.i4.0', 'ldc.i4.1', 'ldc.i4.2', 'ldc.i4.3', 'ldc.i4.4', 'ldc.i4.5',
      'ldc.i4.6', 'ldc.i4.7', 'ldc.i4.8', 'ldc.i4.m1', 'ldc.i4.M1',
      'ldelem.i', 'ldelem.i1', 'ldelem.i2', 'ldelem.i4', 'ldelem.i8',
      'ldelem.r4', 'ldelem.r8', 'ldelem.ref', 'ldelem.u1', 'ldelem.u2',
      'ldelem.u4', 'ldind.i', 'ldind.i1', 'ldind.i2', 'ldind.i4', 'ldind.i8',
      'ldind.r4', 'ldind.r8', 'ldind.ref', 'ldind.u1', 'ldind.u2', 'ldind.u4',
      'ldlen', 'ldloc.0', 'ldloc.1', 'ldloc.2', 'ldloc.3', 'ldnull',
      'localloc', 'mul', 'mul.ovf', 'mul.ovf.un', 'neg', 'nop', 'not', 'or',
      'pop', 'prefix1', 'prefix2', 'prefix3', 'prefix4', 'prefix5', 'prefix6',
      'prefix7', 'prefixref', 'readonly.', 'refanytype', 'rem', 'rem.un',
      'ret', 'rethrow', 'shl', 'shr', 'shr.un', 'stelem.i', 'stelem.i1',
      'stelem.i2', 'stelem.i4', 'stelem.i8', 'stelem.r4', 'stelem.r8',
      'stelem.ref', 'stind.i', 'stind.i1', 'stind.i2', 'stind.i4', 'stind.i8',
      'stind.r4', 'stind.r8', 'stind.ref', 'stloc.0', 'stloc.1', 'stloc.2',
      'stloc.3', 'sub', 'sub.ovf', 'sub.ovf.un', 'tail.', 'throw',
      'volatile.', 'xor',
    ),

    // Local/argument variable instructions
    instruction_var: $ => seq(
      choice(
        'ldarg', 'ldarg.s', 'ldarga', 'ldarga.s',
        'ldloc', 'ldloc.s', 'ldloca', 'ldloca.s',
        'starg', 'starg.s', 'stloc', 'stloc.s',
      ),
      choice($.number, $.identifier),
    ),

    // Integer constant instructions
    instruction_int: $ => seq(
      choice('ldc.i4', 'ldc.i8', 'ldc.i4.s', 'unaligned.'),
      $.number,
    ),

    // Float constant instructions
    instruction_float: $ => seq(
      choice('ldc.r4', 'ldc.r8'),
      $.float_number,
    ),

    // String constant instructions
    instruction_string: $ => seq(
      'ldstr',
      $.string,
    ),

    // Branch instructions
    instruction_branch: $ => seq(
      choice(
        'beq', 'beq.s', 'bge', 'bge.s', 'bge.un', 'bge.un.s',
        'bgt', 'bgt.s', 'bgt.un', 'bgt.un.s', 'ble', 'ble.s',
        'ble.un', 'ble.un.s', 'blt', 'blt.s', 'blt.un', 'blt.un.s',
        'bne.un', 'bne.un.s', 'br', 'br.s', 'brfalse', 'brfalse.s',
        'brtrue', 'brtrue.s', 'brnull', 'brnull.s', 'brzero', 'brzero.s',
        'brinst', 'brinst.s', 'leave', 'leave.s',
      ),
      $.identifier,
    ),

    // Method call instructions
    instruction_method: $ => seq(
      choice('call', 'callvirt', 'jmp', 'ldftn', 'ldvirtftn', 'newobj'),
      $.method_reference,
    ),

    // Field instructions
    instruction_field: $ => seq(
      choice('ldfld', 'ldflda', 'ldsfld', 'ldsflda', 'stfld', 'stsfld'),
      $.type,
      $.type_reference,
      '::',
      $.identifier,
    ),

    // Type instructions
    instruction_type: $ => seq(
      choice(
        'box', 'castclass', 'constrained.', 'cpobj', 'initobj',
        'isinst', 'ldelem', 'ldelema', 'ldobj', 'mkrefany',
        'newarr', 'refanyval', 'sizeof', 'stelem', 'stobj', 'unbox', 'unbox.any',
      ),
      $.type,
    ),

    // Token instructions
    instruction_token: $ => seq(
      'ldtoken',
      choice($.type, $.method_reference, seq($.type, $.type_reference, '::', $.identifier)),
    ),

    // Switch instruction
    instruction_switch: $ => seq(
      'switch',
      '(',
      commaSep($.identifier),
      ')',
    ),

    // Signature instructions
    instruction_sig: $ => seq(
      'calli',
      optional($.calling_convention),
      $.type,
      '(',
      commaSep($.type),
      ')',
    ),
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
