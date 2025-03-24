const model = require('../models/userdashboard.model'); 

function getusername(userId)
{
    return new Promise((resolve,reject)=>
    {
        model.getname(userId,(err,data)=>
        {
            if(err)
            {
                reject(err);
            }
            else
            {
                resolve(data);
            }
        });
    });
}

function getParticipatedEvents(userId) {
    return new Promise((resolve, reject) => {
        model.participatedEvents(userId, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function getContributedFundraisers(userId) {
    return new Promise((resolve, reject) => {
        model.contributedFundraisers(userId, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function getOngoingFundraisers(userId) {
    return new Promise((resolve, reject) => {
        model.ongoingfund(userId, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function getUpcomingEvents(userId) {
    return new Promise((resolve, reject) => {
        model.upcomingEvents(userId, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

module.exports = {
    getParticipatedEvents,
    getContributedFundraisers,
    getOngoingFundraisers,
    getUpcomingEvents,
    getusername
};
