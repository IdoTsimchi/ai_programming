"use strict";
/* Course and topic catalogue. Proofs register themselves in js/proofs/*.js using these ids. */
ML.registerCourse({
  id: "linalg2",
  title: "Linear Algebra 2",
  icon: "▦",
  color: "#4fd1a5",
  blurb: "Eigenvalues, inner products, linear maps and quadratic forms: the proofs that show up on every exam.",
  topics: [
    { id: "eigen", title: "Eigenvalues & diagonalization", blurb: "Why eigenvectors behave, and when a matrix can be diagonalized." },
    { id: "inner", title: "Inner product spaces", blurb: "Angles, projections and orthogonal bases." },
    { id: "maps", title: "Linear maps", blurb: "Dimension counting and change of basis." },
    { id: "quad", title: "Symmetric matrices & quadratic forms", blurb: "Principal axes, extrema and definiteness." },
  ],
});

ML.registerCourse({
  id: "infi2",
  title: "Infinitesimal Calculus 2",
  icon: "∑",
  color: "#6c8cff",
  blurb: "Limits and continuity, Taylor approximation, Riemann integrals, series, and uniform convergence, with every classic proof made visual.",
  topics: [
    { id: "limits", title: "Limits & continuity", blurb: "The \u03B5\u2013\u03B4 definition, squeezing, and the big theorems on continuous functions." },
    { id: "taylor", title: "Taylor & approximation", blurb: "Approximating functions by polynomials, and controlling the error." },
    { id: "integrals", title: "Integrals", blurb: "Riemann sums, integrability, and the Fundamental Theorem of Calculus." },
    { id: "series", title: "Series of numbers", blurb: "Geometric and infinite series, and the tests for convergence." },
    { id: "funcseries", title: "Function series & uniform convergence", blurb: "Sequences and series of functions, power series, and why uniform convergence matters." },
  ],
});
