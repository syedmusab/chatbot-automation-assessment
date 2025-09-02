class ChatPage {
  get chatInput() {
    return cy.get('#chat-input');
  }

  get sendButton() {
    return cy.get('#send-message-button');
  }

  get lastAIResponse() {
    return cy.getStableResponse('#response-content-container');
  }

  get chatWidget() {
    return cy.get("#chat-container");
  }

  get title() {
    return cy.get("nav > p");
  }

  get logoButton() {
    return cy.get("div.w-full > button");
  }

  get switchToArabic() {
    return cy.get("button:nth-of-type(1) > div.truncate");
  }

  get renderedResponse() {
    return cy.get('.chat-assistant');
  }

  get userChatQuery() {
    return cy.get('.chat-user .bg-light-bg');
  }

  get responseTyping() {
    return cy.contains('span', 'Formulating the best answer..');

  }

  validateChatScreen() {
    this.chatWidget.should('be.visible');
    this.title.should('be.visible');
    this.logoButton.should('be.visible');
  }


  sendMessage(message) {
    this.chatInput.type(message, { force: true });
    this.sendButton.click();
    

    return this.lastAIResponse.then((finalText) => {
      expect(finalText).not.to.be.empty;
      cy.log('Final AI Response:', finalText);
      return cy.wrap(finalText);
    });
  }


  validateAIResponse(keywords) {
    this.lastAIResponse.invoke('text').then((text) => {
      keywords.forEach(keyword => expect(text.toLowerCase()).to.contain(keyword.toLowerCase()));
    });
  }

  validateResponseForHallucination(keywords) {
    this.lastAIResponse.invoke('text').then((text) => {
      keywords.forEach(keyword => expect(text.toLowerCase()).to.not.include(keyword.toLowerCase()));
    });
  }

  validateResponseForBrokenHtml() {
    this.lastAIResponse.invoke('html').then((html) => {
      // Check that there are no unclosed HTML tags at the end
      expect(html).not.to.match(/<[^>]*$/);
    });
  }

  switchToArabicMode() {
    cy.contains('button', 'Farrukh Mohsin').click();
    this.switchToArabic.click();
    this.chatInput.click();
  }

  validateForLTRLanguage() {
    this.chatInput.should('have.css', 'direction', 'ltr');
    this.chatInput.first().should('have.css', 'text-align', 'left');
  }

  validateForRTLLanguage() {
    this.chatInput.should('be.visible')
      .and('have.css', 'text-align', 'right');
  }

  validateForScrollMessage() {
    this.renderedResponse.last()
      .scrollIntoView()
      .should('be.visible');
  }
}

export default new ChatPage();
