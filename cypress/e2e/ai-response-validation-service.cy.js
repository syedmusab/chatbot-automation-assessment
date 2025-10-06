import loginPage from '../pages/LoginPage';
import chatpage from '../pages/chatpage';
const { evaluateAIResponse } = require('../utils/ai-response-validator-utility');

let authToken;

describe('Gov-GPT AI Response Validation with external AI platforms', () => {

  Cypress.on('uncaught:exception', (err, runnable) => {
    return false;
  });

  // Runs before each test case in this spec file
  beforeEach(() => {
      cy.clearCookies();
      cy.clearLocalStorage();
    
      // Navigate to the portal
      loginPage.visit();
   
      // Perform login using Cypress custom command `cy.login`
      cy.login().then((token) => {
      authToken = token;
    });
  });

  it('Verification of AI provides clear response to user and compared chatbot response from external platforms', { retries: 2 }, () => {
    // Load fixture data from test-data.json file
    cy.fixture('test-data.json').then((testData) => {

      // Get the language from Cypress environment variables
      const language = Cypress.env('language') || 'en';

      // Find the query in fixture data matching category
      const query = testData[language].common_queries.find(q => q.category === 'emirates id');

      // Type query and send 
      chatpage.sendMessage(query.prompt);

      // Send an HTTP request using Cypress to get unique chat id
      cy.request({
        method: 'GET',
        url: '/api/v1/chats/',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': Cypress.env('ContentType')
        }
      }).then((getResponse) => {
        expect(getResponse.status).to.eq(200);
        const chats = getResponse.body;
        const chat = chats.find(c =>
          c.title.toLowerCase().includes('Emirates ID Required Documents'.toLowerCase())
        );
        // retrieve chat id
        const chatId = chat.id;
        cy.waitForFinalAIResponse(authToken, chatId).then((ourResponse) => {
          // Store the response in file
          cy.readFile(query.filepath).then((externalResponse) => {
            const evaluation = evaluateAIResponse(query.prompt, ourResponse, externalResponse);
            cy.log(`Lexical Similarity: ${evaluation.scores.lexicalSimilarity}%`);
            cy.log(`Cosine Similarity: ${evaluation.scores.cosineSimilarity}%`);
            cy.log(`Verdict: ${evaluation.verdict}`);

            // Assert cosine similarity threshold
            expect(evaluation.scores.lexicalSimilarity).to.be.greaterThan(40);
            expect(evaluation.scores.cosineSimilarity).to.be.greaterThan(50);
            expect(evaluation.verdict).to.not.equal('Responses differ significantly');
          });
        });
      });
    });
  });

  it('Verification of AI provides clear response to user and compared chatbot responses from OPEN AI service', { retries: 2 }, () => {
    // Load fixture data from test-data.json file
    cy.fixture('test-data.json').then((testData) => {

      // Get the language from Cypress environment variables
      const language = Cypress.env('language') || 'en';

      // Find the query in fixture data matching category
      const query = testData[language].common_queries.find(q => q.category === 'emirates id');

      // Store the expected keywords file path defined in the fixture for later validation
      const filePath = query.filepath;
      chatpage.sendMessage(query.prompt);

      // Send an HTTP request using Cypress to get unique chat id
      cy.request({
        method: 'GET',
        url: '/api/v1/chats/',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': Cypress.env('ContentType')
        }
      }).then((getResponse) => {
        expect(getResponse.status).to.eq(200);
        const chats = getResponse.body;
        const chat = chats.find(c =>
          c.title.toLowerCase().includes('Emirates ID Required Documents'.toLowerCase())
        );

        // retrieve chat id
        const chatId = chat.id;

        // Calls custom command to get the last AI response from the API
        cy.waitForFinalAIResponse(authToken, chatId).then((apiResponse) => {

          // Reads expected response from a local fixture/file
          cy.readFile(filePath).then((fileContent) => {
            cy.request({
              method: 'POST',
              // Sends both responses to an external API (ninjaApi) for cosine similarity calculation 
              url: Cypress.env('ninjaApi') + '/v1/textsimilarity',
              headers: {
                'X-Api-Key': Cypress.env('ninjaApiKey'),
                'Content-Type': 'application/json'
              },
              body: {
                text_1: apiResponse.toLowerCase(),
                text_2: fileContent.toLowerCase()
              }
            }).then((response) => {
              // Extracts similarity score from response
              const cosineScore = response.body.similarity;
              cy.log(`Cosine Similarity Score: ${(cosineScore * 100).toFixed(2)}%`);
              expect(cosineScore).to.be.greaterThan(0.6);
            });
          });
        });
      });
    });
  });

  it('Verification of responses are not hallucinated or irrelevant', { retries: 0 }, () => {
    cy.fixture('test-data.json').then((testData) => {
      const language = Cypress.env('language') || 'en';

      // From the fixture data, select the query belonging to the 'hallucinated' category
      const query = testData[language].common_queries.find(q => q.category === 'hallucinated');

      chatpage.sendMessage(query.prompt);

      // Store the list of hallucination indicators (phrases that suggest irrelevant or uncertain answers)
      const hallucinationIndicators = query.expected_keywords;

      // Validate the AI's response by asserting that none of the hallucination indicators appear
      chatpage.validateResponseForHallucination(hallucinationIndicators);
    });
  });

  it('Verification of HTML format without broken and open tags', { retries: 0 }, () => {

    cy.fixture('test-data.json').then((testData) => {
      const language = Cypress.env('language') || 'en';
      const query = testData[language].common_queries.find(q => q.category === 'capital');
      chatpage.sendMessage(query.prompt);

      // Validate that the chatbot response does not contain broken or unclosed HTML tags.
      cy.getStableResponse('#response-content-container', 60000).then(() => {
      cy.validateResponseForBrokenHtml('#response-content-container');
      });
    });
  });
});
