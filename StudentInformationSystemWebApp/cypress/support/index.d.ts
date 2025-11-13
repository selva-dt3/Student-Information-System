// TypeScript definitions (optional) placeholder to silence IDEs.
declare namespace Cypress {
  interface Chainable {
    stubStudentsList(fixture?: string): Chainable<void>;
    stubStudentsMutations(): Chainable<void>;
  }
}
