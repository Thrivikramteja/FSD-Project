export const headerConfig = {
  landing: [
    // { label: "Discover", path: "/discover" },
    // { label: "Ways to Help", path: "/ways-to-help" },
    { 
      label: "Discover", 
      path: "/discover",
      subItems: [
        { label: "Care Homes", path: "/carehomes" },
        { label: "All NGOs", path: "/all-ngos" },
        { label: "Events", path: "/events" },
        { label: "Fundraisers", path: "/fundraisers" }
      ]
    },
    { label: "Ways to Help", path: "/ways-to-help" },
  ],
  donor: [
  ],
  ngo: [
    { label: "Create Fundraiser", path: "/create-fundraiser" },
    { label: "My Fundraisers", path: "/my-fundraisers" },
    { label: "Received Donations", path: "/received-donations" },
    { label: "Reports", path: "/reports" },
  ],
  carehome: [
    { label: "Donation Requests", path: "/donation-requests" },
    { label: "Received Donations", path: "/received-donations" },
    { label: "Reports", path: "/reports" },
  ],
  admin: [
    { label: "Manage Users", path: "/manage-users" },
    { label: "Manage Fundraisers", path: "/manage-fundraisers" },
    { label: "Donations Overview", path: "/donations-overview" },
    { label: "Events Management", path: "/events-management" },
    { label: "Reports", path: "/reports" },
    { label: "Settings", path: "/settings" },
  ],
};
