import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("../components/header",  () => ({ default: () => <div>Header</div> }));
vi.mock("../components/footer",  () => ({ default: () => <div>Footer</div> }));
vi.mock("../config/headerConfig", () => ({ headerConfig: { landing: [] } }));
vi.mock("socket.io-client", () => ({ default: { io: vi.fn() } }));
vi.mock("../components/NotificationBell", () => ({ default: () => <div>NotificationBell</div> }));

delete window.location;
window.location = { href: "" };

import CreateEvent      from "../pages/CreateEvent";
import CreateFundraiser from "../pages/CreateFundraiser";
import DonateFundraiser from "../pages/DonateFundraiser";
import AllNgos          from "../pages/AllNgos";

const renderWithRouter = (ui, { path = "/", route = "/" } = {}) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>
  );

// ════════════════════════════════════════════════════════════════════════════
// 1. CreateEvent
// ════════════════════════════════════════════════════════════════════════════

describe("CreateEvent", () => {
  afterEach(() => vi.clearAllMocks());

  test("renders the create event form", () => {
    renderWithRouter(<CreateEvent />, { path: "/create-event/:ngoID", route: "/create-event/1" });
    expect(screen.getByText(/create new event/i)).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. CreateFundraiser
// ════════════════════════════════════════════════════════════════════════════

describe("CreateFundraiser", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ carehomeId: 1, care_home_name: "Sunshine Home" }]),
      })
    );
  });

  afterEach(() => vi.clearAllMocks());

  test("loads and shows carehome options in dropdown", async () => {
    renderWithRouter(<CreateFundraiser />, { path: "/create-fundraiser/:ngoID", route: "/create-fundraiser/1" });
    await waitFor(() => expect(screen.getByText("Sunshine Home")).toBeInTheDocument());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. DonateFundraiser
// ════════════════════════════════════════════════════════════════════════════

describe("DonateFundraiser", () => {
  afterEach(() => vi.clearAllMocks());

  test("renders donate page with user details pre-filled", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { name: "Test Donor", email: "donor@test.com", mobile_number: "9999999999" } }),
      })
    );
    renderWithRouter(<DonateFundraiser />, { path: "/donate/:ngoId/:name_fund", route: "/donate/1/Water%20Fund" });
    await waitFor(() => expect(screen.getByDisplayValue("Test Donor")).toBeInTheDocument());
    expect(screen.getByDisplayValue("9999999999")).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. AllNgos
// ════════════════════════════════════════════════════════════════════════════

describe("AllNgos", () => {
  afterEach(() => vi.clearAllMocks());

  test("renders NGO cards after successful fetch", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [{ _id: "1", ngoId: 1, Ngoname: "HelpNGO", phone: "9999999999", email: "help@ngo.com", totalFundsRaised: 50000, careHomesBenefited: 3 }],
        }),
      })
    );
    renderWithRouter(<AllNgos />);
    await waitFor(() => expect(screen.getByText("HelpNGO")).toBeInTheDocument());
  });

  test("shows no NGOs found when result is empty", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) })
    );
    renderWithRouter(<AllNgos />);
    await waitFor(() => expect(screen.getByText(/no ngos found/i)).toBeInTheDocument());
  });
});
