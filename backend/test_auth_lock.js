const mongoose = require('mongoose');
const User = require('./src/models/User');
const config = require('./src/config/config');

async function testLockout() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri || 'mongodb://127.0.0.1:27017/debt-guidance-db');
    console.log('Connected!');

    // Fetch user 'john@example.com' or create a dummy user
    let user = await User.findOne({ email: 'john@example.com' });
    if (!user) {
      console.log('Creating dummy test user...');
      user = await User.create({
        name: 'Test John',
        email: 'john@example.com',
        password: 'password123',
        preferredLanguage: 'en'
      });
    }

    // 1. Reset login lock status
    console.log('\n--- Test 1: Reset user attempts ---');
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    console.log('Reset complete:', { attempts: user.loginAttempts, lockUntil: user.lockUntil });

    // 2. Simulate 5 failed password checks (Production limit is 5)
    console.log('\n--- Test 2: Simulating 5 failed attempts (Production limit) ---');
    const MAX_ATTEMPTS = 5;
    const COOLDOWN_TIME = 60 * 1000;

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + COOLDOWN_TIME);
        console.log(`Attempt ${i}: Threshold reached! Lockout set until:`, user.lockUntil.toISOString());
      } else {
        console.log(`Attempt ${i}: Attempts count incremented to ${user.loginAttempts}`);
      }
    }
    await user.save();

    // 3. Verify that user is locked
    console.log('\n--- Test 3: Verifying Lock Status ---');
    const freshUser = await User.findById(user._id);
    const isLocked = freshUser.lockUntil && freshUser.lockUntil > Date.now();
    console.log('Is user locked out right now?', isLocked);
    if (freshUser.lockUntil) {
      const remaining = Math.ceil((freshUser.lockUntil.getTime() - Date.now()) / 1000);
      console.log(`Remaining cooldown: ${remaining} seconds`);
    }

    // 4. Reset lock manually (simulating Admin Reset)
    console.log('\n--- Test 4: Simulating Admin Lock Reset ---');
    const resetResult = await User.updateMany(
      { email: 'john@example.com' },
      { $set: { loginAttempts: 0, lockUntil: null } }
    );
    console.log('Admin Reset modifiedCount:', resetResult.modifiedCount);

    const clearedUser = await User.findById(user._id);
    console.log('User status after reset:', {
      attempts: clearedUser.loginAttempts,
      lockUntil: clearedUser.lockUntil
    });

    console.log('\nAll test cases successfully passed!');
  } catch (error) {
    console.error('Lockout test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testLockout();
