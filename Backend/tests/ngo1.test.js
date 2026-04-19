const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { app } = require("../app");

const { NGO, Event } = require("../models/NGO.model");
const { CreatedFundraiser, UserRegisteredEvent } = require("../models/user.model");

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });

const ngoToken   = (id) => makeToken(id, "NGO");
const donorToken = (id) => makeToken(id, "Donor");

const createNGO = async (overrides = {}) => {
  const ngo = new NGO({
    Ngoname:              "Test NGO",
    darpan_id:            "DL/2020/0123456",
    year_established:     2010,
    email:                `ngo_${Date.now()}@test.com`,
    password:             "hashedpass",
    phone:                "9999999999",
    address:              "123 Main St",
    account_holder_name:  "Test NGO Trust",
    account_number:       "123456789012",
    ifsc:                 "SBIN0001234",
    ...overrides,
  });
  await ngo.save();
  return ngo;
};

const createEvent = async (ngoId, overrides = {}) => {
  const event = new Event({
    ngoId,
    event_name:     "Test Event",
    event_location: "Hyderabad",
    event_date:     new Date("2099-12-31"),
    event_time:     "10:00",
    description:    "A test event",
    imagePath:      "/uploads/Events/test.jpg",
    ...overrides,
  });
  await event.save();
  return event;
};

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeEach(async () => {
  await NGO.deleteMany({});
  await Event.deleteMany({});
  await CreatedFundraiser.deleteMany({});
  await UserRegisteredEvent.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

// ════════════════════════════════════════════════════════════════════════════
// 1. NGO REGISTRATION
// ════════════════════════════════════════════════════════════════════════════

describe("NGO Registration", () => {
  test("registers a new NGO and returns 201", async () => {
    const res = await request(app)
      .post("/api/ngo/register")
      .send({
        Ngoname:             "HelpNGO",
        darpan_id:           "DL/2020/0123456",
        year_established:    2010,
        email:               `reg_${Date.now()}@ngo.com`,
        password:            "secret123",
        phone:               "9999999999",
        address:             "123 Main St",
        account_holder_name: "HelpNGO Trust",
        account_number:      "123456789012",
        ifsc:                "SBIN0001234",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/successful/i);
  });

  test("rejects duplicate email", async () => {
    const email = `dup_${Date.now()}@ngo.com`;
    const payload = { Ngoname: "NGO", email, password: "pass123" };
    await request(app).post("/api/ngo/register").send(payload);
    const res = await request(app).post("/api/ngo/register").send(payload);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});


// ════════════════════════════════════════════════════════════════════════════
// 3. NGO DASHBOARD  (protected)
// ════════════════════════════════════════════════════════════════════════════

describe("GET /api/ngo-dashboard/:ngoID", () => {
  test("returns dashboard data for valid NGO", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .get(`/api/ngo-dashboard/${ngo.ngoId}`)
      .set("Cookie", `token=${ngoToken(ngo.ngoId)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("ongoing_fund");
    expect(res.body).toHaveProperty("upcoming_eve");
    expect(res.body).toHaveProperty("stats");
  });

  test("returns 403 when NGO accesses another NGO's dashboard", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .get(`/api/ngo-dashboard/${ngo.ngoId}`)
      .set("Cookie", `token=${ngoToken(9999)}`);

    expect(res.status).toBe(403);
  });

  test("returns 401 when no token is provided", async () => {
    const ngo = await createNGO();
    const res = await request(app).get(`/api/ngo-dashboard/${ngo.ngoId}`);
    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. NGO PROFILE DETAILS  (public)
// ════════════════════════════════════════════════════════════════════════════

describe("GET /api/NGOs/profile/:id", () => {
  test("returns NGO profile with fundraiser and event buckets", async () => {
    const ngo = await createNGO();
    const res = await request(app).get(`/api/NGOs/profile/${ngo.ngoId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("ngo");
    expect(res.body.data).toHaveProperty("activeFundraisers");
    expect(res.body.data).toHaveProperty("pastFundraisers");
    expect(res.body.data).toHaveProperty("upcomingEvents");
    expect(res.body.data).toHaveProperty("pastEvents");
  });

  test("returns 404 for a non-existent NGO id", async () => {
    const res = await request(app).get("/api/NGOs/profile/99999");
    expect(res.status).toBe(404);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. EDIT NGO PROFILE  (protected)
// ════════════════════════════════════════════════════════════════════════════

describe("PUT /api/NGO-dashboard/:ngoID/edit", () => {
  test("updates NGO profile and returns updated data", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .put(`/api/NGO-dashboard/${ngo.ngoId}/edit`)
      .set("Cookie", `token=${ngoToken(ngo.ngoId)}`)
      .send({ fullname: "UpdatedNGO", phone: "7777777777" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ngo.Ngoname).toBe("UpdatedNGO");
  });

  test("returns 403 when editing another NGO's profile", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .put(`/api/NGO-dashboard/${ngo.ngoId}/edit`)
      .set("Cookie", `token=${ngoToken(9999)}`)
      .send({ fullname: "Hacker" });

    expect(res.status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. CREATE EVENT  (protected)
// ════════════════════════════════════════════════════════════════════════════

describe("POST /api/ngo/:ngoID/create-event", () => {
  test("returns 400 when image is missing", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .post(`/api/ngo/${ngo.ngoId}/create-event`)
      .set("Cookie", `token=${ngoToken(ngo.ngoId)}`)
      .field("event_name",     "Tree Planting")
      .field("event_location", "Delhi")
      .field("deadline",       "2099-12-31")
      .field("event_time",     "10:00")
      .field("description",    "Plant trees");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/image/i);
  });

  test("returns 403 when a different NGO tries to create an event", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .post(`/api/ngo/${ngo.ngoId}/create-event`)
      .set("Cookie", `token=${ngoToken(9999)}`)
      .field("event_name", "Fake Event");

    expect(res.status).toBe(403);
  });

  test("returns 401 when unauthenticated", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .post(`/api/ngo/${ngo.ngoId}/create-event`)
      .field("event_name", "No Auth Event");

    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. CREATE FUNDRAISER  (protected)
// ════════════════════════════════════════════════════════════════════════════

describe("POST /api/ngo-dashboard/:ngoID/create-fundraiser", () => {
  test("returns 400 when image is missing", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .post(`/api/ngo-dashboard/${ngo.ngoId}/create-fundraiser`)
      .set("Cookie", `token=${ngoToken(ngo.ngoId)}`)
      .field("fundraiser_name", "Water Fund")
      .field("deadline",        "2099-12-31")
      .field("goal_amount",     "50000")
      .field("description",     "Clean water for all")
      .field("id_carehome",     "1");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/image/i);
  });

  test("returns 403 when a Donor tries to create a fundraiser", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .post(`/api/ngo-dashboard/${ngo.ngoId}/create-fundraiser`)
      .set("Cookie", `token=${donorToken(ngo.ngoId)}`)
      .field("fundraiser_name", "Donor Attempt");

    expect(res.status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. GET ALL FUNDRAISERS  (public)
// ════════════════════════════════════════════════════════════════════════════

describe("GET /fundraisers", () => {
  test("returns only ongoing (non-expired) fundraisers", async () => {
    const ngo = await createNGO();

    await CreatedFundraiser.insertMany([
      {
        ngoId:                ngo.ngoId,
        fundraiser_name:      "Active Fund",
        deadline:             new Date("2099-12-31"),
        goal_amount:          10000,
        amount_raised_so_far: 0,
        description:          "active",
        imagePath:            "/uploads/Fundraisers/a.jpg",
        carehomeId: 12345,
      },
      {
        ngoId:                ngo.ngoId,
        fundraiser_name:      "Expired Fund",
        deadline:             new Date("2000-01-01"),
        goal_amount:          5000,
        amount_raised_so_far: 0,
        description:          "expired",
        imagePath:            "/uploads/Fundraisers/b.jpg",
        carehomeId: 123456
      },
    ]);

    const res = await request(app).get("/fundraisers");
    expect(res.status).toBe(200);
    const names = res.body.map((f) => f.fundraiser_name);
    expect(names).toContain("Active Fund");
    expect(names).not.toContain("Expired Fund");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. GET ALL EVENTS  (public)
// ════════════════════════════════════════════════════════════════════════════

describe("GET /api/events", () => {
  test("returns only upcoming events", async () => {
    const ngo = await createNGO();

    await Event.insertMany([
      {
        ngoId:          ngo.ngoId,
        event_name:     "Future Event",
        event_location: "Mumbai",
        event_date:     new Date("2099-06-01"),
        event_time:     "10:00",
        description:    "upcoming",
        imagePath:      "/uploads/Events/f.jpg",
      },
      {
        ngoId:          ngo.ngoId,
        event_name:     "Past Event",
        event_location: "Mumbai",
        event_date:     new Date("2000-01-01"),
        event_time:     "10:00",
        description:    "past",
        imagePath:      "/uploads/Events/p.jpg",
      },
    ]);

    const res = await request(app).get("/api/events");
    expect(res.status).toBe(200);
    const names = res.body.data.map((e) => e.event_name);
    expect(names).toContain("Future Event");
    expect(names).not.toContain("Past Event");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. REGISTER USER FOR EVENT  (protected – Donor only)
// ════════════════════════════════════════════════════════════════════════════

describe("POST /registerUser/:ngoID", () => {
  test("returns 404 when event does not exist", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .post(`/registerUser/${ngo.ngoId}`)
      .set("Cookie", `token=${donorToken(42)}`)
      .send({ event: "NonExistentEvent" });

    expect(res.status).toBe(404);
  });

  test("returns 400 on duplicate registration", async () => {
    const ngo = await createNGO();
    await createEvent(ngo.ngoId, { event_name: "Charity Run" });

    await request(app)
      .post(`/registerUser/${ngo.ngoId}`)
      .set("Cookie", `token=${donorToken(42)}`)
      .send({ event: "Charity Run" });

    const res = await request(app)
      .post(`/registerUser/${ngo.ngoId}`)
      .set("Cookie", `token=${donorToken(42)}`)
      .send({ event: "Charity Run" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  test("returns 403 when NGO tries to register (not a Donor)", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .post(`/registerUser/${ngo.ngoId}`)
      .set("Cookie", `token=${ngoToken(ngo.ngoId)}`)
      .send({ event: "Charity Run" });

    expect(res.status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 11. CAMPAIGN DETAILS  (protected)
// ════════════════════════════════════════════════════════════════════════════

describe("GET /api/NGO-dashboard/:ngoID/details/:type/:id", () => {
  test("returns 400 for undefined id parameter", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .get(`/api/NGO-dashboard/${ngo.ngoId}/details/event/undefined`)
      .set("Cookie", `token=${ngoToken(ngo.ngoId)}`);

    expect(res.status).toBe(400);
  });

  test("returns 403 for identity mismatch", async () => {
    const ngo = await createNGO();
    const res = await request(app)
      .get(`/api/NGO-dashboard/${ngo.ngoId}/details/event/someid`)
      .set("Cookie", `token=${ngoToken(9999)}`);

    expect(res.status).toBe(403);
  });

  test("returns 404 for non-existent event", async () => {
    const ngo    = await createNGO();
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res    = await request(app)
      .get(`/api/NGO-dashboard/${ngo.ngoId}/details/event/${fakeId}`)
      .set("Cookie", `token=${ngoToken(ngo.ngoId)}`);

    expect(res.status).toBe(404);
  });

  test("returns event details with participant list", async () => {
    const ngo   = await createNGO();
    const event = await createEvent(ngo.ngoId, { event_name: "Campaign Event" });

    const res = await request(app)
      .get(`/api/NGO-dashboard/${ngo.ngoId}/details/event/${event._id}`)
      .set("Cookie", `token=${ngoToken(ngo.ngoId)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("name", "Campaign Event");
    expect(Array.isArray(res.body.list)).toBe(true);
  });
});
