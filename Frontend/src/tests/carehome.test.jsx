import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom";

vi.mock("../components/CareHeader", () => ({ default: ({ careid }) => <div>CareHeader-{careid}</div> }));
vi.mock("../components/footer",     () => ({ default: () => <div>Footer</div> }));
vi.mock("../components/header",     () => ({ default: () => <div>Header</div> }));
vi.mock("../styles/CarehomeDashboard.module.css", () => ({ default: {} }));
vi.mock("../styles/carehomes_edit.css",           () => ({ default: {} }));
vi.mock("../styles/UserControl.module.css",       () => ({ default: {} }));
vi.mock("../styles/donate_mon.css",               () => ({ default: {} }));
vi.mock("../config/headerConfig", () => ({ headerConfig: { landing: [] } }));

delete window.location;
window.location = { href: "" };

import CarehomeDashboard from "../pages/CarehomeDashboard";
import EditProfile       from "../pages/EditProfileCarehome";
import CreateJob         from "../pages/createJob";
import DonateMoneyPage   from "../pages/DonateMoneyPage";
import CarehomeControl   from "../pages/CarehomeControl";

const renderWithRouter = (ui, { path = "/", route = "/" } = {}) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>
  );

// ════════════════════════════════════════════════════════════════════════════
// 1. CarehomeDashboard
// ════════════════════════════════════════════════════════════════════════════

describe("CarehomeDashboard", () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url.includes("carehome-dashboard")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: "Sunshine Home",
            wishlist: "Blankets, Food",
            ongoing_fund: [{ fundraiser_name: "Clean Water", amount_raised_so_far: 5000, goal_amount: 10000 }],
            messages: [],
            recentDonations: [],
            stats: [],
          }),
        });
      }
      if (url.includes("my-jobs")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jobs: [{ _id: "j1", title: "Caretaker", type: "Full-time", pay: 8000 }] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => vi.clearAllMocks());

  test("shows loading state initially", () => {
    renderWithRouter(<CarehomeDashboard />, { path: "/carehome-dashboard/:careid", route: "/carehome-dashboard/1" });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("renders carehome name after data loads", async () => {
    renderWithRouter(<CarehomeDashboard />, { path: "/carehome-dashboard/:careid", route: "/carehome-dashboard/1" });
    await waitFor(() => expect(screen.getByText("Sunshine Home")).toBeInTheDocument());
  });

  test("renders active fundraiser", async () => {
    renderWithRouter(<CarehomeDashboard />, { path: "/carehome-dashboard/:careid", route: "/carehome-dashboard/1" });
    await waitFor(() => expect(screen.getByText("Clean Water")).toBeInTheDocument());
  });

  test("opens item request modal on click", async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes("carehome-dashboard")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: "Sunshine Home",
            wishlist: "",
            ongoing_fund: [],
            messages: [{ category: "Clothes", location: "Delhi", description: "Need warm clothes" }],
            recentDonations: [],
            stats: [],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ jobs: [] }) });
    });

    renderWithRouter(<CarehomeDashboard />, { path: "/carehome-dashboard/:careid", route: "/carehome-dashboard/1" });
    await waitFor(() => screen.getByText("Clothes"));
    fireEvent.click(screen.getByText(/click to view details/i));
    expect(screen.getByText("Donation Request Details")).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. EditProfileCarehome
// ════════════════════════════════════════════════════════════════════════════

describe("EditProfileCarehome", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          care_home_name: "Test Home",
          contact: "9999999999",
          email: "test@home.com",
          ifsc: "SBIN0001234",
        }),
      })
    );
  });

  afterEach(() => vi.clearAllMocks());

  test("pre-fills form fields with fetched data", async () => {
    renderWithRouter(<EditProfile />, { path: "/edit-profile/:careid", route: "/edit-profile/1" });
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Home")).toBeInTheDocument();
      expect(screen.getByDisplayValue("9999999999")).toBeInTheDocument();
    });
  });

  test("shows validation error for invalid phone number", async () => {
    renderWithRouter(<EditProfile />, { path: "/edit-profile/:careid", route: "/edit-profile/1" });
    await waitFor(() => screen.getByDisplayValue("Test Home"));
    fireEvent.change(screen.getByDisplayValue("9999999999"), { target: { value: "123" } });
    fireEvent.click(screen.getByText(/update profile/i));
    await waitFor(() => expect(screen.getByText(/valid details/i)).toBeInTheDocument());
  });

  test("shows success message on successful update", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ care_home_name: "Test Home", contact: "9999999999", email: "test@home.com", ifsc: "SBIN0001234" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    renderWithRouter(<EditProfile />, { path: "/edit-profile/:careid", route: "/edit-profile/1" });
    await waitFor(() => screen.getByDisplayValue("Test Home"));
    fireEvent.click(screen.getByText(/update profile/i));
    await waitFor(() => expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. CreateJob
// ════════════════════════════════════════════════════════════════════════════

describe("CreateJob", () => {
  afterEach(() => vi.clearAllMocks());

  test("renders the create job form", () => {
    render(<CreateJob />);
    expect(screen.getByText(/post a new job/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
  });

  test("shows alert when required fields are missing", () => {
    window.alert = vi.fn();
    const { container } = render(<CreateJob />);
    fireEvent.submit(container.querySelector("form"));
    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/fill in/i));
  });

  test("submits successfully with valid data", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, redirectUrl: "/carehome-dashboard" }),
      })
    );

    render(<CreateJob />);
    fireEvent.change(screen.getByLabelText(/job title/i),       { target: { value: "Caretaker" } });
    fireEvent.change(screen.getByLabelText(/job description/i), { target: { value: "Help needed" } });
    fireEvent.change(screen.getByLabelText(/job type/i),        { target: { value: "Full-time" } });
    fireEvent.click(screen.getByText(/post job/i));
    await waitFor(() => expect(screen.getByText(/job posted successfully/i)).toBeInTheDocument());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. DonateMoneyPage
// ════════════════════════════════════════════════════════════════════════════

describe("DonateMoneyPage", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { carehomeId: 1, care_home_name: "Sunshine Home", description: "A great home" },
        ]),
      })
    );
  });

  afterEach(() => vi.clearAllMocks());

  test("loads and displays carehome options in dropdown", async () => {
    renderWithRouter(<DonateMoneyPage />);
    await waitFor(() => expect(screen.getByText("Sunshine Home")).toBeInTheDocument());
  });

  test("shows donation form after selecting carehome and clicking continue", async () => {
    renderWithRouter(<DonateMoneyPage />);
    await waitFor(() => screen.getByText("Sunshine Home"));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
    fireEvent.click(screen.getByText(/continue/i));
    await waitFor(() => expect(screen.getByText(/contribution amount/i)).toBeInTheDocument());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. CarehomeControl
// ════════════════════════════════════════════════════════════════════════════

describe("CarehomeControl", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          carehomes: [
            { carehomeId: 1, care_home_name: "Sunshine Home", reg_number: "REG001" },
            { carehomeId: 2, care_home_name: "Green Valley",  reg_number: "REG002" },
          ],
        }),
      })
    );
  });

  afterEach(() => vi.clearAllMocks());

  test("renders list of carehomes", async () => {
    render(<CarehomeControl />);
    await waitFor(() => {
      expect(screen.getByText("Sunshine Home")).toBeInTheDocument();
      expect(screen.getByText("Green Valley")).toBeInTheDocument();
    });
  });

  test("filters carehomes by search input", async () => {
    render(<CarehomeControl />);
    await waitFor(() => screen.getByText("Sunshine Home"));
    fireEvent.change(screen.getByPlaceholderText(/search carehomes/i), { target: { value: "Green" } });
    expect(screen.queryByText("Sunshine Home")).not.toBeInTheDocument();
    expect(screen.getByText("Green Valley")).toBeInTheDocument();
  });

  test("shows delete confirmation modal when Remove is clicked", async () => {
    render(<CarehomeControl />);
    await waitFor(() => screen.getByText("Sunshine Home"));
    fireEvent.click(screen.getAllByText("Remove")[0]);
    expect(screen.getByText(/de-list institution/i)).toBeInTheDocument();
  });

  test("shows alert when confirming delete without a reason", async () => {
    window.alert = vi.fn();
    render(<CarehomeControl />);
    await waitFor(() => screen.getByText("Sunshine Home"));
    fireEvent.click(screen.getAllByText("Remove")[0]);
    fireEvent.click(screen.getByText(/confirm & notify/i));
    expect(window.alert).toHaveBeenCalledWith("Reason is required.");
  });
});
