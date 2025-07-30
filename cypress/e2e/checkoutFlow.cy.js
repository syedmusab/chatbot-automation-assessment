describe('Swag Labs Checkout Flow', () => {

  beforeEach(() => {
    const baseUrl = 'https://www.saucedemo.com/';  
    cy.visit(baseUrl)
    cy.get('[data-test="username"]').type('standard_user');
    cy.get('[data-test="password"]').type('secret_sauce');
    cy.get('[data-test="login-button"]').click();
  });

  it('completes checkout with 3 random items', () => {

    cy.get('.inventory_item').then($items => {
      const itemCount = $items.length;
      const selectedIndexes = new Set();

      // Select 3 unique random indexes
      while (selectedIndexes.size < 3) {
        selectedIndexes.add(Math.floor(Math.random() * itemCount));
      }

      // Click "Add to Cart" for selected items
      Array.from(selectedIndexes).forEach(index => {
        cy.wrap($items[index]).find('button').click();
      });
    });

    // Go to cart
    cy.get('.shopping_cart_link').click();
    cy.get('.cart_item').should('have.length', 3);

    // Proceed to checkout
    cy.get('[data-test="checkout"]').click();
    cy.get('[data-test="firstName"]').type('Syed');
    cy.get('[data-test="lastName"]').type('Ali');
    cy.get('[data-test="postalCode"]').type('12345');
    cy.get('[data-test="continue"]').click();

    // Assert summary and finish order
    cy.get('.summary_total_label').should('exist');
    cy.get('[data-test="finish"]').click();
    cy.contains('Thank you for your order!').should('be.visible');
});
});
