// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import AdminDashboard from '../src/pages/AdminDashboard.jsx';
import AdminEvents from '../src/pages/AdminEvents.jsx';
import AdminFundraisers from '../src/pages/AdminFundraisers.jsx';
import AdminDonations from '../src/pages/AdminDonations.jsx';
import DonorControl from '../src/pages/DonorControl.jsx';
import NgoControl from '../src/pages/NgoControl.jsx';
import CarehomeControl from '../src/pages/CarehomeControl.jsx';

const makeResponse = (body, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => body,
});

const setFetchMock = (routes) => {
  global.fetch = vi.fn((url, options = {}) => {
    const route = routes.find((entry) => {
      if (typeof entry.match === 'function') {
        return entry.match(url, options);
      }

      return String(url).includes(entry.match);
    });

    if (!route) {
      return Promise.reject(new Error(`Unhandled fetch: ${String(url)}`));
    }

    return Promise.resolve(
      makeResponse(route.body, route.ok ?? true, route.status ?? 200)
    );
  });
};

const dashboardStats = {
  total_revenue: 5400,
  total_ngo: 4,
  total_events: 7,
  high_con_name: { name: 'Anita' },
  monthlyBusiness: [
    { name: 'Jan', profit: 1000 },
    { name: 'Feb', profit: 2000 },
  ],
  top_fund: [
    {
      _id: 'fund-1',
      fundraiser_name: 'Food Drive',
      amount_raised_so_far: 12000,
      goal_amount: 20000,
    },
  ],
};

const eventAnalytics = {
  analytics: {
    influentialNgo: { name: 'Hope NGO', impact: 42 },
    influentialEvent: { event_name: 'Health Camp', number_of_registrations: 25 },
  },
  groups: {
    ongoing: [
      {
        _id: 'event-1',
        event_name: 'Tree Plantation',
        event_date: '2026-04-20T00:00:00.000Z',
        number_of_registrations: 10,
        event_location: 'Chennai',
      },
    ],
    upcoming: [
      {
        _id: 'event-2',
        event_name: 'School Visit',
        event_date: '2026-05-01T00:00:00.000Z',
        number_of_registrations: 5,
        event_location: 'Madurai',
      },
    ],
    completed: [
      {
        _id: 'event-3',
        event_name: 'Health Camp',
        event_date: '2026-03-01T00:00:00.000Z',
        number_of_registrations: 25,
        event_location: 'Coimbatore',
      },
    ],
  },
};

const fundraiserAnalytics = {
  analytics: {
    top3Ongoing: [
      {
        _id: 'fr-1',
        fundraiser_name: 'Meal Support',
        ngoName: 'Care NGO',
        amount_raised_so_far: 8000,
      },
    ],
    ngoRevenue: [{ name: 'Care NGO', total: 8000 }],
  },
  groups: {
    ongoing: [
      {
        _id: 'fr-1',
        fundraiser_name: 'Meal Support',
        ngoName: 'Care NGO',
        carehomeName: 'Sunrise Home',
        amount_raised_so_far: 8000,
      },
    ],
    completed: [
      {
        _id: 'fr-2',
        fundraiser_name: 'Medical Aid',
        ngoName: 'Health NGO',
        carehomeName: 'Happy Home',
        amount_raised_so_far: 15000,
      },
    ],
  },
};

const donationAnalytics = {
  analytics: {
    platformTotal: 21000,
    carehomeImpact: [
      { carehomeId: 'home-1', name: 'Sunrise Home', total: 9000 },
      { carehomeId: 'home-2', name: 'Peace Home', total: 6000 },
    ],
    monthlyStats: [
      { name: 'Jan', total: 5000 },
      { name: 'Feb', total: 7000 },
    ],
  },
};

const donorList = {
  donors: [
    { userId: 'donor-1', name: 'Rahul', email: 'rahul@test.com' },
    { userId: 'donor-2', name: 'Meena', email: 'meena@test.com' },
  ],
};

const donorStats = {
  stats: {
    name: 'Rahul',
    mobile_number: '9876543210',
    highestDonation: 5000,
    totalImpact: 12000,
    eventCount: 2,
    directCount: 1,
    fundraiserCount: 3,
  },
};

const ngoList = {
  ngos: [
    {
      ngoId: 'ngo-1',
      Ngoname: 'Helping Hands',
      darpan_id: 'DAR123',
      email: 'ngo@test.com',
    },
  ],
};

const ngoStats = {
  stats: {
    Ngoname: 'Helping Hands',
    year_established: 2010,
    darpan_id: 'DAR123',
    totalEvents: 5,
    totalFundraisers: 3,
    highestFunding: 18000,
    highestRegistrations: 200,
  },
};

const carehomeList = {
  carehomes: [
    {
      carehomeId: 'care-1',
      care_home_name: 'Sunrise Home',
      reg_number: 'REG101',
      email: 'care@test.com',
    },
  ],
};

const carehomeStats = {
  stats: {
    care_home_name: 'Sunrise Home',
    totalDirectMoney: 9000,
    totalFundraiserMoney: 11000,
    campaignCount: 4,
    totalSupporters: 22,
    num_residents: 35,
    avg_expense: 2500,
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
  global.alert = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe('Frontend admin Vitest suite', () => {
  it('renders admin dashboard overview data from the main stats API', async () => {
    setFetchMock([{ match: 'api/admin/main-stats', body: dashboardStats }]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Initializing Command Center...')).toBeInTheDocument();
    expect(await screen.findByText('Food Drive')).toBeInTheDocument();
    expect(screen.getByText('Anita')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/main-stats'),
      { credentials: 'include' }
    );
  });

  it('opens the manage users section from the admin dashboard', async () => {
    setFetchMock([
      { match: 'api/admin/main-stats', body: dashboardStats },
      { match: 'api/admin/all-donors', body: donorList },
    ]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await screen.findByText('Food Drive');
    fireEvent.click(screen.getByRole('button', { name: 'Manage Users' }));

    expect(await screen.findByText('Donor Management')).toBeInTheDocument();
    expect(await screen.findByText('Rahul')).toBeInTheDocument();
  });

  it('renders completed event analytics by default', async () => {
    setFetchMock([{ match: 'api/admin/events-analytics', body: eventAnalytics }]);

    render(<AdminEvents />);

    expect(screen.getByText('Accessing Database...')).toBeInTheDocument();
    expect(await screen.findByText('Hope NGO')).toBeInTheDocument();
    expect(screen.getByText('Coimbatore')).toBeInTheDocument();
  });

  it('switches event tabs and filters the admin event list', async () => {
    setFetchMock([{ match: 'api/admin/events-analytics', body: eventAnalytics }]);

    render(<AdminEvents />);

    await screen.findByText('Coimbatore');
    fireEvent.click(screen.getByRole('button', { name: 'ongoing' }));
    expect(await screen.findByText('Tree Plantation')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search records...'), {
      target: { value: 'tree' },
    });

    expect(screen.getByText('Tree Plantation')).toBeInTheDocument();
    expect(screen.queryByText('School Visit')).not.toBeInTheDocument();
  });

  it('opens the participant audit modal for an event', async () => {
    setFetchMock([
      { match: 'api/admin/events-analytics', body: eventAnalytics },
      {
        match: 'api/admin/event-registrations/event-3',
        body: {
          registrationList: [
            {
              name: 'Karthik',
              userId: 'user-1',
              registeredAt: '2026-03-02T00:00:00.000Z',
            },
          ],
        },
      },
    ]);

    render(<AdminEvents />);

    const eventRows = await screen.findAllByText('Health Camp');
    fireEvent.click(eventRows[1]);

    expect(await screen.findByText(/Participation Audit:/)).toBeInTheDocument();
    expect(await screen.findByText('Karthik')).toBeInTheDocument();
  });

  it('renders fundraiser analytics for admin review', async () => {
    setFetchMock([
      { match: 'api/admin/fundraisers-analytics', body: fundraiserAnalytics },
    ]);

    render(<AdminFundraisers />);

    expect(screen.getByText('Auditing Financials...')).toBeInTheDocument();
    expect(await screen.findByText('Sunrise Home')).toBeInTheDocument();
    expect(screen.getByText('Revenue Generation per NGO')).toBeInTheDocument();
  });

  it('opens the donor ledger for a fundraiser', async () => {
    setFetchMock([
      { match: 'api/admin/fundraisers-analytics', body: fundraiserAnalytics },
      {
        match: 'api/admin/fundraiser-donors/fr-1',
        body: {
          donorList: [
            { name: 'Priya', amount: 1000, date: '2026-04-10T00:00:00.000Z' },
          ],
        },
      },
    ]);

    render(<AdminFundraisers />);

    await screen.findByText('Sunrise Home');
    fireEvent.click(screen.getByRole('button', { name: 'View Donors' }));

    expect(await screen.findByText(/Donor Ledger:/)).toBeInTheDocument();
    expect(await screen.findByText('Priya')).toBeInTheDocument();
  });

  it('renders donation analytics and opens carehome donor audit', async () => {
    setFetchMock([
      { match: 'api/admin/donations-analytics', body: donationAnalytics },
      {
        match: 'api/admin/carehome-donors/home-1',
        body: {
          donorList: [
            { name: 'Arun', amount: 1500, date: '2026-04-11T00:00:00.000Z' },
          ],
        },
      },
    ]);

    render(<AdminDonations />);

    expect(screen.getByText('Syncing Financial Ledger...')).toBeInTheDocument();
    expect(await screen.findByText('Platform Lifetime Direct Giving')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Audit Donors' })[0]);

    expect(await screen.findByText(/Donor Audit:/)).toBeInTheDocument();
    expect(await screen.findByText('Arun')).toBeInTheDocument();
  });

  it('deletes a donor from the admin donor control after reason is entered', async () => {
    setFetchMock([
      { match: 'api/admin/all-donors', body: donorList },
      {
        match: (url, options) =>
          String(url).includes('api/admin/delete-donor') &&
          options.method === 'DELETE',
        body: { success: true },
      },
    ]);

    render(<DonorControl />);

    expect(await screen.findByText('Rahul')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    fireEvent.change(screen.getByPlaceholderText('Enter reason...'), {
      target: { value: 'Violation of admin policy' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Send Mail' }));

    await waitFor(() => {
      expect(screen.queryByText('Rahul')).not.toBeInTheDocument();
    });
  });

  it('loads ngo and carehome audit modals for admin control', async () => {
    setFetchMock([
      { match: 'api/admin/all-ngos-manage', body: ngoList },
      { match: 'api/admin/ngo-manage-stats/ngo-1', body: ngoStats },
    ]);

    render(<NgoControl />);

    fireEvent.click(await screen.findByText('Helping Hands'));
    expect(await screen.findByText(/Organization Audit:/)).toBeInTheDocument();
    cleanup();

    setFetchMock([
      { match: 'api/admin/all-carehomes-manage', body: carehomeList },
      { match: 'api/admin/carehome-manage-stats/care-1', body: carehomeStats },
    ]);

    render(<CarehomeControl />);

    fireEvent.click(await screen.findByText('Sunrise Home'));
    expect(await screen.findByText(/Institution Audit:/)).toBeInTheDocument();
  });
});
