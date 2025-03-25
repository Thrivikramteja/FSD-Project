const express = require("express");
const app = express();
const path = require("path");

// Middleware to serve static files (CSS, Images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// added new below
app.get('/donate/:name', (req, res) => {
    const nonprofitName = req.params.name;
    res.render('donate', { nonprofitName });
});


// Sample nonprofit data
const nonprofits = [
    {
        name: "Akshaya Trust",
        image: "akshayapic1.png",
        tags: ["#Elderly Care"],
        amountRaised: 8315247,
        supporters: 7489,
        description: "“Grow old gracefully” goes an old saying. But growing old is quite painful for many in the modern society. In many lower middle class and poor families, taking care of old people is becoming a major issue day by day. As a result, many senior citizens, who spent their entire life to bring up their children to give them better status in life, are seen as a burden to the family and are forced to search for new home.   Motivated by the selfless service, many individuals and groups visit Akshaya regularly, support the Trust with donations and also spend time with the inmates entertaining them with music, games, bhajans and general conversations. Many people offer donations during their special days such as birthday, wedding day and memorial days of their relatives. Many families even come and celebrate their special days with the inmates."
    },
    {
        name: "Share and Care Children's Welfare Society",
        image: "shareandcarepic2.png",
        tags: ["#Healthcare", "#Education", "Children", "Hunger & Homelessness"],
        amountRaised: 22552648.83,
        supporters: 16631,
        description: "Share and Care Children’s Welfare Society is serving the needy children since 1984.The main objective is to impart education freely to the underprivileged, orphan children, girl, physically challenged people and children belonging to scheduled caste and tribes in remote villages.  We run a crèche,a primary and a high school and impart free education to 200 children. Our School is recognized by the government of Tamilnadu, but not aided. Due to financial constraints, we are unable to pay our teachers and needs of the children are not being met as we wish. Since these children are from poor families they need support for their betterment in this competitive world. "
    },
    {
        name: "Social Activities Integration",
        image: "socialintegrationpic3.png",
        tags: ["#Women Empowerment", "Healthcare"],
        amountRaised: 6283400,
        supporters: 5740,
        description: "Social Activities Integration-SAI is constantly working for Upliftment and making bright future of the deprived, marginalized and underprivileged children of Sex Workers for nation building activities.  The children of Sex Workers residing in the Red Light Areas like Kamathipura & Falkland, where the profession of prostitution of their mothers  is highly vulnerable of life threatening due to dreaded diseases and possibility of physical assault because persons from all tags and every walks of life"
    },

    {
        name: "Humanity Welfare Organisation Helpline",
        image: "humanwelfarepic4.png",
        tags: ["#Differently Abled"],
        amountRaised: 563703,
        supporters: 452,
        description: "Humanity Welfare Organisation Helpline is a non-profit organization 2003, registered with the Registrar of Societies, Government of Jammu and Kashmir, under J&K State Societies Registration Act-VI of 1998(1941A.D) vide Registration No.4346-S of 2003, soon after the revocation of article 370, the Organization was re-registered under Registrar of societies act 1860 under Registration Number 7425-s-2003 24-12-2021. The Organization is also registered under section 12AA and 80G with the Department of Income Tax Government of India and Foreign Contribution (Regulation) Act, 2010, (FCRA) Ministry of Home Affairs, Government of India. Our unique ID on the Government of India NGO Portal is JK/2010/0029655. The Humanity Welfare Organisation Helpline is also registered with the Department of Social Welfare"
    },


    {
        name: "Bhartiye Netraheen Kalyan Parishad",
        image: "bhartiyekalyanpic5.png",
        tags: ["#Differently Abled"],
        amountRaised: 634515,
        supporters: 379,
        description: "Bhartiya Netraheen Kalyan Parishad is a registered NGO. for the all-around development of visually impaired boys & girls. This NGO has helped visually impaired people for a long time. Bhartiya Netraheen Kalyan Parishad is a registered NGO. It came into existence on 28 February 1996 with its registration under Societies Registration Act. Right from its inception, it has been working perenially and unhindered for the holistic and all-round development of persons with special needs, especially the visually impaired. We have set up a goal of making every person with special needs self-reliant and instilling in him/her a feeling of self-dignity, pride, and aplomb so that all of them can be capable of associating themselves with the national mainstream and they can contribute to the development of the nation. Education is the pivot around which the development of a country takes place. In other words, we can say that it is education alone based on which the human development index of a country depends. So, in this direction, we are making significant efforts. Our Parishad is undertaking a residential bridge course for visually impaired children under the age group 6-14 years. It is being done in collaboration with Bihar Shiksha Pariyojana under SSA. These centers for residential bridge courses are located in Bhagalpur, Shekhpura, Lakhisarai, and Begusarai districts of Bihar. These children are getting education in life skills, elementary academics, mobility instruction, and daily life experiences. Our main motto is to include these children in social life after this basic instruction so that they can have the feeling of being an integral part of society. In the hostel, BNKPRI is also running a library for the visually impaired. This library has brail books on various subjects and audio CDs. Every year BNKPRI organizes a plethora of events like marriages of visually challenged couples, Hellen Keller Day, White Cane Day, World Disability Day, Kavi Sammelan, Dance Program of the visually challenged, etc."
    },
    {
        name: "Brave Souls Foundation",
        image: "bravesoulspic6.png",
        tags: ["#Education", "Women Empowerment"],
        amountRaised: 958725,
        supporters: 625,
        description: "The Brave Souls Foundation is a non-profit organisation established and led by acid attack survivors. It represents a collective of social activists, lawyers, researchers, and individuals driven to prevent acid attacks, combat gender-based violence, and improve the welfare of survivors.Within the last two years, it has successfully facilitated over 200 reconstructive surgeries for survivors, ensured compensation for more than 150 individuals affected by acid attacks, and achieved a record of pursuing over 50 cases without a single acquittal of the perpetrators.  "
    },
    {
        name: "Maitri",
        image: "maitrioic7.png",
        tags: ["#Healthcare", "Elderly Care"],
        amountRaised: 1827530,
        supporters: 1534,
        description: "The organization was founded in 2005 by Lt. Gen. (Retd.) Bhopinder Singh and Mrs. Winnie Singh with the goal of spreading awareness on essential health affecting information among members of India’s uniformed services and their families. This included sexually transmitted infections (STIs), tuberculosis and HIV/AIDs. Since then, Maitri soon expanded its work to include education and sensitization to end violence against women as well as citizenship rights and health issues concerning migrant populations."
    },
    {
        name: "Sevalaya",
        image: "sevalayapic8.png",
        tags: ["#Education", "Children", "Elderly Care"],
        amountRaised: 3578421,
        supporters: 2985,
        description: "Sevalaya is a registered charitable Trust headquartered in Chennai. Sevalaya has stepped into its 36th year, the impact of our work and partnership with Corporates, Foundations and High network individuals has now spread to 27 locations across nine districts in Tamilnadu reflecting the growth momentum. The ranges of services offered have also diversified, impacting the lives of many lakhs of lives.  Our core areas of work are 1. Education, 2. Health Care, 3. Rural Development and 4. Food & Shelter. We run free School – Primary up to 12th std, Community Colleges, Tuition Centre, Medical Centres, Mobile Medical Services, Home for the Destitute Elders, Home for the Orphan Children, Organic Farming and Gaushala Cow Shelter. We also respond on a war footing during emergencies and crisis situations.  "
    },
    {
        name: "Blind Welfare Society",
        image: "blindpic9.png",
        tags: ["#Differently Abled", "Education"],
        amountRaised: 785123,
        supporters: 642,
        description: "Blind Welfare Society is a registered non-government voluntary Organization. It was founded to undertake various projects in the field of Education, Employment, Training, and Rehabilitation for people with visual challenges. Since inception, Blind Welfare Society meaningful initiatives have bagged various accolades in its shelf."
    },
    {
        name: "Subhansh Sewa Trust",
        image: "subhanshpic10.png",
        tags: ["#Healthcare", "Hunger & Homelessness"],
        amountRaised: 912345,
        supporters: 789,
        description: "SUBHANSH SEWA TRUST is a service-oriented voluntary organization that has been creating a difference in the lives of downtrodden and less fortunate people over the last few years decades. The organization's main objective is to reach out to the needy and destitute people in rural areas and support them in the medical, education and social development areas. And for this, we have around 500+ volunteers at the national level."
    },
    {
        name: "Vidya Poshak",
        image: "vidyapic11.png",
        tags: ["#Education", "Scholarships"],
        amountRaised: 2754901,
        supporters: 2150,
        description: "Students who belong to economically disadvantaged families have limited opportunities when it comes to a career because there are few financial resources and education is of low quality. Realising this, Vidya Poshak, established in 2001, intervened to help to create a bright future for thousands of students."
    },
    {
        name: "Vardhishnu Social Research & Development Society",
        image: "vardhishnupic12.png",
        tags: ["#Education", "Women Empowerment"],
        amountRaised: 1345780,
        supporters: 1104,
        description: "Vardhishnu – Social Research & Development Society is Jalgaon based not-for-profit organization, trying to provide a safe, secure and happy childhood to street children specially child waste pickers and child labors. Waste picking ranks lowest in the hierarchy of urban informal occupations and a large number of those employed in this occupation are women and children. Illiterate, unskilled persons, migrants, those lowest in the caste hierarchy and the poorest of the poor, predominantly work as waste pickers, as they are unable to find any other kind of employment. According to Census 2011, there are 4.5 million child-laborers between the age of 5-14 in India . 1/3rd of these children work as waste pickers. These children often live on the street and earn a livelihood to support their families and in the process become vulnerable to exploitation by others and to a variety of physical and moral dangers."
    },
    {
        name: "The Akshaya Patra Foundation",
        image: "akshayapatrapic13.png",
        tags: ["#Hunger & Homelessness", "Education"],
        amountRaised: 14587214,
        supporters: 9874,
        description: "The Akshaya Patra Foundation, for 20 years, has been a purveyor of the Mid-Day Meal Programme (MDM) supporting government school students in India with a hot nutritious lunch every school day, encouraging underprivileged children to remain enroled and complete their secondary education. At its core, the Foundation aims at countering malnutrition while supporting the right to education of socio-economically disadvantaged children. The midday meal or breakfast served in schools serves as an incentive for children to attend school and for parents to send their children to school. Resulting in an improved enrolment rate in government schools, regular attendance, enhanced performance and nutritional profile of the children, while reducing the dropout rate. "
    },
    {
        name: "Delhi Council for Child Welfare",
        image: "delhipic14.png",
        tags: ["#Children", "Healthcare"],
        amountRaised: 4786523,
        supporters: 3654,
        description: "Delhi Council for Child Welfare is a non-governmental organization established in 1952. DCCW first started its work among children who had been displaced, lost or abandoned in the riots surrounding the partition of India, providing them with the much-needed care. Over the decades, the programmes have grown and diversified to cover medical services, nutrition, adoption, vocational training, rehabilitation of physically/ mentally challenged children and non-formal pre-school education to the underprivileged children of Delhi and the surrounding areas. Today, these services reach over 2500 children each day, free of cost. We run our programs in nineteen centres, most of them being in rehabilitation colonies of migrant workers."
    },
    {
        name: "Society for Poor People Development (SPPD)",
        image: "socityforpoorpic15.png",
        tags: ["#Education", "Women Empowerment"],
        amountRaised: 856432,
        supporters: 720,
        description: "SPPD is a Non Profit, Charity and Community Development organization that envisions a secured & sustainable community with focus on developing sections of society that are at risk and most deserving under five thematic areas. Education and skill development focuses on providing Quality education towards wholesome development for the under privileged children and Vocational skill training for rewarding careers to the rural youth. This is aimed at ensuring fundamental rights of the deprived children and youth."
    }
];

// Route to render the featured nonprofit page
app.get("/", (req, res) => {
    res.render("index", { nonprofits });
});

// Route for donation page
app.get("/donate/:donid", (req, res) => {
    const nonprofitName = decodeURIComponent(req.params.donid);

    // Find the nonprofit by name
    const selectedNonprofit = nonprofits.find(n => n.name === nonprofitName);

    if (selectedNonprofit) {
        res.render("donate", { nonprofit: selectedNonprofit });
    } else {
        res.status(404).send("Nonprofit not found");
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
