import loginPage from '../pages/LoginPage';
import chatpage from '../pages/chatpage';
import stringSimilarity from 'string-similarity';

describe('Gov-GPT AI Response Validation', () => {

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

  it('Verification of AI provides clear response to user and compared from external chatbots', { retries: 2 }, () => {
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
          'Authorization': `Bearer ${Cypress.env('authToken')}`,
          'Accept': Cypress.env('ContentType')
        }
      }).then((getResponse) => {
        cy.log(JSON.stringify(getResponse.body, null, 2));
        expect(getResponse.status).to.eq(200);
        const chats = getResponse.body;
        const chat = chats.find(c =>
          c.title.toLowerCase().includes('emirates id document checklist'.toLowerCase())
        );
        expect(chat).to.exist;
        const chatId = chat.id;

        // invoke API endpoint with dynamic chatId for fetching chat details, and reponse of AI chatbot
        cy.request({
          method: 'GET',
          url: `/api/v1/chats/${chatId}`,
          headers: {
            'Authorization': `Bearer ${Cypress.env('authToken')}`,
            'Accept': Cypress.env('ContentType')
          }
        }).then((postResponse) => {
          expect(postResponse.status).to.eq(200);
          cy.log(JSON.stringify(postResponse.body, null, 2));
          cy.wait(10000);
          const apiResonse = postResponse.body.chat.messages[1].content;

          cy.readFile(filePath).then((fileContent) => {

            // Calculate similarity score between API response and file content taken from other chatbot platforms (case-insensitive)
            const similarity = stringSimilarity.compareTwoStrings(
              apiResonse.toLowerCase(),
              fileContent.toLowerCase()
            );

            // Assert with a threshold to ensure the response is sufficiently similar
            // it is expected the score to be > 0.5 (more than 50% similarity)
            expect(similarity).to.be.greaterThan(0.5);
          });
        });
      });
    });
  });

  it('Verification of AI assistant provides clear response to user query', { retries: 2 }, () => {
    cy.fixture('test-data.json').then((testData) => {
      // Get the language from Cypress environment variables, defaulting to 'en' if not provided
      const language = Cypress.env('language') || 'en';

      // From the fixture data, locate the question under `common_queries`
      const query = testData[language].common_queries.find(q => q.category === 'capital');

      // Send the chatbot prompt message from the fixture 
      chatpage.sendMessage(query.prompt);

      // Validate the chatbot's response against the expected keywords
      chatpage.validateAIResponse(query.expected_keywords);
    });
  });

  it('Verification of responses are not hallucinated or irrelevant', { retries: 2 }, () => {
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

  it('Verification of HTML format without broken', { retries: 2 }, () => {

    cy.fixture('test-data.json').then((testData) => {
      const language = Cypress.env('language') || 'en';
      const query = testData[language].common_queries.find(q => q.category === 'capital');
      chatpage.sendMessage(query.prompt);

      // Validate that the chatbot response does not contain broken or unclosed HTML tags.
      chatpage.validateResponseForBrokenHtml();
    });
  });
});
