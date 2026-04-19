const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../app");
const { Carehome, DonationMoney, CareHomeJob } = require("../models/carehome.model");
const { User } = require("../models/user.model");

const makeToken = (id, role) =>
  jwt.sign({ id, role, name: "Test", email: "test@test.com" }, process.env.JWT_SECRET, { expiresIn: "1d" });

const carehomeToken = (id) => makeToken(id, "Carehome");
const donorToken    = (id) => makeToken(id, "Donor");

const createCarehome = async (overrides = {}) => {
  const carehome = new Carehome({
    care_home_name: "Test Carehome",
    reg_number: "REG123",
    email: `care_${Date.now()}@test.com`,
    password: "hashedpass",
    contact: "9999999999",
    state: "TestState",
    city: "TestCity",
    num_residents: 10,
    avg_expense: 5000,
    wishlist: "Blankets",
    description: "A test carehome",
    account_holder: "Test Holder",
    account_number: "123456789",
    ifsc: "TEST0001234",
    terms: "yes",
    ...overrides,
  });
  await carehome.save();
  return carehome;
};

const createDonor = async () => {
  const user = new User({
    name: "Test Donor",
    email: `donor_${Date.now()}@test.com`,
    password: "hashedpass",
    mobile_number: "8888888888",
  });
  await user.save();
  return user;
};

beforeEach(async () => {
  await Carehome.deleteMany({});
  await DonationMoney.deleteMany({});
  await CareHomeJob.deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

// ============================================================
// 1️⃣  PUBLIC ROUTES
// ============================================================

describe("🏠 Public Routes", () => {

  test("GET /api/carehomes → returns empty array when no carehomes exist", async () => {
    const res = await request(app).get("/api/carehomes");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test("GET /api/carehomes → returns all registered carehomes", async () => {
    await createCarehome();
    const res = await request(app).get("/api/carehomes");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("care_home_name", "Test Carehome");
  });

  test("GET /api/carehomes/viewcare/:id → returns carehome for valid id", async () => {
    const carehome = await createCarehome();
    const res = await request(app).get(`/api/carehomes/viewcare/${carehome.carehomeId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("care_home_name", "Test Carehome");
  });

  test("GET /api/carehomes/viewcare/:id → returns 404 for non-existing id", async () => {
    const res = await request(app).get("/api/carehomes/viewcare/99999");
    expect(res.statusCode).toBe(404);
  });

  test("GET /api/jobs → returns jobs list successfully", async () => {
    const res = await request(app).get("/api/jobs");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });

  test("GET /api/impact-stories → returns stories list successfully", async () => {
    const res = await request(app).get("/api/impact-stories");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.stories)).toBe(true);
  });

});

// ============================================================
// 2️⃣  CAREHOME REGISTRATION
// ============================================================

describe("📋 Carehome Registration", () => {

  test("POST /api/registerCarehome → registers successfully", async () => {
    const res = await request(app)
      .post("/api/registerCarehome")
      .field("care_home_name", "New Carehome")
      .field("reg_number",     "REG999")
      .field("email",          `newcare_${Date.now()}@test.com`)
      .field("password",       "securepass")
      .field("contact",        "9876543210")
      .field("state",          "AP")
      .field("city",           "Nellore")
      .field("num_residents",  "20")
      .field("avg_expense",    "10000")
      .field("wishlist",       "Food")
      .field("description",    "A carehome")
      .field("account_holder", "Holder")
      .field("account_number", "987654321")
      .field("ifsc",           "CARE0001234")
      .field("terms",          "yes");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Carehome Registration successful");
  });

  test("POST /api/registerCarehome → duplicate email fails", async () => {
    const email = `dup_${Date.now()}@test.com`;
    await request(app)
      .post("/api/registerCarehome")
      .field("care_home_name", "Carehome A")
      .field("reg_number",     "REG001")
      .field("email",          email)
      .field("password",       "pass123")
      .field("contact",        "9876543210")
      .field("state",          "AP")
      .field("city",           "City")
      .field("num_residents",  "5")
      .field("avg_expense",    "3000")
      .field("account_holder", "Holder")
      .field("account_number", "111")
      .field("ifsc",           "TEST0000001")
      .field("terms",          "yes");

    const res = await request(app)
      .post("/api/registerCarehome")
      .field("care_home_name", "Carehome B")
      .field("reg_number",     "REG002")
      .field("email",          email)
      .field("password",       "pass456")
      .field("contact",        "9876543210")
      .field("state",          "AP")
      .field("city",           "City")
      .field("num_residents",  "5")
      .field("avg_expense",    "3000")
      .field("account_holder", "Holder")
      .field("account_number", "222")
      .field("ifsc",           "TEST0000002")
      .field("terms",          "yes");

    expect(res.statusCode).toBe(409);
  });

});

// ============================================================
// 3️⃣  CAREHOME DASHBOARD
// ============================================================

describe("📊 Carehome Dashboard", () => {

  test("GET /api/carehome-dashboard/:id → 401 with no token", async () => {
    const res = await request(app).get("/api/carehome-dashboard/1");
    expect(res.statusCode).toBe(401);
  });

  test("GET /api/carehome-dashboard/:id → 403 for donor role", async () => {
    const donor = await createDonor();
    const res = await request(app)
      .get("/api/carehome-dashboard/1")
      .set("Cookie", `token=${donorToken(donor.userId)}`);
    expect(res.statusCode).toBe(403);
  });

  test("GET /api/carehome-dashboard/:id → 403 when accessing another carehome's dashboard", async () => {
    const carehome = await createCarehome();
    const res = await request(app)
      .get("/api/carehome-dashboard/99999")
      .set("Cookie", `token=${carehomeToken(carehome.carehomeId)}`);
    expect(res.statusCode).toBe(403);
  });

  test("GET /api/carehome-dashboard/:id → 200 with correct owner token", async () => {
    const carehome = await createCarehome();
    const res = await request(app)
      .get(`/api/carehome-dashboard/${carehome.carehomeId}`)
      .set("Cookie", `token=${carehomeToken(carehome.carehomeId)}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("name", "Test Carehome");
  });

});

// ============================================================
// 4️⃣  CAREHOME PROFILE (view + edit)
// ============================================================

describe("👤 Carehome Profile", () => {

  test("GET /api/carehome/profile/:id → 200 returns correct profile fields", async () => {
    const carehome = await createCarehome();
    const res = await request(app)
      .get(`/api/carehome/profile/${carehome.carehomeId}`)
      .set("Cookie", `token=${carehomeToken(carehome.carehomeId)}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("care_home_name");
    expect(res.body).toHaveProperty("contact");
    expect(res.body).toHaveProperty("email");
  });

  test("PUT /api/carehome/:id → 403 when editing another carehome's profile", async () => {
    const carehome = await createCarehome();
    const res = await request(app)
      .put("/api/carehome/99999")
      .set("Cookie", `token=${carehomeToken(carehome.carehomeId)}`)
      .send({ fullname: "Hacker" });
    expect(res.statusCode).toBe(403);
  });

  test("PUT /api/carehome/:id → 200 updates profile successfully", async () => {
    const carehome = await createCarehome();
    const res = await request(app)
      .put(`/api/carehome/${carehome.carehomeId}`)
      .set("Cookie", `token=${carehomeToken(carehome.carehomeId)}`)
      .send({
        fullname: "Updated Carehome",
        phne:     "1234567890",
        state:    "NewState",
        city:     "NewCity",
        mail:     "updated@test.com",
        gvtid:    "NEWREG",
        bank:     "New Holder",
        accnum:   "111222333",
        ifsc:     "UPDT0001234",
        wishlist: "Medicines",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.carehome.care_home_name).toBe("Updated Carehome");
  });

});

// ============================================================
// 5️⃣  DONATE MONEY
// ============================================================

describe("💰 Donate Money", () => {

  test("POST /api/carehome/:id/donate-money → 403 for carehome role", async () => {
    const carehome = await createCarehome();
    const res = await request(app)
      .post(`/api/carehome/${carehome.carehomeId}/donate-money`)
      .set("Cookie", `token=${carehomeToken(carehome.carehomeId)}`)
      .send({ total: 500 });
    expect(res.statusCode).toBe(403);
  });

  test("POST /api/carehome/:id/donate-money → 400 for negative amount", async () => {
    const donor    = await createDonor();
    const carehome = await createCarehome();
    const res = await request(app)
      .post(`/api/carehome/${carehome.carehomeId}/donate-money`)
      .set("Cookie", `token=${donorToken(donor.userId)}`)
      .send({ total: -100 });
    expect(res.statusCode).toBe(400);
  });

  test("POST /api/carehome/:id/donate-money → 200 on valid donation", async () => {
    const donor    = await createDonor();
    const carehome = await createCarehome();
    const res = await request(app)
      .post(`/api/carehome/${carehome.carehomeId}/donate-money`)
      .set("Cookie", `token=${donorToken(donor.userId)}`)
      .send({ total: 500 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

});

// ============================================================
// 6️⃣  JOB POSTING & LISTING
// ============================================================

describe("💼 Job Posting & Listing", () => {

  test("POST /carehome-dashboard/post-job → 403 for donor role", async () => {
    const donor = await createDonor();
    const res = await request(app)
      .post("/carehome-dashboard/post-job")
      .set("Cookie", `token=${donorToken(donor.userId)}`)
      .send({ title: "Caretaker", description: "Help needed", pay: 5000 });
    expect(res.statusCode).toBe(403);
  });

  test("POST /carehome-dashboard/post-job → 201 on successful job post", async () => {
    const carehome = await createCarehome();
    const res = await request(app)
      .post("/carehome-dashboard/post-job")
      .set("Cookie", `token=${carehomeToken(carehome.carehomeId)}`)
      .send({
        title:       "Caretaker",
        description: "Looking for a caretaker",
        pay:         8000,
        location:    "Nellore",
        type:        "Full-time",
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("message", "Job listing published successfully!");
  });

  test("GET /api/carehome/my-jobs → 200 returns jobs array for carehome", async () => {
    const carehome = await createCarehome();
    const res = await request(app)
      .get("/api/carehome/my-jobs")
      .set("Cookie", `token=${carehomeToken(carehome.carehomeId)}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });

});