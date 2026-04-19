const express = require("express");
const request = require("supertest");

const mockSendMail = jest.fn();

jest.mock("../redis", () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  keys: jest.fn(),
  del: jest.fn(),
}));

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

jest.mock("../models/NGO.model", () => ({
  NGO: {
    collection: { collectionName: "ngos" },
    countDocuments: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  },
  Event: {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock("../models/user.model", () => ({
  CreatedFundraiser: {
    find: jest.fn(),
  },
  UserContributedFundraiser: {
    aggregate: jest.fn(),
    find: jest.fn(),
  },
  User: {
    collection: { collectionName: "donors" },
    deleteOne: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  },
  UserRegisteredEvent: {
    find: jest.fn(),
  },
}));

jest.mock("../models/carehome.model", () => ({
  Carehome: {
    collection: { collectionName: "carehomes" },
    countDocuments: jest.fn(),
    findOne: jest.fn(),
  },
  DonationMoney: {
    aggregate: jest.fn(),
    find: jest.fn(),
  },
}));

const redisClient = require("../redis");
const { NGO, Event } = require("../models/NGO.model");
const {
  CreatedFundraiser,
  UserContributedFundraiser,
  User,
  UserRegisteredEvent,
} = require("../models/user.model");
const { Carehome, DonationMoney } = require("../models/carehome.model");
const adminController = require("../controllers/admin.controller");

function createLeanChain(result) {
  return {
    lean: jest.fn().mockResolvedValue(result),
  };
}

function createSortLeanChain(result) {
  const lean = jest.fn().mockResolvedValue(result);
  const sort = jest.fn().mockReturnValue({ lean });

  return { sort, lean };
}

function createSortLimitLeanChain(result) {
  const lean = jest.fn().mockResolvedValue(result);
  const limit = jest.fn().mockReturnValue({ lean });
  const sort = jest.fn().mockReturnValue({ limit });

  return { sort, limit, lean };
}

function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/api/admin/dashboard", adminController.Getadmin);
  app.delete("/api/admin/delete-donor", adminController.deleteDonorWithEmail);
  app.get("/api/admin/events-analytics", adminController.getAdminEventAnalytics);
  app.get(
    "/api/admin/donations-analytics",
    adminController.getAdminDonationAnalytics
  );
  app.get(
    "/api/admin/fundraiser-donors/:fundraiserObjectId",
    adminController.getFundraiserDonors
  );
  app.get(
    "/api/admin/carehome-donors/:carehomeId",
    adminController.getCarehomeDonors
  );
  app.get(
    "/api/admin/event-registrations/:eventObjectId",
    adminController.getEventRegistrations
  );
  app.get("/api/admin/all-donors", adminController.getAllDonors);
  app.get(
    "/api/admin/donor-stats/:userId",
    adminController.getDonorManagementStats
  );
  app.get(
    "/api/admin/all-ngos-manage",
    adminController.getAllNgoManagement
  );
  app.get(
    "/api/admin/carehome-manage-stats/:carehomeId",
    adminController.getCarehomeManagementStats
  );

  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  });

  return app;
}

describe("Admin controller tests", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe("Getadmin", () => {
    test("calculates total revenue as exactly 8% of total_money", async () => {
      const topFunds = [
        {
          _id: "fund-1",
          fundraiser_name: "Medical Aid",
          amount_raised_so_far: 7000,
          goal_amount: 10000,
        },
        {
          _id: "fund-2",
          fundraiser_name: "Food Support",
          amount_raised_so_far: 3500,
          goal_amount: 5000,
        },
      ];

      redisClient.get.mockResolvedValue(null);
      redisClient.setEx.mockResolvedValue("OK");

      DonationMoney.aggregate
        .mockResolvedValueOnce([{ max: 5000 }])
        .mockResolvedValueOnce([{ total: 4000 }])
        .mockResolvedValueOnce([
          { _id: { y: 2026, m: 1 }, t: 1000 },
          { _id: { y: 2026, m: 2 }, t: 3000 },
        ]);

      UserContributedFundraiser.aggregate
        .mockResolvedValueOnce([{ name: "Rahul", total: 6000 }])
        .mockResolvedValueOnce([{ total: 6000 }])
        .mockResolvedValueOnce([
          { _id: { y: 2026, m: 1 }, t: 2000 },
          { _id: { y: 2026, m: 2 }, t: 4000 },
        ]);

      NGO.countDocuments.mockResolvedValue(12);
      Carehome.countDocuments.mockResolvedValue(8);
      Event.countDocuments.mockResolvedValue(20);
      CreatedFundraiser.find.mockReturnValue(createSortLimitLeanChain(topFunds));

      const response = await request(app).get("/api/admin/dashboard");

      expect(response.statusCode).toBe(200);
      expect(response.body.total_money).toBe(10000);
      expect(response.body.total_revenue).toBe("800.00");
      expect(Number(response.body.total_revenue)).toBe(
        Number((response.body.total_money * 0.08).toFixed(2))
      );
      expect(response.body.top_fund).toEqual(topFunds);
      expect(redisClient.setEx).toHaveBeenCalledWith(
        "admin:main-stats",
        30,
        expect.any(String)
      );
    });

    test("returns cached dashboard response if present", async () => {
      const cachedPayload = {
        highest_Donation: 9000,
        high_con_name: { name: "Cached User", total: 15000 },
        total_revenue: "1200.00",
        total_ngo: 4,
        total_care: 2,
        total_events: 5,
        total_money: 15000,
        top_fund: [],
        monthlyBusiness: [],
      };

      redisClient.get.mockResolvedValue(JSON.stringify(cachedPayload));

      const response = await request(app).get("/api/admin/dashboard");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(cachedPayload);
      expect(DonationMoney.aggregate).not.toHaveBeenCalled();
      expect(UserContributedFundraiser.aggregate).not.toHaveBeenCalled();
    });

    test("returns zero revenue when no donations exist", async () => {
      redisClient.get.mockResolvedValue(null);
      redisClient.setEx.mockResolvedValue("OK");

      DonationMoney.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      UserContributedFundraiser.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      NGO.countDocuments.mockResolvedValue(0);
      Carehome.countDocuments.mockResolvedValue(0);
      Event.countDocuments.mockResolvedValue(0);
      CreatedFundraiser.find.mockReturnValue(createSortLimitLeanChain([]));

      const response = await request(app).get("/api/admin/dashboard");

      expect(response.statusCode).toBe(200);
      expect(response.body.highest_Donation).toBe(0);
      expect(response.body.total_money).toBe(0);
      expect(response.body.total_revenue).toBe("0.00");
      expect(response.body.high_con_name).toEqual({ name: "N/A", total: 0 });
    });
  });

  describe("deleteDonorWithEmail", () => {
    test("deletes donor data and sends email", async () => {
      User.deleteOne.mockResolvedValue({ deletedCount: 1 });
      mockSendMail.mockResolvedValue({ messageId: "mail-1" });

      const response = await request(app).delete(
        "/api/admin/delete-donor?userId=11&email=test@example.com&name=Ravi&reason=Violation"
      );

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(User.deleteOne).toHaveBeenCalledWith({ userId: 11 });
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail.mock.calls[0][0].to).toBe("test@example.com");
    });

    test("revenue is updated on the next dashboard fetch after donor deletion", async () => {
      User.deleteOne.mockResolvedValue({ deletedCount: 1 });
      mockSendMail.mockResolvedValue({ messageId: "mail-2" });

      redisClient.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      redisClient.setEx.mockResolvedValue("OK");

      DonationMoney.aggregate
        .mockResolvedValueOnce([{ max: 5000 }])
        .mockResolvedValueOnce([{ total: 4000 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ max: 5000 }])
        .mockResolvedValueOnce([{ total: 4000 }])
        .mockResolvedValueOnce([]);

      UserContributedFundraisersSequence();

      NGO.countDocuments.mockResolvedValue(1);
      Carehome.countDocuments.mockResolvedValue(1);
      Event.countDocuments.mockResolvedValue(1);
      CreatedFundraiser.find.mockReturnValue(createSortLimitLeanChain([]));

      const firstDashboard = await request(app).get("/api/admin/dashboard");
      expect(firstDashboard.body.total_money).toBe(10000);
      expect(firstDashboard.body.total_revenue).toBe("800.00");

      await request(app).delete(
        "/api/admin/delete-donor?userId=11&email=test@example.com&name=Ravi&reason=Violation"
      );

      const secondDashboard = await request(app).get("/api/admin/dashboard");

      expect(secondDashboard.statusCode).toBe(200);
      expect(secondDashboard.body.total_money).toBe(7000);
      expect(secondDashboard.body.total_revenue).toBe("560.00");
    });

    test("returns 500 when donor deletion fails", async () => {
      User.deleteOne.mockRejectedValue(new Error("delete failed"));

      const response = await request(app).delete(
        "/api/admin/delete-donor?userId=11&email=test@example.com&name=Ravi&reason=Violation"
      );

      expect(response.statusCode).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("delete failed");
    });
  });

  describe("getAdminEventAnalytics", () => {
    test("returns ongoing, upcoming, and completed event groups", async () => {
      redisClient.get.mockResolvedValue(null);
      redisClient.setEx.mockResolvedValue("OK");

      Event.aggregate
        .mockResolvedValueOnce([
          {
            ongoing: [{ event_name: "Today Event" }],
            upcoming: [{ event_name: "Next Week Event" }],
            completed: [{ event_name: "Past Event" }],
          },
        ])
        .mockResolvedValueOnce([{ name: "Helping Hands", impact: 20 }]);

      Event.findOne.mockReturnValue(
        createSortLeanChain({
          event_name: "Big Event",
          number_of_registrations: 55,
        })
      );

      const response = await request(app).get("/api/admin/events-analytics");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.groups.ongoing).toEqual([{ event_name: "Today Event" }]);
      expect(response.body.groups.completed).toEqual([{ event_name: "Past Event" }]);
      expect(response.body.analytics.influentialNgo).toEqual({
        name: "Helping Hands",
        impact: 20,
      });
      expect(response.body.analytics.influentialEvent).toEqual({
        event_name: "Big Event",
        number_of_registrations: 55,
      });
    });

    test("returns cached event analytics when redis has data", async () => {
      const cachedPayload = {
        success: true,
        analytics: {
          influentialNgo: { name: "Cached NGO", impact: 10 },
          influentialEvent: { event_name: "Cached Event", number_of_registrations: 30 },
        },
        groups: {
          ongoing: [],
          upcoming: [],
          completed: [{ event_name: "Done" }],
        },
      };

      redisClient.get.mockResolvedValue(JSON.stringify(cachedPayload));

      const response = await request(app).get("/api/admin/events-analytics");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(cachedPayload);
      expect(Event.aggregate).not.toHaveBeenCalled();
    });

    test("returns fallback analytics when no event data exists", async () => {
      redisClient.get.mockResolvedValue(null);
      redisClient.setEx.mockResolvedValue("OK");

      Event.aggregate
        .mockResolvedValueOnce([
          { ongoing: [], upcoming: [], completed: [] },
        ])
        .mockResolvedValueOnce([]);

      Event.findOne.mockReturnValue(createSortLeanChain(null));

      const response = await request(app).get("/api/admin/events-analytics");

      expect(response.statusCode).toBe(200);
      expect(response.body.analytics.influentialNgo).toEqual({
        name: "N/A",
        impact: 0,
      });
      expect(response.body.analytics.influentialEvent).toEqual({
        event_name: "N/A",
        number_of_registrations: 0,
      });
    });
  });

  describe("getCarehomeManagementStats", () => {
    test("returns correct carehome stats", async () => {
      Carehome.findOne.mockReturnValue(
        createLeanChain({
          carehomeId: 9,
          care_home_name: "Sunrise Home",
          num_residents: 32,
          avg_expense: 50000,
        })
      );

      DonationMoney.find.mockReturnValue(
        createLeanChain([
          { userId: 1, amount_donated: 2000 },
          { userId: 2, amount_donated: 3000 },
          { userId: 1, amount_donated: 1000 },
        ])
      );

      CreatedFundraiser.find.mockReturnValue(
        createLeanChain([
          { fundraiser_name: "Food Drive" },
          { fundraiser_name: "Medicine Drive" },
        ])
      );

      UserContributedFundraiser.find.mockReturnValue(
        createLeanChain([
          { userId: 3, amount_contributed: 4000 },
          { userId: 2, amount_contributed: 2500 },
        ])
      );

      const response = await request(app).get("/api/admin/carehome-manage-stats/9");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats.care_home_name).toBe("Sunrise Home");
      expect(response.body.stats.totalDirectMoney).toBe(6000);
      expect(response.body.stats.totalFundraiserMoney).toBe(6500);
      expect(response.body.stats.campaignCount).toBe(2);
      expect(response.body.stats.totalSupporters).toBe(3);
    });

    test("returns 404 when carehome is not found", async () => {
      Carehome.findOne.mockReturnValue(createLeanChain(null));
      DonationMoney.find.mockReturnValue(createLeanChain([]));
      CreatedFundraiser.find.mockReturnValue(createLeanChain([]));

      const response = await request(app).get("/api/admin/carehome-manage-stats/999");

      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: "Carehome not found",
      });
    });
  });

  describe("getAdminDonationAnalytics", () => {
    test("returns donation analytics correctly", async () => {
      redisClient.get.mockResolvedValue(null);
      redisClient.setEx.mockResolvedValue("OK");

      DonationMoney.aggregate.mockResolvedValueOnce([
        { name: "Sunrise Home", total: 5000, carehomeId: 2 },
      ]);

      DonationMoney.find.mockReturnValue(
        createLeanChain([
          { amount_donated: 1000, donated_at: new Date("2026-01-10") },
          { amount_donated: 2000, donated_at: new Date("2026-01-15") },
          { amount_donated: 3000, donated_at: new Date("2026-02-20") },
        ])
      );

      const response = await request(app).get("/api/admin/donations-analytics");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analytics.carehomeImpact).toEqual([
        { name: "Sunrise Home", total: 5000, carehomeId: 2 },
      ]);
      expect(response.body.analytics.platformTotal).toBe(6000);
      expect(response.body.analytics.monthlyStats).toEqual([
        { name: "Jan", total: 3000 },
        { name: "Feb", total: 3000 },
      ]);
    });

    test("returns cached donation analytics", async () => {
      const cachedPayload = {
        success: true,
        analytics: {
          carehomeImpact: [],
          monthlyStats: [{ name: "Jan", total: 1000 }],
          platformTotal: 1000,
        },
      };

      redisClient.get.mockResolvedValue(JSON.stringify(cachedPayload));

      const response = await request(app).get("/api/admin/donations-analytics");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(cachedPayload);
      expect(DonationMoney.aggregate).not.toHaveBeenCalled();
      expect(DonationMoney.find).not.toHaveBeenCalled();
    });
  });

  describe("list and audit helpers", () => {
    test("returns fundraiser donors", async () => {
      UserContributedFundraiser.find.mockReturnValue(
        createSortLeanChain([
          { userId: 1, amount_contributed: 4000, contributed_at: "2026-01-01" },
        ])
      );
      User.find.mockReturnValue(
        createLeanChain([{ userId: 1, name: "Anita" }])
      );

      const response = await request(app).get("/api/admin/fundraiser-donors/f1");

      expect(response.statusCode).toBe(200);
      expect(response.body.donorList).toEqual([
        { name: "Anita", amount: 4000, date: "2026-01-01" },
      ]);
    });

    test("returns anonymous fundraiser donor when user is missing", async () => {
      UserContributedFundraiser.find.mockReturnValue(
        createSortLeanChain([
          { userId: 99, amount_contributed: 2500, contributed_at: "2026-02-01" },
        ])
      );
      User.find.mockReturnValue(createLeanChain([]));

      const response = await request(app).get("/api/admin/fundraiser-donors/f2");

      expect(response.statusCode).toBe(200);
      expect(response.body.donorList).toEqual([
        { name: "Anonymous", amount: 2500, date: "2026-02-01" },
      ]);
    });

    test("returns carehome donors", async () => {
      DonationMoney.find.mockReturnValue(
        createSortLeanChain([
          { userId: 5, amount_donated: 1500, donated_at: "2026-03-01" },
        ])
      );
      User.find.mockReturnValue(
        createLeanChain([{ userId: 5, name: "Kiran" }])
      );

      const response = await request(app).get("/api/admin/carehome-donors/7");

      expect(response.statusCode).toBe(200);
      expect(response.body.donorList).toEqual([
        { name: "Kiran", amount: 1500, date: "2026-03-01" },
      ]);
    });

    test("returns event registrations", async () => {
      UserRegisteredEvent.find.mockReturnValue(
        createLeanChain([
          { userId: 12, createdAt: "2026-04-01T00:00:00.000Z" },
        ])
      );
      User.find.mockReturnValue(
        createLeanChain([{ userId: 12, name: "Rohit" }])
      );

      const response = await request(app).get("/api/admin/event-registrations/e1");

      expect(response.statusCode).toBe(200);
      expect(response.body.registrationList).toEqual([
        {
          name: "Rohit",
          userId: 12,
          registeredAt: "2026-04-01T00:00:00.000Z",
        },
      ]);
    });

    test("returns all donors", async () => {
      User.find.mockReturnValue(
        createLeanChain([
          { userId: 1, name: "Donor One", email: "one@test.com" },
          { userId: 2, name: "Donor Two", email: "two@test.com" },
        ])
      );

      const response = await request(app).get("/api/admin/all-donors");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.donors).toHaveLength(2);
    });

    test("returns donor management stats", async () => {
      User.findOne.mockReturnValue(
        createLeanChain({
          userId: 21,
          name: "Meera",
          email: "meera@test.com",
          mobile_number: "9999999999",
        })
      );
      UserRegisteredEvent.find.mockReturnValue(
        createLeanChain([{ event_name: "Event A" }, { event_name: "Event B" }])
      );
      UserContributedFundraiser.find.mockReturnValue(
        createLeanChain([
          { amount_contributed: 1000 },
          { amount_contributed: 4000 },
        ])
      );
      DonationMoney.find.mockReturnValue(
        createLeanChain([
          { amount_donated: 2000 },
          { amount_donated: 500 },
        ])
      );

      const response = await request(app).get("/api/admin/donor-stats/21");

      expect(response.statusCode).toBe(200);
      expect(response.body.stats.highestDonation).toBe(4000);
      expect(response.body.stats.totalImpact).toBe(7500);
      expect(response.body.stats.eventCount).toBe(2);
      expect(response.body.stats.fundraiserCount).toBe(2);
      expect(response.body.stats.directCount).toBe(2);
    });

    test("returns 404 when donor stats user is not found", async () => {
      User.findOne.mockReturnValue(createLeanChain(null));
      UserRegisteredEvent.find.mockReturnValue(createLeanChain([]));
      UserContributedFundraiser.find.mockReturnValue(createLeanChain([]));
      DonationMoney.find.mockReturnValue(createLeanChain([]));

      const response = await request(app).get("/api/admin/donor-stats/404");

      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: "Donor not found",
      });
    });

    test("returns all ngo management records", async () => {
      NGO.find.mockReturnValue(
        createLeanChain([
          { ngoId: 1, Ngoname: "Helping Hands", darpan_id: "DAR-1" },
          { ngoId: 2, Ngoname: "Care Trust", darpan_id: "DAR-2" },
        ])
      );

      const response = await request(app).get("/api/admin/all-ngos-manage");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.ngos).toHaveLength(2);
    });
  });
});

function UserContributedFundraisersSequence() {
  UserContributedFundraiser.aggregate
    .mockResolvedValueOnce([{ name: "Rahul", total: 6000 }])
    .mockResolvedValueOnce([{ total: 6000 }])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ name: "Rahul", total: 3000 }])
    .mockResolvedValueOnce([{ total: 3000 }])
    .mockResolvedValueOnce([]);
}
