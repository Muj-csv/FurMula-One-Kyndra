/// <reference types="vite/client" />
//
// Standard Vite ambient types. Adds the `?raw` module declaration that
// tests/survey-capture.test.ts uses to read a script's source as a string —
// which is how that test avoids pulling in @types/node for one readFileSync.
