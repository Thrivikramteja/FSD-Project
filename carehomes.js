const express = require('express');
const path = require('path');

const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Dummy data for care homes
const careHomes = [
    {
        name: "HelpAge India",
        logo: "/images/helpage.png", 

        categories: [
            { main: "Vulnerable Groups", sub: "Senior Citizens Care-Old age homes" },
            { main: "Health", sub: "Health Care - Other services" }
        ],
        location: "New Delhi, India",
        description: "HelpAge India is one of the top NGOs in India, working with and for the disadvantaged elderly for more than 4 decades. HelpAge also works for the healthcare of senior citizens and older persons' rights in India. HelpAge India through its various programmes such as Agecare, Healthcare, Disaster Management, Livelihoods, Research & Advocacy, is working hard to ensure that every grandparent is given their rightful place in society."
    },
    {
        name: "Agewell Foundation",
        logo: "/images/agewell.png",
        categories: [
            { main: "Vulnerable Groups", sub: "Senior Citizens Care-Old age homes" }
        ],
        location: "New Delhi, India",
        description: "Agewell Foundation is an NGO for old age people in India. They have been working for the empowerment and welfare of older people in India since 1999. Through the nationwide network of its volunteers, Agewell engages with over 25,000 seniors every day."
    },
    {
        name: "Shaksham Foundation",
        logo: "/images/shaksham.png",
        categories: [
            { main: "Vulnerable Groups", sub: "Orphanages" },
            { main: "Vulnerable Groups", sub: "Senior Citizens Care-Old age homes" },
            { main: "Education and Training", sub: "Education and Literacy" }
        ],
        location: "Ahmedabad, India",
        description: "Shaksham Foundation is a leading NGO in Ahmedabad. They are running orphanages in Ahmedabad and old age homes in Ahmedabad. They are also working for education & providing scholarships to students. Shaksham provides support to people in need across India."
    },
    {
        name: "Jagat Bandhu",
        logo: "/images/jagatbandhu.png",
        categories: [
            { main: "Poverty Alleviation", sub: "Poverty Alleviation" },
            { main: "Vulnerable Groups", sub: "Senior Citizens Care-Old age homes" },
            { main: "Poverty Alleviation", sub: "Old clothes distribution" }
        ],
        location: "Dehradun, India",
        description: "They work for poor girl marriage, tiffin service to senior citizens, blood donation camps, roti bank, ration to the poor, disaster management, beti bachao beti padhao, medicine bank, free medical facilities, and free computer education."
    },
    {
        name: "Ram Lal Old Age Home",
        logo: "/images/ramlaloldage.png",
        categories: [
            { main: "Vulnerable Groups", sub: "Senior Citizens Care-Old age homes" }
        ],
        location: "Agra, India",
        description: "RLA is an old-age home in Uttar Pradesh. Ram Lal Ashram & Gaushala Agra are sheltering 400+ sick & destitute old people & 450+ abandoned cows. It is one of the best old age homes in India."
    },
    {
        name: "JAGORANI",
        logo: "/images/jagorani.png",
        categories: [
            { main: "Poverty Alleviation", sub: "Free food distribution" },
            { main: "Poverty Alleviation", sub: "Old clothes distribution" },
            { main: "Vulnerable Groups", sub: "Senior Citizens Care-Old age homes" }
        ],
        location: "Kolkata, India",
        description: "Jagorani is a charity organization in West Bengal. Its charity work includes food distribution, clothing distribution, and environmental protection. They also have an old-age home in Kolkata."
    },
    {
        name: "Neptune Foundation",
        logo: "/images/neptunefoundation.png",
        categories: [
            { main: "Health", sub: "Mental Health" },
            { main: "Vulnerable Groups", sub: "Senior Citizens Care-Old age homes" }
        ],
        location: "Mumbai, India",
        description: "Neptune Foundation is a non-profit mental health organization in Mumbai. They are working in the fields of mental health, old age home, and HIV nutrition."
    },
    {
        name: "Manav Kartavya",
        logo: "/images/manav.png",
        categories: [
            { main: "Poverty Alleviation", sub: "Women welfare" },
            { main: "Vulnerable Groups", sub: "Senior Citizens Care-Old age homes" }
        ],
        location: "Ahmedabad, India",
        description: "Manav Kartavya is an NGO in Ahmedabad, Gujarat, India, working for women empowerment, senior citizen care, and child education in Gujarat, India."
    },
    {
        name: "Badhte Kadam Raipur",
        logo: "/images/badhte.png",
        categories: [
            { main: "Vulnerable Groups", sub: "Senior Citizens Care-Old age homes" }
        ],
        location: "Raipur, India",
        description: "Badhte Kadam is an NGO in Raipur. They are working for old age homes, gaushala, scholarships for students, ambulance services in India, food & cloth donations, blood donations, and eye donations, as well as providing support through microfinance in India."
    }
];

// Route to render the carehomes.ejs template with the dummy data
app.get('/', (req, res) => {
    res.render('carehomes', { careHomes });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});