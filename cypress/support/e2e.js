// This support file is loaded automatically before your test files.
// You can use this file to set up global configurations or behaviors.

// For example, to disable uncaught exceptions:

Cypress.on('window:before:load', (win) => {
  cy.stub(win, 'fetch', (url) => {
    if (url.includes('backtrace.io')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }
    return fetch(url); // fallback to original
  });
});