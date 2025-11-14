import useState from 'react'
import DonorSignup from './donorSignup'
import CarehomeRegister from './carehomeRegister'
import NGORegister from './ngoRegister'

export default function Signup() {
    const [usertype, setUsertype] = useState("");
    return (
        <div>
            <h1>Sign Up</h1>

            <p>Register as:</p>
            <select value={usertype} onChange={(e) => { setUsertype(e.target.value) }}>
                <option value="">--Select--</option>
                <option value="Donor">Donor</option>
                <option value="Carehome">Carehome</option>
                <option value="NGO">NGO</option>
            </select>

            {usertype === "Donor" && <DonorSignup />}
            {usertype === "Carehome" && <CarehomeRegister />}
            {usertype === "NGO" && <NGORegister />}
        </div>
    );
}

