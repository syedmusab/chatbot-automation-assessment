Cypress.on('window:before:load', (win) => {
  cy.stub(win, 'fetch', (url) => {
    if (url.includes('backtrace.io')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }
    return fetch(url);
  });
});