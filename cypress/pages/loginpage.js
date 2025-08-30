class LoginPage {
   
    get emailInput() {
      return cy.get('#email');
    }
  
    get passwordInput() {
      return cy.get('#password');
    }
  
    get signInButton() {
      return cy.contains('button', 'Sign in');
    }
  
    get loginWithCredentialsButton() {
      return cy.get("Login using Credentials");
    }

    get landingPageIcons(){
        return cy.get('.suggestion-inputbox.w-full')
        .should('exist')
        .and('be.visible');
    }

    visit() {
      return cy.visit(Cypress.env('baseUrl'));
    }
  
    login(email, password) {
      this.loginWithCredentialsButton.should('be.visible').click();
      this.emailInput.should('be.visible').type(email);
      this.passwordInput.should('be.visible').type(password, { log: false });
      this.signInButton.should('not.be.disabled').click();
    
    }
  }

  export default new LoginPage();