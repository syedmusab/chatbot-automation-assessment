Cypress.Commands.add('login', () => {
  cy.contains("button", "Login using Credentials").click();
  cy.get('#email').type(Cypress.env('email'));
  cy.get('#password').type(Cypress.env('password'), { log: false });
  cy.contains("button", "Sign in").should("be.visible").click();
  cy.get('.suggestion-inputbox.w-full')
    .should('exist')
    .and('be.visible')
});

Cypress.Commands.add('setLanguage', (language) => {
  cy.get('[data-testid="language-switcher"]').click();
  cy.contains('button', language === 'en' ? 'English' : 'العربية').click();
});

Cypress.Commands.add('sendMessage', (message) => {
  cy.get('#chat-input').type(message);
  cy.get('#send-message-button').click();
  // Wait for message to appear in chat
  cy.get('.user-message').last().should('contain.text', message);
});

Cypress.Commands.add('validateResponse', (expectedKeywords, timeout = 60000) => {
  // Wait for AI response
  cy.get('.ai-response', { timeout }).should('be.visible');

  // Get the response text
  cy.get('.ai-response').last().invoke('text').then((responseText) => {
    // Check for each expected keyword
    expectedKeywords.forEach(keyword => {
      expect(responseText.toLowerCase()).to.include(keyword.toLowerCase());
    });

    // Check that response is not empty or error
    expect(responseText.trim().length).to.be.greaterThan(10);

    // Check that response doesn't contain HTML tags
    expect(responseText).not.to.match(/<[^>]*>/);
  });


  Cypress.Commands.add('verifySanitization', (selector) => {
    cy.get(selector, { timeout: 15000 }) 
      .last() 
      .invoke('html') 
      .then((html) => {
        // Assert that no <script> tags are present to ensure sanitization
        expect(html).not.to.include('<script>');
      });
  });

  Cypress.Commands.add('verifyRefusal', (chatWidgetSelector, maliciousPrompt) => {
    cy.get(chatWidgetSelector, { timeout: 15000 }) // Get the chat messages
      .last() // Take the last message (most recent response)
      .invoke('text') // Get the text content
      .then((responseText) => {
        const refusalIndicators = maliciousPrompt.expected_keywords; // keywords indicating refusal
        // Check if any of the refusal indicators are present in the response
        const isRefusal = refusalIndicators.some(indicator =>
          responseText.toLowerCase().includes(indicator.toLowerCase())
        );
        // Assert that the chatbot refused the malicious prompt
        expect(isRefusal).to.be.true;
      });
  });

  Cypress.Commands.add('verifyFallback', (chatContainerSelector, maliciousPrompt) => {
    cy.get(chatContainerSelector, { timeout: 15000 }) 
      .last() 
      .invoke('text') 
      .then((responseText) => {
        const fallbackIndicators = maliciousPrompt.expected_keywords; 
        const isFallback = fallbackIndicators.some(indicator =>
          responseText.toLowerCase().includes(indicator.toLowerCase())
        );
        // Assert that the chatbot returned a fallback message
        expect(isFallback).to.be.true;
      });
  });

});