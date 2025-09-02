import loginPage from '../pages/LoginPage';
import chatpage from '../pages/chatpage';

describe('Chatbots UI Validation', () => {

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

  it('Verification of chat widget loads correctly on desktop', { retries: 2 }, () => {
    // Set viewport size to simulate desktop resolution
    cy.viewport(1280, 720);
    // Validate chat widget elements are visible
    chatpage.validateChatScreen();
  });

  it('Verification of chat widget loads correctly on on mobile', () => {

    // Set viewport size to iPhone X dimensions (375x812)
    cy.viewport('iphone-x');
    // Validate chat widget elements are visible
    chatpage.validateChatScreen();
  });

  it('Verification of LTR layout for English language', { retries: 2 }, () => {
    // Load test data from fixture file
    cy.fixture('test-data.json').then((testData) => {
      // Get language setting from Cypress environment
      const language = Cypress.env('language') || 'en';

      // Pick the query for category from fixture test data
      const query = testData[language].common_queries.find(q => q.category === 'capital');

      // Send the prompt message to chat
      chatpage.sendMessage(query.prompt);

      // Assert that the chat input box has CSS direction set to left-to-right
      // Assert that the text inside chat input aligns to the left (expected in LTR languages)
      chatpage.validateForLTRLanguage();

    });
  });

  it('Verification of RTL layout for Arabic language', { retries: 2 }, () => {
    //switching to arabic mode
    chatpage.switchToArabicMode();
    cy.fixture('test-data.json').then((testData) => {
      const language = Cypress.env('language') || 'ar';
      const query = testData[language].common_queries.find(q => q.category === 'driving');
      chatpage.sendMessage(query.prompt);

      // Assert that the text inside chat input aligns to the right (expected in RTL languages)
      chatpage.validateForRTLLanguage();
    });
  });

  it('Verification of scroll works correctly in conversation area', { retries: 2 }, () => {
    // Send multiple messages to create scroll
    for (let i = 1; i <= 2; i++) {
      chatpage.sendMessage(`Scroll Test Message ${i}`);
    }
    // Verify scrolling works
    chatpage.validateForScrollMessage();
  });
});