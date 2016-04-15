var ProfileDAO = require("../data/profile-dao").ProfileDAO;
var xssFilters = require('xss-filters');//validates input


/* The ProfileHandler must be constructed with a connected db */
function ProfileHandler(db) {
    "use strict";

    var profile = new ProfileDAO(db);

    this.displayProfile = function(req, res, next) {
        var userId = req.session.userId;

        profile.getByUserId(parseInt(userId), function(err, doc) {
            if (err) return next(err);
            doc.userId = userId;
            doc.csrftoken = req.csrfToken();
            return res.render("profile", doc);
        });
    };

    this.handleProfileUpdate = function(req, res, next) {

        var firstName = xssFilters.inHTMLData(req.body.firstName);
        var lastName = xssFilters.inHTMLData(req.body.lastName);
        var ssn = xssFilters.inHTMLData(req.body.ssn);
        var dob = xssFilters.inHTMLData(req.body.dob);
        var address = xssFilters.inHTMLData(req.body.address);
        var bankAcc = xssFilters.inHTMLData(req.body.bankAcc);
        var bankRouting = xssFilters.inHTMLData(req.body.bankRouting);

        var userId = req.session.userId;

        profile.updateUser(
            parseInt(userId),
            firstName,
            lastName,
            ssn,
            dob,
            address,
            bankAcc,
            bankRouting,
            function(err, user) {

                if (err) return next(err);

                // WARN: Applying any sting specific methods here w/o checking type of inputs could lead to DoS by HPP
                //firstName = firstName.trim();
                user.updateSuccess = true;
                user.userId = userId;
                return res.render("profile", user);
            }
        );

    };

}

module.exports = ProfileHandler;
