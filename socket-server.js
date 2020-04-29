var server = require("./express-server").server;
var io = require("socket.io").listen(server);
module.exports = io;
