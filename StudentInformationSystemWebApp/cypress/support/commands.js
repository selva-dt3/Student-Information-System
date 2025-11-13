// Custom Cypress commands

Cypress.Commands.add('stubStudentsList', (fixture = 'students.json') => {
  // Supabase REST API path pattern (host varies by project)
  // We broadly match any /rest/v1/students requests.
  cy.intercept({ method: 'GET', url: /\/rest\/v1\/students.*/ }, (req) => {
    req.reply((res) => {
      // For count requests, Supabase uses Prefer: count=exact and returns content-range header.
      // We'll set an approximate header if requested.
      const sendBody = { data: [] };
      cy.fixture(fixture).then((students) => {
        sendBody.data = students;
        res.send({
          statusCode: 200,
          body: students,
          headers: { 'content-range': `0-${students.length - 1}/${students.length}` },
        });
      });
    });
  });
});

Cypress.Commands.add('stubStudentsMutations', () => {
  // Insert
  cy.intercept({ method: 'POST', url: /\/rest\/v1\/students.*/ }, { statusCode: 201, body: { id: 'new-id' } });
  // Update
  cy.intercept({ method: 'PATCH', url: /\/rest\/v1\/students.*/ }, { statusCode: 200, body: { id: '1' } });
  // Delete
  cy.intercept({ method: 'DELETE', url: /\/rest\/v1\/students.*/ }, { statusCode: 204, body: {} });
});
