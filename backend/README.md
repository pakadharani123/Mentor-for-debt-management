# AI-Powered Debt Management & Financial Guidance Platform Backend

A production-ready Node.js backend providing financial analytics, debt repayment scheduling (Snowball vs. Avalanche), emergency fund tracking, savings goals, multi-lingual support, AI financial advice (OpenAI / Gemini / rules-based Mock), and downloadable PDF report generation.

---

## Technical Stack
* **Runtime**: Node.js (>=18.0.0)
* **Framework**: Express.js
* **Database**: MongoDB with Mongoose
* **Security**: JWT Authentication, Bcrypt password hashing, Helmet, CORS, Route-specific Rate Limiting
* **Input Validation**: Express-Validator
* **AI Engine**: Abstract AIProvider factory (supports OpenAI API, Google Gemini API, and a rules-based multi-lingual Local Provider)
* **Report Generation**: PDFKit

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js             # MongoDB connection setup
│   │   └── config.js         # Configuration exports (Port, secrets, API keys)
│   ├── models/
│   │   ├── User.js           # User Auth schema
│   │   ├── FinancialProfile.js # General monthly income/expenses
│   │   ├── Loan.js           # Outstanding debts
│   │   ├── Expense.js        # Detailed categorized expenses
│   │   └── SavingsGoal.js    # Target financial goals
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── loanController.js
│   │   ├── expenseController.js
│   │   ├── dashboardController.js
│   │   ├── repaymentController.js
│   │   ├── healthController.js
│   │   ├── aiController.js
│   │   └── bonusController.js # Simulators, planners, savings goal CRUD
│   │   └── reportController.js # PDF report rendering
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── loanRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── repaymentRoutes.js
│   │   ├── healthRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── bonusRoutes.js
│   │   └── index.js          # Master aggregator route
│   ├── middleware/
│   │   ├── authMiddleware.js # Authentication protector
│   │   ├── errorMiddleware.js # Centralized error handler
│   │   ├── rateLimitMiddleware.js # Route-specific request limits
│   │   └── validatorMiddleware.js # Input check runner
│   ├── services/
│   │   ├── ai/
│   │   │   ├── AIProvider.js  # Abstract interface
│   │   │   ├── OpenAIProvider.js
│   │   │   ├── GeminiProvider.js
│   │   │   ├── MockProvider.js # Custom local rules engine
│   │   │   └── aiService.js   # Factory selector
│   │   ├── debtStrategyService.js # Snowball vs. Avalanche simulation
│   │   ├── healthScoreService.js  # 0-100 score and risk rating calculator
│   │   └── pdfReportService.js    # PDF generation layout builder
│   ├── utils/
│   │   ├── localizer.js      # Multilingual translations dictionary
│   │   └── asyncHandler.js   # Express wrapper to eliminate try-catch
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── profileValidator.js
│   │   ├── loanValidator.js
│   │   ├── expenseValidator.js
│   │   └── bonusValidator.js
│   └── app.js                # Express app config
├── server.js                 # Server entry point
├── package.json              # Script directives & dependencies
├── .env.example              # Env template
├── README.md                 # Project manual
└── seed.js                   # Mock database seeder script
```

---

## Quick Start Instructions

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **MongoDB** installed and running on your local machine.

### 2. Configure Environment variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Update parameters such as `PORT`, `MONGO_URI`, `JWT_SECRET`, and optional API keys for OpenAI/Gemini if you wish to run cloud-based AI advisory.

### 3. Install Dependencies
Run the package installer:
```bash
npm install
```

### 4. Seed Database with Realistic Scenarios
We have provided a database seeder script creating four different test scenarios representing:
- **Ram Charan**: Telugu preferred, moderate vehicle loan, excellent emergency fund, healthy posture.
- **Amit Sharma**: Hindi preferred, credit card debt + education loan, moderate risk posture.
- **Karthik Raja**: Tamil preferred, multiple personal loans, cash-flow deficit (High Risk).
- **John Doe**: English preferred, single home loan, healthy posture.

To seed the database, run:
```bash
npm run seed
```

### 5. Launch the Development Server
Launch the server via Nodemon:
```bash
npm run dev
```
The server will boot by default on `http://localhost:5000`.

---

## API Catalog

### 1. Authentication
* **POST `/api/auth/register`**
  - Public registration.
  - Body: `name`, `email`, `password`, `preferredLanguage` (`en`, `te`, `hi`, `ta`).
* **POST `/api/auth/login`**
  - Public login. Returns JWT bearer token.
  - Body: `email`, `password`.
* **GET `/api/auth/profile`**
  - Protected. Retrieves user account configuration.

### 2. Financial Profile
* **POST `/api/profile`**
  - Protected. Initializes user's monthly income/expense metrics.
  - Body: `monthlyIncome`, `monthlyExpenses`, `savings`, `dependents`, `emergencyFund`.
* **GET `/api/profile`**
  - Protected. Returns current user profile metrics.
* **PUT `/api/profile`**
  - Protected. Updates profile values.

### 3. Loan Management (CRUD)
* **POST `/api/loans`**
  - Protected. Adds a new loan account.
  - Body: `loanName`, `loanType` (e.g. `Credit Card Debt`, `Home Loan`), `principalAmount`, `remainingAmount`, `interestRate` (annual percentage), `emi`, `startDate` (ISO Date), `dueDate` (optional).
* **GET `/api/loans`**
  - Protected. Returns all user loan accounts.
* **GET `/api/loans/:id`**
  - Protected. Retrieves details of a specific loan.
* **PUT `/api/loans/:id`**
  - Protected. Updates details of an active loan.
* **DELETE `/api/loans/:id`**
  - Protected. Removes a loan.

### 4. Expense Tracker
* **POST `/api/expenses`**
  - Protected. Registers a new transaction.
  - Body: `amount`, `category` (e.g. `Food`, `Rent`, `Utilities`), `description`, `date`.
* **GET `/api/expenses`**
  - Protected. Returns user's transaction ledger.
* **PUT `/api/expenses/:id`**
  - Protected. Modifies expense particulars.
* **DELETE `/api/expenses/:id`**
  - Protected. Removes an expense item.

### 5. Analytics & Optimization
* **GET `/api/dashboard`**
  - Protected. Returns summary details including DTI, Surplus, total outstanding debt, and total EMIs.
* **GET `/api/debt-plan`**
  - Protected. Runs the Snowball and Avalanche engines, simulating month-by-month payment schedules and recommending the optimal path.
* **GET `/api/financial-health`**
  - Protected. Computes the 0-100 Risk Score assessing DTI, Loan count, emergency cache size, and monthly surplus ratio. Outputting ratings as **Healthy**, **Moderate Risk**, or **High Risk**.

### 6. AI Guidance
* **POST `/api/ai/advice`**
  - Protected. Analyzes financial numbers and returns a structured AI consultation (Summary, Action items, Warnings, and Savings tips) in the user's preferred language.

### 7. Bonus Tools
* **POST `/api/bonus/payoff-simulator`**
  - Protected. Simulates the impact of adding a recurring monthly or one-time lump-sum payment to pay down active debts.
  - Body: `extraPayment` (Amount), `paymentType` (`monthly` | `one-time`).
* **GET `/api/bonus/emergency-fund-planner`**
  - Protected. Calculates targets for 3-month and 6-month safety nets and shows progress.
* **POST `/api/bonus/savings-goals`**
  - Protected. Adds a target savings goal (e.g., gold purchase, child education).
  - Body: `title`, `targetAmount`, `currentAmount`, `targetDate`.
* **GET `/api/bonus/savings-goals`**
  - Protected. Retrieves all savings goals and progress.
* **GET `/api/bonus/report/pdf`**
  - Protected. Generates and streams a custom, publication-quality A4 PDF financial report directly to the browser download folder.

---

## Multilingual Support
This backend supports **English, Telugu, Hindi, and Tamil**.
When a user updates their `preferredLanguage` (registered on `User.preferredLanguage`), the API automatically translates:
1. Operational API messages (success flags, deletions, profile updates).
2. Input validation error logs.
3. Centralized validation error messages.
4. AI Advisory suggestions and PDF documentation contents (handled via localized prompts and provider templates).

---

## Security Implementation
1. **Helmet & CORS**: Active standard security headers and origin controls.
2. **Password Cryptography**: Bcrypt salt rounds at 10 to ensure collision safety.
3. **JWT Guard**: Bearer token checks validation and exposes user language context.
4. **Rate Limit Buckets**:
   - `/api/*`: General routes capped at 100 requests per 15 minutes.
   - `/api/auth/*`: Registration/Login endpoints capped at 15 requests per 15 minutes.
   - `/api/ai/*`: Capped at 20 requests per 15 minutes to control provider compute budgets.
