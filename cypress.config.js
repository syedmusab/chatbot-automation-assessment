const { defineConfig } = require('cypress');
const allureWriter = require('@shelex/cypress-allure-plugin/writer');

module.exports = defineConfig({
  e2e: {
    chromeWebSecurity: false,
    setupNodeEvents(on, config) { 
      require('@shelex/cypress-allure-plugin/writer')(on, config);
      return config;
    },
    env: {
      supportFile: 'cypress/support/e2e.js',
      baseUrl: 'https://govgpt.sandbox.dge.gov.ae/',
      email: 'farrukh.mohsin@northbaysolutions.net',
      password: 'test',
      language: "en",
      authToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjViMzczMWU2LWQ2OWItNDBkOS1iN2FlLWJlMWEyYTljZWE5OSJ9.tZeU5eRSuo0NVq_LprrAVy6kaMbt217fUnM1cmo78OA",
      ContentType: "application/json",
      accuracy: 0.7
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    responseTimeout: 30000
  },
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/reports',
    overwrite: false,
    html: true,
    json: true
  },
});