

var _ = require('underscore');
var customHelper = require('../../helpers/custom.js');
var fs = require('fs');

module.exports = function() {
    
    /**
     * User Login Api
     * 
     */

	global.app.post('/user/:appId/login', function(req, res) { //for login
        console.log("LOGIN API");
        var appId = req.params.appId;
		var document = req.body.document; //document contains the credentials
		var appKey = req.body.key || req.param('key');
        var userId = req.session.userId || null;
		var sdk = req.body.sdk || "REST";
		global.appService.isMasterKey(appId,appKey).then(function(isMasterKey){
			return global.userService.login(appId, document.username, document.password, customHelper.getAccessList(req),isMasterKey);
		}).then(function(result) {
			//create sessions
			setSession(req, appId, result,res);
			res.json(result);
 		}, function(error) {
			res.status(400).json({
				error: error
			});
		});
        
		global.apiTracker.log(appId,"User / Login", req.url,sdk);
    });
    
    /**
     * User SignUp API
     */

	global.app.post('/user/:appId/signup', function(req, res) { //for user registeration
        console.log("SIGNUP API");
        var appId = req.params.appId;
		var document = req.body.document;
		var appKey = req.body.key || req.param('key');
        var userId = req.session.userId || null;
		var sdk = req.body.sdk || "REST";
		global.appService.isMasterKey(appId,appKey).then(function(isMasterKey){
			return global.userService.signup(appId, document,customHelper.getAccessList(req),isMasterKey);
		}).then(function(result) {
			//Setting the session
			setSession(req, appId, result,res);
			res.json(result);
 		}, function(error) {
			res.status(400).json({
				error: error
			});
		});
		
        global.apiTracker.log(appId,"User / Signup", req.url,sdk);
    });
    
    /**
     * User Logout Api 
     */

	global.app.post('/user/:appId/logout', function(req, res) { //for logging user out
        var appId = req.params.appId || null;
        var userId = req.session.userId || null;
		var sdk = req.body.sdk || "REST";
		if (req.session.loggedIn === true) {
            req.session.userId = null;
            req.session.loggedIn = false;
            req.session.appId = null;
            req.session.email = null;
            req.session.roles = null;
            global.sessionHelper.saveSession(req.session,function(err,reply){
                console.log(reply);
            });
            res.json(req.body.document);
 		} else {
			res.status(400).json({
				"message": "You are not logged in"
			});
		}
        global.apiTracker.log(appId,"User / Logout", req.url,sdk);
    });
    
    /*
    * Change Password.
    */
    
    global.app.put('/user/:appId/changePassword', function(req, res) { //for logging user out
        var appId = req.params.appId || null;
        var userId = req.session.userId || null;
		var sdk = req.body.sdk || "REST";
        var oldPassword = req.body.oldPassword || "";
        var newPassword = req.body.newPassword || "";
        var appKey = req.body.key || "";
        
        if(!oldPassword || oldPassword === ""){
            res.status(400).json({
				"message": "Old Password is required."
			});
        }
        
        if(!newPassword || newPassword === ""){
            res.status(400).json({
				"message": "New Password is required."
			});
        }
        
		if (req.session.loggedIn === false) {
            res.status(400).json({
				"message": "User should be logged in to change the password."
			});
 		} else {
			var userId = req.session.userId;
            
            global.appService.isMasterKey(appId,appKey).then(function(isMasterKey){
                return global.userService.changePassword(appId, userId, oldPassword, newPassword, customHelper.getAccessList(req), isMasterKey)
            }).then(function(result) {
                res.json(result);
            }, function(error) {
                res.json(400, {
                    error: error
                });
            });
            
		}
        global.apiTracker.log(appId,"User / Logout", req.url,sdk);
    }); 
    
    
     /**
     * User Reset Password 
     */
    

	global.app.post('/user/:appId/resetPassword', function(req, res) { 
        var appId = req.params.appId || null;
        var email = req.body.email || null;
		var sdk = req.body.sdk || "REST";
        
        if(!email){
            return res.status(400).json({
				"message": "Email not found."
			});
        }
        
		if (req.session.loggedIn === true) {
            return res.status(400).json({
				"message": "Password cannot be reset because the user is already logged in. Use change password instead."
			});
 		} 
         
        global.userService.resetPassword(appId, email, customHelper.getAccessList(req), true).then(function(result) {
            res.status(200).json({
				"message": "Password reset email sent."
			});
        }, function(error) {
            res.json(400, {
                error: error
            });
        });
		
        global.apiTracker.log(appId,"User / ResetPassword", req.url,sdk);
    });
    
    /**
     * Add To Role Api 
     */

	global.app.put('/user/:appId/addToRole', function(req, res) { //for assigning user to a role
        console.log("ADD TO ROLE API");
        var appId = req.params.appId;
		var user = req.body.user;
		var role = req.body.role;
		var userId = req.session.userId || "";
		var appKey = req.body.key || req.param('key');
		var sdk = req.body.sdk || "REST";
		
		global.appService.isMasterKey(appId,appKey).then(function(isMasterKey){
			return global.userService.addToRole(appId, user._id, role._id, customHelper.getAccessList(req), isMasterKey)
		}).then(function(result) {
			res.json(result);
 		}, function(error) {
			res.json(400, {
				error: error
			});
		});
        global.apiTracker.log(appId,"User / Role / Add", req.url,sdk);
	});   
    
	global.app.put('/user/:appId/removeFromRole', function(req, res, next) { //for removing role from the user
        console.log("REMOVE FROM ROLE API");
        var appId = req.params.appId;
		var user = req.body.user;
		var role = req.body.role;
		var userId = req.session.userId || "";
		var appKey = req.body.key || req.param('key');
		var sdk = req.body.sdk || "REST";


		global.appService.isMasterKey(appId,appKey).then(function(isMasterKey){
			return global.userService.removeFromRole(appId, user._id, role._id, customHelper.getAccessList(req),isMasterKey);
		}).then(function(result) {
			res.json(result);
 		}, function(error) {
			res.status(400).json({
				error: error
			});
		});
        
        global.apiTracker.log(appId,"User / Role / Remove", req.url,sdk);
	});


	/* Private Methods */ 

	function setSession(req, appId, result,res) {
        if(!req.session.id) {
            req.session = {};
            req.session.id = global.uuid.v1();
        }
        res.header('sessionID',req.session.id);		
        
        var obj = {
            id : req.session.id,
            userId : result._id,
            loggedIn : true,
            appId : appId,
            email : result.email,
            roles : _.map(result.roles, function (role) { return role._id })
        };
        
        req.session = obj;
        
        global.sessionHelper.saveSession(obj);
	}
};