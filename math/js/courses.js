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
  icon: "∂",
  color: "#6c8cff",
  blurb: "Multivariable calculus: differentiability, extrema and multiple integrals, with every classic proof made visual.",
  topics: [
    { id: "diff", title: "Differentiability & the gradient", blurb: "What “differentiable” really means in several variables." },
    { id: "extrema", title: "Extrema", blurb: "Critical points, the Hessian test and Lagrange multipliers." },
    { id: "integrals", title: "Multiple integrals", blurb: "Iterated integrals and changes of variables." },
  ],
});
