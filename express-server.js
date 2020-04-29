const express = require("express");
const app = express();
var bodyParser = require("body-parser");
var server = app.listen(8080);

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function(req, res) {
  res.send("hello");
});

module.exports = { server: server };
