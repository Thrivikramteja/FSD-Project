import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../components/authContext';
import DonorDashboard from '../dashboards/userDashboard';

// Mock socket.io-client so NotificationBell doesn't crash
vi.mock('socket.io-client', () => ({
    io: () => ({
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
    })
}));

// Mock Header and Footer to keep tests simple
vi.mock('../components/header', () => ({
    default: () => <div data-testid="header">Header</div>
}));
vi.mock('../components/footer', () => ({
    default: () => <div data-testid="footer">Footer</div>
}));
vi.mock('../components/NotificationBell', () => ({
    default: () => <div data-testid="notification-bell">Bell</div>
}));

// Standard mock user
const mockUser = {
    userId: 4,
    name: 'CH VENKATA DHEERAJ',
    email: 'dheeraj@gmail.com',
    mobile_number: '9876543210'
};

// Helper — renders DonorDashboard with a given auth state
const renderDashboard = (authOverride = {}) => {
    const defaultAuth = {
        auth: { user: mockUser, role: 'Donor', loading: false },
        logout: vi.fn(),
        updateUser: vi.fn(),
    };
    const authValue = { ...defaultAuth, ...authOverride };

    return render(
        <AuthContext.Provider value={authValue}>
            <MemoryRouter initialEntries={['/donor-dashboard/4']}>
                <Routes>
                    <Route path="/donor-dashboard/:id" element={<DonorDashboard />} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
};

// ─── SUITE 1: Loading state ────────────────────────────────────────────────
describe('DonorDashboard — Loading', () => {

    it('shows loading message while auth is loading', () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

        renderDashboard({
            auth: { user: null, role: null, loading: true }
        });

        expect(screen.getByText(/Loading Donor Dashboard/i)).toBeInTheDocument();
    });
});

// ─── SUITE 2: Renders correctly ────────────────────────────────────────────
describe('DonorDashboard — Renders correctly', () => {

    beforeEach(() => {
        // Mock all fetch calls
        global.fetch = vi.fn((url) => {
            if (url.includes('/api/activity')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            donations_money: [],
                            contributedFundraisers: [],
                            donations_items: [],
                            events_upcoming: [],
                            events_participated: []
                        }
                    })
                });
            }
            if (url.includes('/my-applications')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, applications: [] })
                });
            }
            if (url.includes('/api/notifications')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, notifications: [], unreadCount: 0 })
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({})
            });
        });
    });

    it('renders welcome message with user name', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText(/Welcome, CH VENKATA DHEERAJ/i)).toBeInTheDocument();
        });
    });

    it('renders donor profile section', async () => {
    renderDashboard();
    await waitFor(() => {
        expect(screen.getByText(/Donor Profile/i)).toBeInTheDocument();
        // Use getAllByText since name appears in both welcome header and profile
        const nameElements = screen.getAllByText(/CH VENKATA DHEERAJ/i);
        expect(nameElements.length).toBeGreaterThan(0);
        expect(screen.getByText(/dheeraj@gmail.com/i)).toBeInTheDocument();
    });
});

it('renders all section headings', async () => {
    renderDashboard();
    await waitFor(() => {
        // Query by role="heading" to avoid matching empty state text
        const headings = screen.getAllByRole('heading');
        const headingTexts = headings.map(h => h.textContent);

        expect(headingTexts.some(t => /My Job Applications/i.test(t))).toBe(true);
        expect(headingTexts.some(t => /Money Donations/i.test(t))).toBe(true);
        expect(headingTexts.some(t => /Fundraiser Contributions/i.test(t))).toBe(true);
        expect(headingTexts.some(t => /Item Donations/i.test(t))).toBe(true);
        expect(headingTexts.some(t => /Upcoming Registered Events/i.test(t))).toBe(true);
        expect(headingTexts.some(t => /Events Participated/i.test(t))).toBe(true);
    });
});

    it('shows empty state messages when no data', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText(/No job applications yet/i)).toBeInTheDocument();
            expect(screen.getByText(/No money donations yet/i)).toBeInTheDocument();
            expect(screen.getByText(/No fundraiser contributions yet/i)).toBeInTheDocument();
            expect(screen.getByText(/No item donations yet/i)).toBeInTheDocument();
        });
    });
});

// ─── SUITE 3: Activity data renders ───────────────────────────────────────
describe('DonorDashboard — Activity data', () => {

    it('renders job application cards', async () => {
        global.fetch = vi.fn((url) => {
            if (url.includes('/my-applications')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        success: true,
                        applications: [{
                            _id: 'app1',
                            jobId: { title: 'Nurse Assistant' },
                            carehomeName: 'Sunshine Home',
                            carehomeId: { carehomeId: 1 },
                            status: 'Pending',
                            appliedAt: new Date().toISOString()
                        }]
                    })
                });
            }
            if (url.includes('/api/activity')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            donations_money: [],
                            contributedFundraisers: [],
                            donations_items: [],
                            events_upcoming: [],
                            events_participated: []
                        }
                    })
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ success: true, notifications: [], unreadCount: 0 })
            });
        });

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/Nurse Assistant/i)).toBeInTheDocument();
            expect(screen.getByText(/Pending/i)).toBeInTheDocument();
        });
    });

    it('renders money donation cards with amount', async () => {
        global.fetch = vi.fn((url) => {
            if (url.includes('/api/activity')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            donations_money: [{
                                _id: 'don1',
                                amount_donated: 500,
                                donated_at: new Date().toISOString(),
                                carehomeDetails: { care_home_name: 'Sunshine Home' }
                            }],
                            contributedFundraisers: [],
                            donations_items: [],
                            events_upcoming: [],
                            events_participated: []
                        }
                    })
                });
            }
            if (url.includes('/my-applications')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, applications: [] })
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ success: true, notifications: [], unreadCount: 0 })
            });
        });

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/Sunshine Home/i)).toBeInTheDocument();
            expect(screen.getByText(/500/i)).toBeInTheDocument();
        });
    });
});

// ─── SUITE 4: Edit profile ─────────────────────────────────────────────────
describe('DonorDashboard — Edit profile', () => {

    beforeEach(() => {
        global.fetch = vi.fn((url) => {
            if (url.includes('/api/activity')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            donations_money: [],
                            contributedFundraisers: [],
                            donations_items: [],
                            events_upcoming: [],
                            events_participated: []
                        }
                    })
                });
            }
            if (url.includes('/my-applications')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, applications: [] })
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ success: true, notifications: [], unreadCount: 0 })
            });
        });
    });

    it('shows edit form when Edit My Profile is clicked', async () => {
        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/Edit My Profile/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Edit My Profile/i));

        await waitFor(() => {
            expect(screen.getByText(/Save/i)).toBeInTheDocument();
            expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
        });
    });

    it('hides edit form when Cancel is clicked', async () => {
        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/Edit My Profile/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Edit My Profile/i));

        await waitFor(() => {
            expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Cancel/i));

        await waitFor(() => {
            expect(screen.getByText(/Edit My Profile/i)).toBeInTheDocument();
        });
    });

    it('submits edit form and shows updated name', async () => {
        global.fetch = vi.fn((url, options) => {
            if (url.includes(`/api/donor/`) && options?.method === 'PUT') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        user: {
                            name: 'Updated Name',
                            email: 'dheeraj@gmail.com',
                            mobile_number: '9876543210'
                        }
                    })
                });
            }
            if (url.includes('/api/activity')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            donations_money: [],
                            contributedFundraisers: [],
                            donations_items: [],
                            events_upcoming: [],
                            events_participated: []
                        }
                    })
                });
            }
            if (url.includes('/my-applications')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, applications: [] })
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ success: true, notifications: [], unreadCount: 0 })
            });
        });

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/Edit My Profile/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Edit My Profile/i));

        await waitFor(() => {
            expect(screen.getByDisplayValue('CH VENKATA DHEERAJ')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByDisplayValue('CH VENKATA DHEERAJ'), {
            target: { value: 'Updated Name', name: 'name' }
        });

        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(screen.getByText(/Edit My Profile/i)).toBeInTheDocument();
        });
    });
});