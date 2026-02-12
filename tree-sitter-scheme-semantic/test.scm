(define (factorial n)
  (if (<= n 1)
      1
      (* n (factorial (- n 1)))))

(define-syntax my-macro
  (syntax-rules ()
    ((my-macro x) (+ x 1))))

(let ((x 1) (y 2))
  (+ x y))

(lambda (x) (* x x))

(define my-var 42)

(letrec ((even? (lambda (n) (if (= n 0) #t (odd? (- n 1)))))
         (odd? (lambda (n) (if (= n 0) #f (even? (- n 1))))))
  (even? 10))

(cond
  ((< x 0) 'negative)
  ((= x 0) 'zero)
  (else 'positive))

(case x
  ((1 2 3) 'small)
  ((4 5 6) 'medium)
  (else 'large))

(do ((i 0 (+ i 1)))
    ((= i 10) i)
  (display i))

;; Named let for iteration
(let loop ((i 0) (acc '()))
  (if (= i 10)
      acc
      (loop (+ i 1) (cons i acc))))
