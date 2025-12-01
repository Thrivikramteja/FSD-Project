import React, { useEffect, useState, useContext } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { headerConfig } from "../config/headerConfig";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../components/authContext";

export default function DonorDashboard() {
  console.log("in donor dashboard");

  const { id } = useParams();
  const navigate = useNavigate();
  
  const { auth } = useContext(AuthContext);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!auth.isLoggedIn) {
      navigate("/login");
      return;
    }

    if (auth.role !== "Donor") {
      navigate("/");
      return;
    }

    const loggedInUser = auth.user;

    if (loggedInUser.userId.toString() !== id.toString()) {
      navigate(`/donor-dashboard/${loggedInUser.userId}`);
      return;
    }

    setUser(loggedInUser);

  }, [auth, id, navigate]);

  if (!user) {
    return (
      <>
        <Header navItems={headerConfig.donor} />
        <div className="dashboard-loading">Loading dashboard...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header navItems={headerConfig.donor} userName={user.name} />

      <div className="dashboard-container">
        <h1>Welcome, {user.name} 👋</h1>
        <p className="dashboard-role">Role: Donor</p>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Profile</h3>
            <p>View or edit your profile details.</p>
            <button>Go to Profile</button>
          </div>

          <div className="dashboard-card">
            <h3>My Activity</h3>
            <p>See your activity.</p>
            <button>View Activity</button>
          </div>

          <div className="dashboard-card">
            <h3>Notifications</h3>
            <p>Check updates.</p>
            <button>View Notifications</button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
