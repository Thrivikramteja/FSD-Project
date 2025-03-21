const express = require("express");

const router = express.Router();

router.get('/', (req, res) => {
    res.render('landing-page', { nonprofits: nonProfits.nonprofits});
});

router.get('/donate_money', (req, res) => {
    res.render('carehomes/donate_money');
});

router.get('/discover_events', (req, res) => {
    res.render('');
})

module.exports = router;