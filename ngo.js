const express = require("express");
const app = express();
const path = require("path");

// Set up EJS and Static Files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

// Sample NGO Data
const ngos = [
    {
        name: "Plan India",
        location: "New Delhi, Delhi",
        description: "Supports vulnerable children and communities in maternal health, hygiene, education, and economic empowerment.",
        image: "/images/ngoplanpic1.png",
        badges: ["FCRA", "80G", "12A"],
        fy: "22-23",
        revenue: "1,74,97,24,808",
        expenses: "1,76,40,79,280"
    },
    {
        name: "Gram Vikas Trust",
        location: "Bharuch, Gujarat",
        description: "Drives socio-economic development with programs in education, WASH, nutrition, health, and disaster relief.",
        image: "/images/gramvikastrustpic2.png",
        badges: ["FCRA", "80G", "12A", "CSR-1"],
        fy: "23-24",
        revenue: "8,14,02,817",
        expenses: "7,93,35,312"
    },
    {
        name: "The Akshaya Patra Foundation",
        location: "Bangalore, Karnataka",
        description: "Runs the world’s largest school meal program, providing nutritious meals to millions of children in India.",
        image: "/images/akshayafoundationpic3.png",
        badges: ["FCRA", "80G", "12A"],
        fy: "23-24",
        revenue: "4,50,00,00,000",
        expenses: "4,20,00,00,000"
    },
    {
        name: "Yuvraj Singh Foundation",
        location: "Gurgaon, Haryana",
        description: "Focuses on cancer treatment, education, and sports initiatives for underprivileged children.",
        image: "/images/yuvrajpic4.png",
        badges: ["FCRA", "80G"],
        fy: "23-24",
        revenue: "10,00,00,000",
        expenses: "9,50,00,000"
    },
    {
        name: "Christel House India",
        location: "Bangalore, Karnataka",
        description: "Empowers underprivileged children with education, healthcare, and life skills.",
        image: "/images/christel.png",
        badges: ["FCRA", "80G", "12A"],
        fy: "22-23",
        revenue: "12,50,00,000",
        expenses: "11,75,00,000"
    },
    {
        name: "Bhumi",
        location: "Chennai, Tamil Nadu",
        description: "One of India’s largest independent youth volunteer non-profits, focused on education and social change.",
        image: "/images/bhumi.png",
        badges: ["FCRA", "80G", "12A", "CSR-1"],
        fy: "23-24",
        revenue: "7,00,00,000",
        expenses: "6,50,00,000"
    },
    {
        name: "PRADAN - Professional Assistance for Development Action",
        location: "New Delhi, Delhi",
        description: "Works on rural development by enabling small farmers and women to achieve economic stability.",
        image: "/images/pradan.png",
        badges: ["FCRA", "80G", "12A"],
        fy: "22-23",
        revenue: "15,00,00,000",
        expenses: "14,00,00,000"
    },
    {
        name: "Delhi Council for Child Welfare",
        location: "New Delhi, Delhi",
        description: "Runs Palna, a home for abandoned children, and works on child healthcare and education.",
        image: "/images/delhicouncil.png",
        badges: ["FCRA", "80G", "12A"],
        fy: "23-24",
        revenue: "8,50,00,000",
        expenses: "8,00,00,000"
    },
    {
        name: "Child Rights and You (CRY)",
        location: "Mumbai, Maharashtra",
        description: "Advocates for child rights in India and runs various programs for education and healthcare.",
        image: "/images/childrights.png",
        badges: ["FCRA", "80G", "12A", "CSR-1"],
        fy: "22-23",
        revenue: "50,00,00,000",
        expenses: "48,00,00,000"
    },
    {
        name: "SNEHA (Society for Nutrition, Education and Health Action)",
        location: "Mumbai, Maharashtra",
        description: "Works on maternal health, child nutrition, and prevention of violence against women and children.",
        image: "/images/sneha.png",
        badges: ["FCRA", "80G", "12A"],
        fy: "23-24",
        revenue: "6,50,00,000",
        expenses: "6,00,00,000"
    },
    {
        name: "Swades Foundation",
        location: "Mumbai, Maharashtra",
        description: "Focuses on rural development through healthcare, education, and livelihood programs.",
        image: "/images/swades.png",
        badges: ["FCRA", "80G", "12A"],
        fy: "22-23",
        revenue: "20,00,00,000",
        expenses: "19,00,00,000"
    },
    {
        name: "Deepalaya",
        location: "New Delhi, Delhi",
        description: "Works in education, health, and vocational training for the underprivileged.",
        image: "/images/deepalaya.png",
        badges: ["FCRA", "80G", "12A", "CSR-1"],
        fy: "23-24",
        revenue: "5,75,00,000",
        expenses: "5,25,00,000"
    }
];

// Routes
app.get("/", (req, res) => {
    res.render("ngo", { ngos });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
