const database = require("./database");
var jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");
var should = require("chai").should();
var nanoid = require("nanoid");
const files = require("./files");
module.exports = {
  loginRequest: function(req) {
    var answer = {};
    var email = req.body.authDetails.email;
    var password = req.body.authDetails.password;
    if (database.get("users/" + email + "/password") === password) {
      var databaseId = database.get("users/" + email + "/databaseId");
      answer = { databaseId: databaseId, satisfied: true };
    } else {
      answer = { databaseId: "", satisfied: false };
    }
    return answer;
  },

  registrationRequest: function(req) {
    var email = req.body.authDetails.email;
    email.should.be.a("string");
    var updates = {};
    updates["root"] = {};
    updates["root"]["users/" + email] = req.body.authDetails;
    database.update(updates);
    var token = jwt.sign({ email }, process.env.SECRET_KEY || "asdasdasd", {
      expiresIn: "1h"
    });
    return token;
  },
  sendEmailVerificationLinkViaEmail: function(email, token) {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.email,
        pass: process.env.slaptazodis
      }
    });

    var mailOptions = {
      from: "Thunderbase<no-reply@thudnerbase.com>",
      to: email,
      subject: "Confirm your account on thunderbase",
      html:
        "<h1>Your authentication link</h1><a href='http://localhost:3000/authentication/" +
        token +
        "'>cia cia cia</a>"
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("email sent");
      }
    });
  },
  verfiyAccountRequest: function(req) {
    var token = req.body.token;
    should.exist(token);
    jwt.verify(token, process.env.SECRET_KEY || "asdasdasd", function(
      err,
      decoded
    ) {
      if (err) {
        return { satisfied: false };
      } else {
        //Jei pavyko dekoduoti, vadinais tokenas buvo geras
        var updates = {};
        updates["root"] = {};
        updates["root"]["users/" + decoded.email + "/emailVerified"] = true;
        var dbaseId = nanoid();
        updates["root"]["users/" + decoded.email + "/databaseId"] = dbaseId;
        updates["root"][dbaseId] = { database: { ready: { to: "use" } } };
        database.update(updates);
        return { satisfied: true };
      }
    });
  },
  requestSocketConnection: function(token) {
    return { satisfied: true };
  },

  removeAllListenersFromSocket: function(socket) {
    socket.removeAllListeners("getDataOn");
    socket.removeAllListeners("updateDatabase");
    socket.removeAllListeners("getDataOnce");
    socket.removeAllListeners("dataReceived");
  },
  
  writeFile: function(obj) {
  
    files.write(obj, "database.txt");
  }
  
 
};
