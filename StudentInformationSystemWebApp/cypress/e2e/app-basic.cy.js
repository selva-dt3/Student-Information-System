/// <reference types="cypress" />

describe('Student Information System - basic flows', () => {
  beforeEach(() => {
    cy.stubStudentsList();
    cy.stubStudentsMutations();
  });

  it('loads app and shows header', () => {
    cy.visit('/');
    cy.contains('Student Information System').should('be.visible');
    cy.contains('Students').should('be.visible');
  });

  it('search and pagination controls visible', () => {
    cy.visit('/');
    cy.findByRole('navigation', { name: /students search and actions/i }).should('exist');
    cy.contains(/Rows per page/i).should('be.visible');
    cy.findByRole('button', { name: /Next/i }).should('be.enabled');
  });

  it('open add form and cancel', () => {
    cy.visit('/');
    cy.findByRole('button', { name: /\+ Add Student/i }).click();
    cy.findByRole('form', { name: /student-form/i }).should('be.visible');
    cy.findByRole('button', { name: /Cancel/i }).click();
    cy.findByRole('form', { name: /student-form/i }).should('not.exist');
  });

  it('delete prompts and proceeds', () => {
    cy.visit('/');
    // Accept confirm dialog
    cy.on('window:confirm', () => true);
    cy.findAllByRole('button', { name: /Delete/i }).first().click();
  });
});
