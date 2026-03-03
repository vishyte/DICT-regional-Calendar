// This file provides minimal ambient declarations for optional export libraries
// so that TypeScript doesn't raise errors while the packages are not installed.
// Once the packages are actually added to package.json, these can be removed
// (the real type declarations will be used instead).

declare module 'xlsx';
declare module 'jspdf';
declare module 'jspdf-autotable';
