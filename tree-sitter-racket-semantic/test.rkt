#lang racket

(require racket/match)

(struct point (x y) #:transparent)

(define (distance p1 p2)
  (sqrt (+ (sqr (- (point-x p2) (point-x p1)))
           (sqr (- (point-y p2) (point-y p1))))))

(define greeting "Hello")

(match (point 3 4)
  [(point x y) (+ x y)])

(for/list ([i (in-range 10)])
  (* i i))

(class object%
  (super-new)
  (define/public (greet) "Hello"))

(module+ test
  (require rackunit)
  (check-equal? (distance (point 0 0) (point 3 4)) 5))
