import loginPage from '../pages/LoginPage';
import chatpage from '../pages/chatpage';

describe('Security & Injection Handling Validation', () => {

  Cypress.on('uncaught:exception', (err, runnable) => {
    return false;
  });

  // Runs before each test case in this spec file
  beforeEach(() => {
    // Navigate to the login page
    loginPage.visit();

    // Perform login using Cypress custom command `cy.login`
    cy.login(Cypress.env('email'), Cypress.env('password'));
  });

  it('Verificatio of chat input sanitizes special characters', { retries: 2 }, () => {
    cy.fixture('test-data.json').then((testData) => {

      // Get the current language from Cypress environment variables
      const language = Cypress.env('language');

      // Find a malicious prompt from the test data that is expected to be sanitized
      const maliciousPrompt = testData[language].malicious_prompts.find(p => p.expected_behavior === 'sanitized');

      // Send the malicious prompt to the chatbot
      chatpage.sendMessage(maliciousPrompt.prompt);

      // Function to verify that the message content is properly sanitized
      const verifySanitization = selector => {
        cy.get(selector, {
          timeout: 15000
          // Take the last element (assumes the last message is the one just sent)
        }).last().invoke('html').then(html => {
          // Assert that no <script> tags are present to ensure sanitization
          expect(html).not.to.include('<script>');
        });
      };
      verifySanitization('.chat-user .bg-light-bg');
    });
  });

  it('Verification of AI does not act on malicious prompts', { retries: 2 }, () => {

    cy.fixture('test-data.json').then((testData) => {
      const language = Cypress.env('language');
      const maliciousPrompt = testData[language].malicious_prompts.find(p => p.expected_behavior === 'refuse');
      chatpage.sendMessage(maliciousPrompt.prompt);

      // Function to verify that the chatbot refuses a malicious prompt
      cy.get('#chat-container', {
        timeout: 15000
      }).last().invoke('text').then(responseText => {
        const refusalIndicators = maliciousPrompt.expected_keywords;
        const isRefusal = refusalIndicators.some(indicator => responseText.toLowerCase().includes(indicator.toLowerCase()));
        // Assert that the chatbot refused the malicious prompt
        expect(isRefusal).to.be.true;
      });
    });
  });

  it('Verification of Fallback messages appear when expected', { retries: 2 }, () => {
    cy.fixture('test-data.json').then((testData) => {
      const language = Cypress.env('language');
      const maliciousPrompt = testData[language].malicious_prompts.find(p => p.expected_behavior === 'garbage');
      chatpage.sendMessage(maliciousPrompt.prompt);

      // Function to verify that the chatbot triggers a fallback response
      cy.get('#chat-container', {
        timeout: 15000
      }).last().invoke('text').then(responseText => {
        const fallbackIndicators = maliciousPrompt.expected_keywords;
        const isFallback = fallbackIndicators.some(indicator => responseText.toLowerCase().includes(indicator.toLowerCase()));
       // Assert that the chatbot returned a fallback message
        expect(isFallback).to.be.true;
      });
    });
  });
});