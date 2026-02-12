; Test.j - Generated from Test.java bytecode
; Bytecode version 65.0 (Java 21)

.bytecode 65.0
.source Test.java

.class public Test
.super java/lang/Object

; Default constructor
.method public <init>()V
    .limit stack 1
    .limit locals 1
    aload_0
    invokespecial java/lang/Object/<init>()V
    return
.end method

; public static void main(String[] args)
.method public static main([Ljava/lang/String;)V
    .limit stack 2
    .limit locals 1
    getstatic java/lang/System/out Ljava/io/PrintStream;
    ldc "Hello"
    invokevirtual java/io/PrintStream/println(Ljava/lang/String;)V
    return
.end method

; public static int add(int a, int b)
.method public static add(II)I
    .limit stack 2
    .limit locals 2
    iload_0
    iload_1
    iadd
    ireturn
.end method
