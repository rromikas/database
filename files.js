const fs = require("fs");

module.exports = {
  write: function(obj, file) {
    return new Promise((resolve, reject) => {
      var data = JSON.stringify(obj);
      fs.writeFileSync(file, data);
      
    });
  },
  read: function(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, "utf8", function(er, data) {
        // fs.unlink(file, function(err) {
        //   if (err) throw err;
        //   console.log("File deleted!");
        // });
        resolve(JSON.parse(data));
      });
    });
  },
  
  append: function(string, file){
    fs.appendFileSync('logs.txt', string);
  }
};
