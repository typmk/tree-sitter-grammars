(defun factorial (n)
  "Calculate factorial."
  (if (<= n 1)
      1
    (* n (factorial (1- n)))))

(defmacro with-timing (&body body)
  `(let ((start (get-internal-real-time)))
     ,@body
     (- (get-internal-real-time) start)))

(defclass point ()
  ((x :initarg :x :accessor point-x)
   (y :initarg :y :accessor point-y)))

(defmethod print-object ((p point) stream)
  (format stream "#<POINT ~A,~A>" (point-x p) (point-y p)))

(defvar *count* 0)
(defparameter *name* "test")

(let ((x 1) (y 2))
  (+ x y))

(loop for i from 1 to 10 collect (* i i))
