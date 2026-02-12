; HelloWorld.j - A simple Jasmin example
; Compile: java -jar jasmin.jar HelloWorld.j
; Run: java HelloWorld

.bytecode 52.0
.source HelloWorld.java

.class public HelloWorld
.super java/lang/Object

; Default constructor
.method public <init>()V
    .limit stack 1
    .limit locals 1
    aload_0
    invokespecial java/lang/Object/<init>()V
    return
.end method

; Main method
.method public static main([Ljava/lang/String;)V
    .limit stack 2
    .limit locals 1

    ; Get System.out
    getstatic java/lang/System/out Ljava/io/PrintStream;

    ; Push the string to print
    ldc "Hello, World!"

    ; Call println
    invokevirtual java/io/PrintStream/println(Ljava/lang/String;)V

    return
.end method

; A method demonstrating various instructions
.method public static factorial(I)I
    .limit stack 4
    .limit locals 2

    ; if (n <= 1) return 1
    iload_0
    iconst_1
    if_icmpgt compute
    iconst_1
    ireturn

compute:
    ; return n * factorial(n-1)
    iload_0
    iload_0
    iconst_1
    isub
    invokestatic HelloWorld/factorial(I)I
    imul
    ireturn
.end method
