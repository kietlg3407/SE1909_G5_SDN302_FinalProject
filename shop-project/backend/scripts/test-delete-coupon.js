const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../src/models/userModel');
const Coupon = require('../src/models/couponModel');

const BASE_URL = 'http://localhost:5000/api/coupons';

async function runTests() {
  console.log('--- STARTING DELETE COUPON API TEST ---');

  // Connect to DB
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Find admin user
  const adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    throw new Error('Admin user not found');
  }

  // Create admin JWT
  const adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  // Find or create non-admin user
  let customerUser = await User.findOne({ role: 'customer' });
  if (!customerUser) {
    customerUser = await User.create({
      name: 'Regular Customer',
      email: 'customer_test@example.com',
      password: 'password123',
      role: 'customer',
    });
  }
  const customerToken = jwt.sign({ id: customerUser._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  // Test 1: DELETE without token
  console.log('\n[Test 1] DELETE /api/coupons/:id without token');
  const res1 = await fetch(`${BASE_URL}/507f1f77bcf86cd799439011`, {
    method: 'DELETE',
  });
  const data1 = await res1.json();
  console.log(`Status: ${res1.status} (Expected: 401)`);
  console.log('Response:', data1);
  if (res1.status !== 401) throw new Error('Test 1 Failed: Expected 401');

  // Test 2: DELETE with non-admin token
  console.log('\n[Test 2] DELETE /api/coupons/:id with non-admin token');
  const res2 = await fetch(`${BASE_URL}/507f1f77bcf86cd799439011`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const data2 = await res2.json();
  console.log(`Status: ${res2.status} (Expected: 403)`);
  console.log('Response:', data2);
  if (res2.status !== 403) throw new Error('Test 2 Failed: Expected 403');

  // Test 3: DELETE with invalid ID format (CastError test)
  console.log('\n[Test 3] DELETE /api/coupons/invalid-id-xyz (CastError check)');
  const res3 = await fetch(`${BASE_URL}/invalid-id-xyz`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data3 = await res3.json();
  console.log(`Status: ${res3.status} (Expected: 400)`);
  console.log('Response:', data3);
  if (res3.status !== 400 || data3.message !== 'Invalid coupon ID' || data3.field !== 'id') {
    throw new Error('Test 3 Failed: CastError not handled properly as 400 Bad Request');
  }

  // Test 4: DELETE with non-existent valid ObjectId
  console.log('\n[Test 4] DELETE with non-existent ObjectId 507f1f77bcf86cd799439011');
  const res4 = await fetch(`${BASE_URL}/507f1f77bcf86cd799439011`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data4 = await res4.json();
  console.log(`Status: ${res4.status} (Expected: 404)`);
  console.log('Response:', data4);
  if (res4.status !== 404 || data4.message !== 'Coupon not found') {
    throw new Error('Test 4 Failed: Expected 404 Coupon not found');
  }

  // Test 5: Create a new test coupon, then DELETE it
  console.log('\n[Test 5] Create coupon and DELETE it successfully');
  const testCode = 'TEST_DEL_' + Date.now();
  const newCoupon = await Coupon.create({
    code: testCode,
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 50000,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    usageLimit: 50,
  });
  console.log(`Created test coupon with ID: ${newCoupon._id}, Code: ${newCoupon.code}`);

  const res5 = await fetch(`${BASE_URL}/${newCoupon._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data5 = await res5.json();
  console.log(`Status: ${res5.status} (Expected: 200)`);
  console.log('Response:', JSON.stringify(data5, null, 2));

  if (res5.status !== 200) {
    throw new Error('Test 5 Failed: Expected 200 OK');
  }
  if (data5.message !== 'Coupon deleted successfully' || !data5.data || !data5.data.coupon) {
    throw new Error('Test 5 Failed: Invalid response structure');
  }
  if (data5.data.coupon.code !== testCode) {
    throw new Error('Test 5 Failed: Deleted coupon code mismatch');
  }

  // Test 6: Verify coupon is really deleted from DB
  console.log('\n[Test 6] Verify coupon is removed from DB');
  const checkCoupon = await Coupon.findById(newCoupon._id);
  console.log('DB query result for deleted ID:', checkCoupon);
  if (checkCoupon !== null) {
    throw new Error('Test 6 Failed: Coupon still exists in database');
  }

  // Test 7: Attempting to delete the same coupon again should return 404
  console.log('\n[Test 7] DELETE the same coupon again (should return 404)');
  const res7 = await fetch(`${BASE_URL}/${newCoupon._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data7 = await res7.json();
  console.log(`Status: ${res7.status} (Expected: 404)`);
  console.log('Response:', data7);
  if (res7.status !== 404) {
    throw new Error('Test 7 Failed: Expected 404 on second deletion');
  }

  console.log('\n=============================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! 100% VERIFIED!');
  console.log('=============================================\n');

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Test Execution Error:', err);
  process.exit(1);
});
