/**
 * Tree-sitter grammar for Jasmin JVM bytecode assembler
 *
 * Based on the Jasmin User Guide: https://jasmin.sourceforge.net/
 * and JasminXT extensions: https://jasmin.sourceforge.net/xt.html
 *
 * Jasmin is a Java assembler that takes ASCII descriptions of Java classes
 * and converts them into binary Java class files.
 */

module.exports = grammar({
  name: "jasmin",

  extras: $ => [
    /\s+/,
    $.comment,
  ],

  conflicts: $ => [
    [$.field_spec],
    [$.method_spec],
  ],

  rules: {
    source_file: $ => repeat(
      choice(
        $.class_spec,
        $.super_spec,
        $.interface_spec,
        $.implements_spec,
        $.signature_spec,
        $.enclosing_spec,
        $.debug_spec,
        $.inner_class_spec,
        $.deprecated_spec,
        $.annotation,
        $.field_spec,
        $.method_spec,
        $.source_spec,
        $.bytecode_spec,
      ),
    ),

    comment: $ => /;.*/,

    // Basic tokens
    identifier: $ => /[a-zA-Z_$][a-zA-Z_$0-9]*/,

    class_name: $ => /[a-zA-Z_$][a-zA-Z_$0-9]*(\/[a-zA-Z_$][a-zA-Z_$0-9]*)*/,

    label: $ => token(seq(
      /[a-zA-Z_$][a-zA-Z_$0-9]*/,
      token.immediate(':'),
    )),

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

    // Type descriptors
    type_descriptor: $ => choice(
      'B',  // byte
      'C',  // char
      'D',  // double
      'F',  // float
      'I',  // int
      'J',  // long
      'S',  // short
      'Z',  // boolean
      'V',  // void
      /L[a-zA-Z_$][a-zA-Z_$0-9]*(\/[a-zA-Z_$][a-zA-Z_$0-9]*)*;/,  // object type
      /\[+[BCDFIJSZV]/,  // primitive array
      /\[+L[a-zA-Z_$][a-zA-Z_$0-9]*(\/[a-zA-Z_$][a-zA-Z_$0-9]*)*;/,  // object array
    ),

    method_descriptor: $ => seq(
      '(',
      repeat($.type_descriptor),
      ')',
      $.type_descriptor,
    ),

    // Access flags
    access_spec: $ => choice(
      'public',
      'private',
      'protected',
      'static',
      'final',
      'synchronized',
      'volatile',
      'transient',
      'native',
      'interface',
      'abstract',
      'strictfp',
      'synthetic',
      'annotation',
      'enum',
      'bridge',
      'varargs',
      'fpstrict',
      'super',
      'mandated',
    ),

    // Class header directives
    class_spec: $ => seq(
      '.class',
      repeat($.access_spec),
      field('name', $.class_name),
    ),

    super_spec: $ => seq(
      '.super',
      field('name', $.class_name),
    ),

    interface_spec: $ => seq(
      '.interface',
      repeat($.access_spec),
      field('name', $.class_name),
    ),

    implements_spec: $ => seq(
      '.implements',
      field('name', $.class_name),
    ),

    signature_spec: $ => seq(
      '.signature',
      $.string,
    ),

    enclosing_spec: $ => seq(
      '.enclosing',
      'method',
      $.class_name,
      '/',
      $.identifier,
      $.method_descriptor,
    ),

    debug_spec: $ => seq(
      '.debug',
      $.string,
    ),

    inner_class_spec: $ => seq(
      '.inner',
      choice('class', 'interface'),
      repeat($.access_spec),
      optional(seq('inner', $.class_name)),
      optional(seq('outer', $.class_name)),
    ),

    deprecated_spec: $ => '.deprecated',

    annotation: $ => seq(
      choice('.annotation', '.end annotation'),
      optional(choice('visible', 'invisible', 'visibleparam', 'invisibleparam', 'default')),
      optional($.class_name),
    ),

    source_spec: $ => seq(
      '.source',
      choice($.string, $.source_file_name),
    ),

    // Unquoted source file name (e.g., HelloWorld.java)
    source_file_name: $ => /[a-zA-Z_$][a-zA-Z_$0-9]*(\.[a-zA-Z_$][a-zA-Z_$0-9]*)*/,

    bytecode_spec: $ => seq(
      '.bytecode',
      $.number,
      '.',
      $.number,
    ),

    // Field definitions
    field_spec: $ => seq(
      '.field',
      repeat($.access_spec),
      field('name', $.identifier),
      field('type', $.type_descriptor),
      optional(seq('=', $.field_value)),
      optional($.signature_spec),
      optional($.deprecated_spec),
      repeat($.annotation),
      optional('.end field'),
    ),

    field_value: $ => choice(
      $.number,
      $.float_number,
      $.string,
    ),

    // Method definitions
    method_spec: $ => seq(
      '.method',
      repeat($.access_spec),
      field('name', choice($.identifier, '<init>', '<clinit>')),
      field('descriptor', $.method_descriptor),
      optional($.signature_spec),
      optional($.deprecated_spec),
      repeat($.annotation),
      repeat($.method_body_item),
      '.end method',
    ),

    method_body_item: $ => choice(
      $.limit_spec,
      $.throws_spec,
      $.line_spec,
      $.var_spec,
      $.catch_spec,
      $.stack_spec,
      $.label,
      $.instruction,
    ),

    limit_spec: $ => seq(
      '.limit',
      choice('stack', 'locals'),
      $.number,
    ),

    throws_spec: $ => seq(
      '.throws',
      $.class_name,
    ),

    line_spec: $ => seq(
      '.line',
      $.number,
    ),

    var_spec: $ => seq(
      '.var',
      $.number,
      'is',
      $.identifier,
      $.type_descriptor,
      optional(seq('signature', $.string)),
      'from',
      $.identifier,
      'to',
      $.identifier,
    ),

    catch_spec: $ => seq(
      '.catch',
      $.class_name,
      'from',
      $.identifier,
      'to',
      $.identifier,
      'using',
      $.identifier,
    ),

    stack_spec: $ => seq(
      '.stack',
      choice('use', 'locals', 'offset'),
      repeat(choice($.identifier, $.number)),
      optional('.end stack'),
    ),

    // Instructions
    instruction: $ => choice(
      // No operand instructions
      $.instruction_nullary,
      // Local variable instructions
      $.instruction_var,
      // Integer constant instructions
      $.instruction_int,
      // Branch instructions
      $.instruction_branch,
      // Type instructions
      $.instruction_type,
      // Field instructions
      $.instruction_field,
      // Method instructions
      $.instruction_method,
      // LDC instructions
      $.instruction_ldc,
      // IINC instruction
      $.instruction_iinc,
      // TABLESWITCH instruction
      $.instruction_tableswitch,
      // LOOKUPSWITCH instruction
      $.instruction_lookupswitch,
      // MULTIANEWARRAY instruction
      $.instruction_multianewarray,
      // INVOKEDYNAMIC instruction
      $.instruction_invokedynamic,
      // WIDE prefix
      $.instruction_wide,
      // NEWARRAY instruction
      $.instruction_newarray,
    ),

    instruction_nullary: $ => choice(
      // Constants
      'aconst_null', 'iconst_m1', 'iconst_0', 'iconst_1', 'iconst_2', 'iconst_3', 'iconst_4', 'iconst_5',
      'lconst_0', 'lconst_1', 'fconst_0', 'fconst_1', 'fconst_2', 'dconst_0', 'dconst_1',
      // Loads
      'iload_0', 'iload_1', 'iload_2', 'iload_3',
      'lload_0', 'lload_1', 'lload_2', 'lload_3',
      'fload_0', 'fload_1', 'fload_2', 'fload_3',
      'dload_0', 'dload_1', 'dload_2', 'dload_3',
      'aload_0', 'aload_1', 'aload_2', 'aload_3',
      // Stores
      'istore_0', 'istore_1', 'istore_2', 'istore_3',
      'lstore_0', 'lstore_1', 'lstore_2', 'lstore_3',
      'fstore_0', 'fstore_1', 'fstore_2', 'fstore_3',
      'dstore_0', 'dstore_1', 'dstore_2', 'dstore_3',
      'astore_0', 'astore_1', 'astore_2', 'astore_3',
      // Array loads
      'iaload', 'laload', 'faload', 'daload', 'aaload', 'baload', 'caload', 'saload',
      // Array stores
      'iastore', 'lastore', 'fastore', 'dastore', 'aastore', 'bastore', 'castore', 'sastore',
      // Stack operations
      'pop', 'pop2', 'dup', 'dup_x1', 'dup_x2', 'dup2', 'dup2_x1', 'dup2_x2', 'swap',
      // Arithmetic
      'iadd', 'ladd', 'fadd', 'dadd',
      'isub', 'lsub', 'fsub', 'dsub',
      'imul', 'lmul', 'fmul', 'dmul',
      'idiv', 'ldiv', 'fdiv', 'ddiv',
      'irem', 'lrem', 'frem', 'drem',
      'ineg', 'lneg', 'fneg', 'dneg',
      // Shifts
      'ishl', 'lshl', 'ishr', 'lshr', 'iushr', 'lushr',
      // Bitwise
      'iand', 'land', 'ior', 'lor', 'ixor', 'lxor',
      // Conversions
      'i2l', 'i2f', 'i2d', 'l2i', 'l2f', 'l2d',
      'f2i', 'f2l', 'f2d', 'd2i', 'd2l', 'd2f',
      'i2b', 'i2c', 'i2s',
      // Comparisons
      'lcmp', 'fcmpl', 'fcmpg', 'dcmpl', 'dcmpg',
      // Returns
      'ireturn', 'lreturn', 'freturn', 'dreturn', 'areturn', 'return',
      // Array length
      'arraylength',
      // Throw
      'athrow',
      // Monitor
      'monitorenter', 'monitorexit',
      // Breakpoint
      'breakpoint',
      // Reserved
      'impdep1', 'impdep2',
      // NOP
      'nop',
    ),

    instruction_var: $ => seq(
      choice(
        'iload', 'lload', 'fload', 'dload', 'aload',
        'istore', 'lstore', 'fstore', 'dstore', 'astore',
        'ret',
      ),
      $.number,
    ),

    instruction_int: $ => seq(
      choice('bipush', 'sipush'),
      $.number,
    ),

    instruction_branch: $ => seq(
      choice(
        'ifeq', 'ifne', 'iflt', 'ifge', 'ifgt', 'ifle',
        'if_icmpeq', 'if_icmpne', 'if_icmplt', 'if_icmpge', 'if_icmpgt', 'if_icmple',
        'if_acmpeq', 'if_acmpne',
        'goto', 'jsr', 'goto_w', 'jsr_w',
        'ifnull', 'ifnonnull',
      ),
      $.identifier,
    ),

    instruction_type: $ => seq(
      choice(
        'new', 'anewarray', 'checkcast', 'instanceof',
      ),
      $.class_name,
    ),

    instruction_field: $ => seq(
      choice('getfield', 'putfield', 'getstatic', 'putstatic'),
      $.field_reference,
      $.type_descriptor,
    ),

    // Field reference: class/path/fieldName (parsed as single token)
    field_reference: $ => /[a-zA-Z_$][a-zA-Z_$0-9]*(\/[a-zA-Z_$][a-zA-Z_$0-9]*)+/,

    instruction_method: $ => seq(
      choice('invokevirtual', 'invokespecial', 'invokestatic', 'invokeinterface'),
      $.method_reference,
      $.method_descriptor,
      optional($.number),  // for invokeinterface
    ),

    // Method reference: class/path/methodName or class/path/<init>
    method_reference: $ => choice(
      /[a-zA-Z_$][a-zA-Z_$0-9]*(\/[a-zA-Z_$][a-zA-Z_$0-9]*)+/,
      /[a-zA-Z_$][a-zA-Z_$0-9]*(\/[a-zA-Z_$][a-zA-Z_$0-9]*)*\/<init>/,
      /[a-zA-Z_$][a-zA-Z_$0-9]*(\/[a-zA-Z_$][a-zA-Z_$0-9]*)*\/<clinit>/,
    ),

    instruction_ldc: $ => seq(
      choice('ldc', 'ldc_w', 'ldc2_w'),
      choice(
        $.number,
        $.float_number,
        $.string,
        $.class_name,
      ),
    ),

    instruction_iinc: $ => seq(
      'iinc',
      $.number,
      $.number,
    ),

    instruction_tableswitch: $ => seq(
      'tableswitch',
      $.number,
      repeat($.identifier),
      'default', ':', $.identifier,
    ),

    instruction_lookupswitch: $ => seq(
      'lookupswitch',
      repeat(seq($.number, ':', $.identifier)),
      'default', ':', $.identifier,
    ),

    instruction_multianewarray: $ => seq(
      'multianewarray',
      $.type_descriptor,
      $.number,
    ),

    instruction_invokedynamic: $ => seq(
      'invokedynamic',
      $.identifier,
      $.method_descriptor,
      $.identifier,
      '(',
      repeat(choice($.number, $.string, $.class_name)),
      ')',
    ),

    instruction_wide: $ => seq(
      'wide',
      choice(
        $.instruction_var,
        $.instruction_iinc,
      ),
    ),

    // NEWARRAY primitive types
    instruction_newarray: $ => seq(
      'newarray',
      choice(
        'boolean', 'char', 'float', 'double',
        'byte', 'short', 'int', 'long',
      ),
    ),
  },
});
