# Sauce Demo Cypress Automation

## ✅ Objective
Automate a successful checkout process on [Sauce Labs Demo](https://www.saucedemo.com/) including:
- Logging in
- Randomly selecting 3 items
- Adding them to cart
- Checking out
- Verifying total and confirmation message

## ✅ Setup Instructions
```bash
git clone https://github.com/your-username/sauce-demo-cypress.git
cd sauce-demo-cypress
npm install
npx cypress open   # for GUI
npx cypress run    # for headless + reporting
```

## ✅ Reporting
Reports are saved in:  
`cypress/reports/mochawesome-report/`

## ✅ Credentials Used
- **Username:** `standard_user`
- **Password:** `secret_sauce`