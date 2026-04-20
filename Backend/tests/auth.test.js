// const request = require("supertest");
// const app = require("../app");

// describe("Auth API Tests (CareConnect)", () => {

//   const testEmail = `test${Date.now()}${Math.random()}@gmail.com`;

//   // ✅ Signup - success or duplicate
//   test("POST /api/signup → create user or detect duplicate", async () => {
//     const res = await request(app)
//       .post("/api/signup")
//       .send({
//         name: "Test User",
//         email: testEmail,
//         password: "123456"
//       });

//     expect([201, 409]).toContain(res.statusCode);
//   });

//   // ❌ Missing fields
//   test("POST /api/signup → fail if required fields missing", async () => {
//     const res = await request(app)
//       .post("/api/signup")
//       .send({
//         email: "only@email.com"
//       });

//     expect(res.statusCode).toBeGreaterThanOrEqual(400);
//   });

//   // ❌ Password too short
//   test("POST /api/signup → fail if password < 6 characters", async () => {
//     const res = await request(app)
//       .post("/api/signup")
//       .send({
//         name: "Test",
//         email: `short${Date.now()}@gmail.com`,
//         password: "123"
//       });

//     expect(res.statusCode).toBeGreaterThanOrEqual(400);
//   });

//   // ❌ Invalid email format
//   test("POST /api/signup → fail for invalid email format", async () => {
//     const res = await request(app)
//       .post("/api/signup")
//       .send({
//         name: "Test",
//         email: "invalid-email",
//         password: "123456"
//       });

//     expect(res.statusCode).toBeGreaterThanOrEqual(400);
//   });

//   // ✅ Login (OTP flow)
//   test("POST /api/login → should trigger OTP", async () => {
//     const res = await request(app)
//       .post("/api/login")
//       .send({
//         email: testEmail,
//         password: "123456"
//       });

//     expect([200, 400]).toContain(res.statusCode);
//   });

//   // ❌ Wrong password
//   test("POST /api/login → fail with wrong password", async () => {
//     const res = await request(app)
//       .post("/api/login")
//       .send({
//         email: testEmail,
//         password: "wrongpass"
//       });

//     expect(res.statusCode).toBeGreaterThanOrEqual(400);
//   });

//   // ❌ Non-existing user
//   test("POST /api/login → fail for non-existing user", async () => {
//     const res = await request(app)
//       .post("/api/login")
//       .send({
//         email: "nouser123@gmail.com",
//         password: "123456"
//       });

//     expect(res.statusCode).toBeGreaterThanOrEqual(400);
//   });

// });
const request = require("supertest");
const mongoose = require("mongoose");
const { app } = require("../app");
const { User } = require("../models/user.model");

describe("Auth API Tests (CareConnect)", () => {
  let testEmail;

  beforeEach(async () => {
    testEmail = `test_${Date.now()}_${Math.floor(Math.random() * 10000)}@gmail.com`;
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  const signupUser = (email) =>
    request(app).post("/api/signup").send({
      fullname: "Test User",
      mail: email,
      phone: "9999999999",
      checkbox: false,
    });

  // =========================
  // ✅ SIGNUP TESTS
  // =========================

  test("POST /api/signup → should create user successfully", async () => {
    const res = await signupUser(testEmail);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("message", "User registered successfully");
  });

  test("POST /api/signup → should fail for duplicate user", async () => {
    await signupUser(testEmail);
    const res = await signupUser(testEmail);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/signup → fail if password is too short", async () => {
    const res = await request(app).post("/api/signup").send({
      fullname: "Test",
      mail: testEmail,
      password: "123",
      phone: "9999999999",
    });
    expect(res.statusCode).toBe(400);
  });

  test("POST /api/signup → fail for invalid email format", async () => {
    const res = await request(app).post("/api/signup").send({
      fullname: "Test",
      mail: "invalid-email",
      password: "123456",
      phone: "9999999999",
    });
    expect(res.statusCode).toBe(400);
  });

  // =========================
  // ✅ LOGIN TESTS
  // =========================

  test("POST /api/login → should trigger OTP on valid login", async () => {
    await signupUser(testEmail);
    const res = await request(app).post("/api/login").send({
      userRole: "Donor",
      email: testEmail,
      password: "123456",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.twoFactorRequired).toBe(true);
    expect(res.body).toHaveProperty("message", "OTP sent to your email");
  }, 15000);

  test("POST /api/login → fail with wrong password", async () => {
    await signupUser(testEmail);
    const res = await request(app).post("/api/login").send({
      userRole: "Donor",
      email: testEmail,
      password: "wrongpass",
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/login → fail for non-existing user", async () => {
    const res = await request(app).post("/api/login").send({
      userRole: "Donor",
      email: `nouser_${Date.now()}@gmail.com`,
      password: "123456",
    });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/login → fail for invalid userRole", async () => {
    const res = await request(app).post("/api/login").send({
      userRole: "InvalidRole",
      email: testEmail,
      password: "123456",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // =========================
  // ✅ OTP VERIFICATION TESTS
  // =========================

  test("POST /api/verify-otp → fail with incorrect OTP", async () => {
    await signupUser(testEmail);
    await request(app).post("/api/login").send({
      userRole: "Donor",
      email: testEmail,
      password: "123456",
    });
    const res = await request(app).post("/api/verify-otp").send({
      userRole: "Donor",
      email: testEmail,
      otp: "000000",
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  }, 15000);

  test("POST /api/verify-otp → fail for unregistered email", async () => {
    const res = await request(app).post("/api/verify-otp").send({
      userRole: "Donor",
      email: `ghost_${Date.now()}@gmail.com`,
      otp: "123456",
    });
    expect(res.statusCode).toBe(401);
  });

});