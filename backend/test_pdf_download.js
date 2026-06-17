const mongoose = require('mongoose');
const User = require('./src/models/User');
const FinancialProfile = require('./src/models/FinancialProfile');
const Loan = require('./src/models/Loan');
const Expense = require('./src/models/Expense');
const reportController = require('./src/controllers/reportController');
const jwt = require('jsonwebtoken');
const config = require('./src/config/config');

async function runDiagnostic() {
  try {
    // 1. Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/gittugu');
    console.log('Connected!');

    // 2. Fetch User 'dharani' or any user
    let user = await User.findOne({ name: /dharani/i });
    if (!user) {
      user = await User.findOne();
    }
    if (!user) {
      console.error('No users found in database! Please seed or register.');
      process.exit(1);
    }
    console.log(`Using User: ${user.name} (${user._id})`);

    // Ensure they have a profile
    const profile = await FinancialProfile.findOne({ userId: user._id });
    if (!profile) {
      console.log('No profile found. Creating a mock profile for diagnostic...');
      await FinancialProfile.create({
        userId: user._id,
        monthlyIncome: 60000,
        monthlyExpenses: 20000,
        savings: 10000,
        emergencyFund: 15000,
        riskPreference: 'Medium',
        employmentType: 'Salaried',
        salaryDate: 1
      });
    }

    // 3. Mock request and response
    const token = jwt.sign({ id: user._id }, config.jwtSecret);
    const req = {
      user: user,
      query: { token }
    };

    let responseHeaders = {};
    let responseData = [];

    const res = {
      setHeader: (name, val) => {
        responseHeaders[name] = val;
        console.log(`[Header] ${name}: ${val}`);
      },
      status: (code) => {
        console.log(`[Status] ${code}`);
        return res;
      },
      json: (obj) => {
        console.log('[JSON Response]:', JSON.stringify(obj, null, 2));
        console.log(`Length: ${JSON.stringify(obj).length} bytes`);
      },
      write: (chunk) => {
        responseData.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      },
      on: (evt, cb) => { return res; },
      once: (evt, cb) => { return res; },
      emit: (evt, val) => { return res; },
      removeListener: (evt, cb) => { return res; },
      end: (chunk) => {
        if (chunk) {
          responseData.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const fullBuffer = Buffer.concat(responseData);
        console.log(`[End Response] Succeeded! Wrote ${fullBuffer.length} bytes.`);
        if (fullBuffer.length < 500) {
          console.log('[Data Content]:', fullBuffer.toString('utf8'));
        }
        mongoose.connection.close();
      }
    };

    // 4. Run Controller
    console.log('Running downloadPDFReport controller...');
    await reportController.downloadPDFReport(req, res);

  } catch (error) {
    console.error('FATAL RUNTIME ERROR:', error);
    mongoose.connection.close();
  }
}

runDiagnostic();
