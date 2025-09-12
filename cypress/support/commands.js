Cypress.Commands.add('login', () => {
  // Intercept the login API call
  cy.intercept('POST', '/api/v1/auths/signin').as('loginRequest');

  cy.contains("button", "Login using Credentials").click();
  cy.get('#email').type(Cypress.env('email'));
  cy.get('#password').type(Cypress.env('password'), { log: false });
  cy.contains("button", "Sign in").should("be.visible").click();
  cy.get('.suggestion-inputbox.w-full')
    .should('exist')
    .and('be.visible')

  // Wait for the login request to complete
  return cy.wait('@loginRequest').then(({ response }) => {
    expect(response.statusCode).to.eq(200);

    // Extract token from response headers
    const token = response.body['token'] || response.body['token'];
    expect(token, 'Login token should exist in header').to.not.be.undefined;

    // Remove 'Bearer '
    return token.replace(/^Bearer\s+/i, '');
  });
});

Cypress.Commands.add('getStableResponse', (selector, timeout = 60000, interval = 3000, stableThreshold = 2) => {
  const placeholderTexts = [
    '⏳ Just a sec...',
    '💡 Thinking through your question...',
    '📝 Formulating the best answer...'
  ];

  let lastText = '';
  let stableCount = 0;
  const start = Date.now();

  function check() {
    return cy.get(selector)
      .last()
      .invoke('text')
      .then((text) => {
        const trimmed = text.trim();

        // Ignore placeholder messages
        if (placeholderTexts.includes(trimmed)) {
          return cy.wait(interval).then(check);
        }

        // Check if text is stable
        if (trimmed && trimmed === lastText) {
          stableCount++;
          if (stableCount >= stableThreshold) {
            // Wrap the final stable text for Cypress chaining
            return cy.wrap(trimmed);
          }
        } else {
          lastText = trimmed;
          stableCount = 0;
        }

        // Timeout exception
        if (Date.now() - start > timeout) {
          throw new Error(
            `AI response did not stabilize in time. Last text: "${lastText}"`
          );
        }
        return cy.wait(interval).then(check);
      });
  }
  return check();
}
);

Cypress.Commands.add('waitForFinalAIResponse', (token, chatId, timeout = 10000, interval = 2000) => {
  const start = Date.now();
  function check(lastText = '', stableCount = 0) {
    return cy.request({
      method: 'GET',
      url: `/api/v1/chats/${chatId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': Cypress.env('ContentType')
      }
    }).then((res) => {
      expect(res.status).to.eq(200);
      const messages = res.body.chat.messages;
      const lastMessage = messages[messages.length - 1];
      const aiText = lastMessage?.content?.trim() || '';
      if (aiText && aiText === lastText) {
        if (stableCount >= 1) {
          return cy.wrap(aiText);
        }
        return cy.wait(interval).then(() => check(aiText, stableCount + 1));
      }
      if (Date.now() - start > timeout) {
        throw new Error('AI response did not stabilize in time');
      }
      return cy.wait(interval).then(() => check(aiText, 0));
    });
  }
  return check();
});

Cypress.Commands.add('validateResponseForBrokenHtml', (selector = '#response-content-container') => {
  cy.get(selector)
    .last()
    .should('exist')
    .invoke('html')
    .then((html) => {
      expect(html, 'Response ends with incomplete HTML tag').not.to.match(/<[^>]*$/);
    });
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
    cy.get(chatWidgetSelector, { timeout: 15000 })
      // Get the chat messages
      .last()
      // Take the last message (most recent response)
      .invoke('text')
      // Get the text content
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