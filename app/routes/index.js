var SessionHandler = require("./session");
var ProfileHandler = require("./profile");
var BenefitsHandler = require("./benefits");
var ContributionsHandler = require("./contributions");
var AllocationsHandler = require("./allocations");
var ErrorHandler = require("./error").errorHandler;
var csrf = require('csurf');//create token

// This page handles ROUTES. It checks whether a user is logged in, whether
// they're an admin, and sends a user to whichever route they requested.

var exports = function(app, db) {

    "use strict";

    var sessionHandler = new SessionHandler(db);
    var profileHandler = new ProfileHandler(db);
    var benefitsHandler = new BenefitsHandler(db);
    var contributionsHandler = new ContributionsHandler(db);
    var allocationsHandler = new AllocationsHandler(db);

    // Middleware to check if a user is logged in
    var isLoggedIn = sessionHandler.isLoggedInMiddleware;

    var csrfProtection = csrf({ cookie: false });

    // error handler
    app.use(function (err, req, res, next) {
        if (err.code !== 'EBADCSRFTOKEN') return next(err)

        // handle CSRF token errors here
        res.status(403)
        res.send('csrf????')
    });

    // The main page of the app
    app.get("/", sessionHandler.displayWelcomePage);

    // Login form
    app.get("/login", csrfProtection, sessionHandler.displayLoginPage);
    app.post("/login", csrfProtection, sessionHandler.handleLoginRequest);

    // Signup form
    app.get("/signup", csrfProtection, sessionHandler.displaySignupPage);
    app.post("/signup", csrfProtection, sessionHandler.handleSignup);

    // Logout page
    app.get("/logout", sessionHandler.displayLogoutPage);

    // The main page of the app
    // There are two callbacks here. The first checks if the user is logged in 
    // (see session.js 'isLoggedInMiddleware')
    // The req and res is send to this function. If it returns next(),
    // then it sends the req and res to displayWelcomePage.
    // You can add more callbacks! (you could to fix the issue below!
    app.get("/dashboard", isLoggedIn, sessionHandler.displayWelcomePage);

    // Profile page
    app.get("/profile", isLoggedIn, csrfProtection, profileHandler.displayProfile);
    app.post("/profile", isLoggedIn, csrfProtection, profileHandler.handleProfileUpdate);

    // Contributions Page
    app.get("/contributions", isLoggedIn, csrfProtection, contributionsHandler.displayContributions);
    app.post("/contributions", isLoggedIn, csrfProtection, contributionsHandler.handleContributionsUpdate);


    /*************** SECURITY ISSUE ****************
     ** The benefits page is only visible to      **
     ** the administrator. However, is there      **
     ** anything here preventing other users from **
     ** directly accessing the route?             **
     ***********************************************/
    // Benefits Page
    var usersCol = db.collection("users");
    app.get("/benefits", isLoggedIn, function (req, res, next) {
        var userId = req.session.userId;
        usersCol.findOne({
            _id: parseInt(userId)
        }, function (err, user) {
            console.log(user);
            if(user.isAdmin){
                benefitsHandler.displayBenefits(req, res, next);
            }
        });
    });

    app.post("/benefits", isLoggedIn, function(req, res, next) {
        var userId = req.session.userId;
        usersCol.findOne({
            _id: parseInt(userId)
        }, function (err, user) {
            console.log(user);
            if (user.isAdmin) {
                benefitsHandler.updateBenefits(req, res, next);
            }
        });
    });

    // Allocations Page
    app.get("/allocations/:userId", isLoggedIn, function (req, res, next) {
        var userId = parseInt(req.params.userId);
        var userIdSession = parseInt(req.session.userId);
        if(userId === userIdSession) {
            allocationsHandler.displayAllocations(req, res, next);
        }
    });

    // Handle redirect for learning resources link
    app.get("/learn", isLoggedIn, function(req, res, next) {
        // Insecure way to handle redirects by taking redirect url from query string
        return res.redirect(req.query.url);
    });

    // Handle redirect for learning resources link
    app.get("/tutorial", function(req, res, next) {
        return res.render("tutorial/a1");
    });
    app.get("/tutorial/:page", function(req, res, next) {
        return res.render("tutorial/" + req.params.page);
    });

    // Error handling middleware
    app.use(ErrorHandler);
};

module.exports = exports;
