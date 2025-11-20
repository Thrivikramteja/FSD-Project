import { useState } from 'react'
import DonorSignup from '../components/signupForm/donorSignup'
import CarehomeRegister from '../components/signupForm/carehomeRegister'
import NGORegister from '../components/signupForm/ngoRegister'
import "../components/signupForm/signup.css"

export default function Signup() {
    const [usertype, setUsertype] = useState("");

    return (
        <div className="signup-wrapper">
            <h1 style={{marginBottom: "6px"}}>Sign Up</h1>

            <p style={{marginBottom: "8px"}}>Register as:</p>

            <select 
                className="role-select"
                value={usertype} 
                onChange={(e) => setUsertype(e.target.value)}
            >
                <option value="">--Select--</option>
                <option value="Donor">Donor</option>
                <option value="Carehome">Carehome</option>
                <option value="NGO">NGO</option>
            </select>

            <div className="form-area">
                {usertype === "Donor" && <DonorSignup />}
                {usertype === "Carehome" && <CarehomeRegister />}
                {usertype === "NGO" && <NGORegister />}
            </div>
        </div>
    );
}
