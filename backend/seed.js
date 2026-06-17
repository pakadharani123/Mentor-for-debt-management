const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./src/config/config');
const User = require('./src/models/User');
const FinancialProfile = require('./src/models/FinancialProfile');
const Loan = require('./src/models/Loan');
const Expense = require('./src/models/Expense');
const SavingsGoal = require('./src/models/SavingsGoal');
const PaymentHistory = require('./src/models/PaymentHistory');

const seedData = async () => {
  try {
    // Connect to Database
    await mongoose.connect(config.mongoUri);
    console.log('Database connected for seeding...');

    // Clear existing data
    await User.deleteMany();
    await FinancialProfile.deleteMany();
    await Loan.deleteMany();
    await Expense.deleteMany();
    await SavingsGoal.deleteMany();
    await PaymentHistory.deleteMany();
    console.log('Cleared existing collections.');

    // 2. Create Users (with roles)
    const users = await User.create([
      {
        name: 'Ram Charan',
        email: 'ram@example.com',
        password: 'password123',
        preferredLanguage: 'te', // Telugu preferred
        role: 'user'
      },
      {
        name: 'Amit Sharma',
        email: 'amit@example.com',
        password: 'password123',
        preferredLanguage: 'hi', // Hindi preferred
        role: 'user'
      },
      {
        name: 'Karthik Raja',
        email: 'karthik@example.com',
        password: 'password123',
        preferredLanguage: 'ta', // Tamil preferred
        role: 'user'
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        preferredLanguage: 'en', // English preferred
        role: 'user'
      },
      {
        name: 'System Admin',
        email: 'admin@example.com',
        password: 'password123',
        preferredLanguage: 'en',
        role: 'admin' // Admin role
      }
    ]);
    console.log('Seeded Users (including Admin).');

    // Retrieve User IDs
    const [ramId, amitId, karthikId, johnId, adminId] = users.map(u => u._id);

    // 3. Create Financial Profiles
    await FinancialProfile.create([
      {
        userId: ramId,
        monthlyIncome: 85000,
        monthlyExpenses: 25000,
        savings: 50000,
        dependents: 3,
        emergencyFund: 180000 // Covers ~7 months (Excellent)
      },
      {
        userId: amitId,
        monthlyIncome: 60000,
        monthlyExpenses: 30000,
        savings: 15000,
        dependents: 2,
        emergencyFund: 45000 // Covers 1.5 months (Low)
      },
      {
        userId: karthikId,
        monthlyIncome: 45000,
        monthlyExpenses: 25000,
        savings: 5000,
        dependents: 4,
        emergencyFund: 5000 // Critical lack of savings
      },
      {
        userId: johnId,
        monthlyIncome: 120000,
        monthlyExpenses: 45000,
        savings: 150000,
        dependents: 1,
        emergencyFund: 300000 // Covers ~6 months (Healthy)
      }
    ]);
    console.log('Seeded Financial Profiles.');

    // 4. Create Loans
    // Ram: Moderate/Healthy (1 Loan, low DTI)
    const ramLoans = await Loan.create([
      {
        userId: ramId,
        loanName: 'Vehicle Loan',
        loanType: 'Vehicle Loan',
        principalAmount: 400000,
        remainingAmount: 180000,
        interestRate: 8.5,
        emi: 12000,
        startDate: new Date('2024-01-15'),
        status: 'Active'
      }
    ]);

    // Amit: Moderate Risk (2 Loans, moderate DTI)
    const amitLoans = await Loan.create([
      {
        userId: amitId,
        loanName: 'Education Loan',
        loanType: 'Education Loan',
        principalAmount: 300000,
        remainingAmount: 220000,
        interestRate: 9.2,
        emi: 8000,
        startDate: new Date('2023-06-10'),
        status: 'Active'
      },
      {
        userId: amitId,
        loanName: 'Credit Card Outstanding',
        loanType: 'Credit Card Debt',
        principalAmount: 80000,
        remainingAmount: 45000,
        interestRate: 36.0, // High interest
        emi: 5000,
        startDate: new Date('2025-02-01'),
        status: 'Active'
      }
    ]);

    // Karthik: High Risk (3 Loans, very high DTI, deficit surplus)
    const karthikLoans = await Loan.create([
      {
        userId: karthikId,
        loanName: 'Personal Loan',
        loanType: 'Personal Loan',
        principalAmount: 200000,
        remainingAmount: 160000,
        interestRate: 14.5,
        emi: 9500,
        startDate: new Date('2024-08-20'),
        status: 'Active'
      },
      {
        userId: karthikId,
        loanName: 'Hand Loan',
        loanType: 'Other',
        principalAmount: 100000,
        remainingAmount: 70000,
        interestRate: 12.0,
        emi: 6000,
        startDate: new Date('2024-11-05'),
        status: 'Active'
      },
      {
        userId: karthikId,
        loanName: 'Home Electronics EMI',
        loanType: 'Personal Loan',
        principalAmount: 50000,
        remainingAmount: 35000,
        interestRate: 18.0,
        emi: 4500,
        startDate: new Date('2025-01-10'),
        status: 'Active'
      }
    ]);

    // John: Healthy (1 Home Loan, easily managed by high income)
    const johnLoans = await Loan.create([
      {
        userId: johnId,
        loanName: 'Home Loan',
        loanType: 'Home Loan',
        principalAmount: 3500000,
        remainingAmount: 2800000,
        interestRate: 8.25,
        emi: 28000,
        startDate: new Date('2022-04-12'),
        status: 'Active'
      }
    ]);
    console.log('Seeded Loans.');

    // 5. Seed Payment Histories (to calculate compliance rates)
    // Ram Charan: 100% compliance (5 payments)
    const ramLoanId = ramLoans[0]._id;
    await PaymentHistory.create([
      { userId: ramId, loanId: ramLoanId, amountPaid: 12000, paymentDate: new Date('2025-01-15'), status: 'Paid' },
      { userId: ramId, loanId: ramLoanId, amountPaid: 12000, paymentDate: new Date('2025-02-15'), status: 'Paid' },
      { userId: ramId, loanId: ramLoanId, amountPaid: 12000, paymentDate: new Date('2025-03-15'), status: 'Paid' },
      { userId: ramId, loanId: ramLoanId, amountPaid: 12000, paymentDate: new Date('2025-04-15'), status: 'Paid' },
      { userId: ramId, loanId: ramLoanId, amountPaid: 12000, paymentDate: new Date('2025-05-15'), status: 'Paid' }
    ]);

    // Amit Sharma: 80% compliance (4 Paid, 1 Late)
    const amitEdLoanId = amitLoans[0]._id;
    const amitCcLoanId = amitLoans[1]._id;
    await PaymentHistory.create([
      { userId: amitId, loanId: amitEdLoanId, amountPaid: 8000, paymentDate: new Date('2024-12-10'), status: 'Paid' },
      { userId: amitId, loanId: amitEdLoanId, amountPaid: 8000, paymentDate: new Date('2025-01-10'), status: 'Paid' },
      { userId: amitId, loanId: amitEdLoanId, amountPaid: 8000, paymentDate: new Date('2025-02-10'), status: 'Late' },
      { userId: amitId, loanId: amitEdLoanId, amountPaid: 8000, paymentDate: new Date('2025-03-10'), status: 'Paid' },
      { userId: amitId, loanId: amitCcLoanId, amountPaid: 5000, paymentDate: new Date('2025-03-01'), status: 'Paid' }
    ]);

    // Karthik Raja: 42% compliance (3 Paid, 4 Missed)
    const karthikPersonalId = karthikLoans[0]._id;
    const karthikHandId = karthikLoans[1]._id;
    const karthikElectronicsId = karthikLoans[2]._id;
    await PaymentHistory.create([
      { userId: karthikId, loanId: karthikPersonalId, amountPaid: 9500, paymentDate: new Date('2024-12-20'), status: 'Paid' },
      { userId: karthikId, loanId: karthikPersonalId, amountPaid: 9500, paymentDate: new Date('2025-01-20'), status: 'Paid' },
      { userId: karthikId, loanId: karthikPersonalId, amountPaid: 0, paymentDate: new Date('2025-02-20'), status: 'Missed' },
      { userId: karthikId, loanId: karthikHandId, amountPaid: 6000, paymentDate: new Date('2024-12-05'), status: 'Paid' },
      { userId: karthikId, loanId: karthikHandId, amountPaid: 0, paymentDate: new Date('2025-01-05'), status: 'Missed' },
      { userId: karthikId, loanId: karthikHandId, amountPaid: 0, paymentDate: new Date('2025-02-05'), status: 'Missed' },
      { userId: karthikId, loanId: karthikElectronicsId, amountPaid: 0, paymentDate: new Date('2025-02-10'), status: 'Missed' }
    ]);

    // John Doe: 100% compliance
    const johnLoanId = johnLoans[0]._id;
    await PaymentHistory.create([
      { userId: johnId, loanId: johnLoanId, amountPaid: 28000, paymentDate: new Date('2025-01-12'), status: 'Paid' },
      { userId: johnId, loanId: johnLoanId, amountPaid: 28000, paymentDate: new Date('2025-02-12'), status: 'Paid' },
      { userId: johnId, loanId: johnLoanId, amountPaid: 28000, paymentDate: new Date('2025-03-12'), status: 'Paid' }
    ]);
    console.log('Seeded Payment History logs.');

    // 6. Seed Expenses
    const categories = ['Food', 'Rent', 'Education', 'Healthcare', 'Transport', 'Entertainment', 'Shopping', 'Utilities'];
    const seedExpenses = [];
    const usersList = [ramId, amitId, karthikId, johnId];

    usersList.forEach(uId => {
      for (let i = 0; i < 5; i++) {
        const randCategory = categories[Math.floor(Math.random() * categories.length)];
        const randAmount = Math.floor(Math.random() * 3000) + 500;
        
        seedExpenses.push({
          userId: uId,
          amount: randAmount,
          category: randCategory,
          description: `Seeded ${randCategory} expense`,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        });
      }
    });

    await Expense.create(seedExpenses);
    console.log('Seeded Expenses.');

    // 7. Seed Savings Goals
    await SavingsGoal.create([
      {
        userId: ramId,
        title: 'Daughter Higher Education',
        targetAmount: 500000,
        currentAmount: 150000,
        targetDate: new Date('2030-05-01')
      },
      {
        userId: amitId,
        title: 'Emergency Starter Cache',
        targetAmount: 100000,
        currentAmount: 45000,
        targetDate: new Date('2026-12-31')
      },
      {
        userId: johnId,
        title: 'Retirement Security Fund',
        targetAmount: 2000000,
        currentAmount: 400000,
        targetDate: new Date('2040-01-01')
      }
    ]);
    console.log('Seeded Savings Goals.');

    console.log('Seeding process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedData();
