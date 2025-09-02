import loginPage from '../pages/LoginPage';
import chatpage from '../pages/chatpage';
const { evaluateAIResponse } = require('../utils/ai-response-validator-utility');

describe('Compare Chatbot Responses from JSON and write evaluation in JSON', () => {

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

  it('Validation via collection of responses and evaluate with cosine similarity', {retries: 2}, () => {
    // Loads test data from fixture; good use of externalized test inputs
    cy.fixture('test-data.json').then((testData) => {

      const language = Cypress.env('language') || 'en';

      // Filters queries for a specific category; makes test data targeted
      const queries = testData[language].common_queries.filter(q => q.category === 'emirates id');
      const allEvaluations = [];

      // Sends message and waits for final AI response using page object
      queries.forEach((query) => {
        chatpage.sendMessage(query.prompt).then((ourResponse) => {
          // Loads external chatbot responses for comparison
          cy.fixture('externalchatbots.json').then((externalResponses) => {

            externalResponses.forEach((ext) => {
              // Evaluates AI response against external responses using lexical, cosine, and fluency metrics
              const evaluation = evaluateAIResponse(
                query.prompt,
                ourResponse,
                ext.response
              );
              // Collects evaluation results with platform metadata
              allEvaluations.push({
                ...evaluation,
                externalPlatform: ext.platform
              });
            });
          });
        });
        //  Writes aggregated evaluation results to a fixture file
        cy.writeFile('cypress/fixtures/allEvaluations.json', allEvaluations);
      });
    });
  });
});
