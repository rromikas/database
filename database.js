const files = require("./files");

module.exports = class Database{
  constructor(io){
    this.isSet = false;
    this.database = {
      root: {}
    }
    this.io = io
  }
  
  
  setDatabase(data) {
    Object.assign(this.database, data);
    this.isSet = true;
  }

  getSecretKey(dname) {
    return this.database[dname].secretKey;
  }

  get(path) {
    var paths = path.split("/");
    var current;
    if (paths[0] === "root") {
      current = this.database;
    } else {
      current = this.database["root"];
    }

    if (path === "/") {
      return this.database;
    }
    if (paths.length === 1 || paths[1] === "") {
      return current[paths[0]];
    } else {
      for (var i = 0; i < paths.length; ++i) {
        if (current[paths[i]] == undefined) {
          return undefined;
        } else {
          current = current[paths[i]];
        }
      }
      return current;
    }
  }

  async update(updates, options) {
    if(!updates)
      {
        return;
      }
    
    if(options.delay === 0){
      this.startUpdates(updates, options);
    }
    
    else
    {
      setTimeout(() => {
        this.startUpdates(updates, options);
      }, options.delay * 1000);
    }

    
  }

  delete(paths, source) {
    console.log("Delete paths", paths);
    var path;
    if (typeof paths[Object.keys(paths)[0]] === "string") {
      paths[Object.keys(paths)[0]] = [paths[Object.keys(paths)[0]]];
    }
    paths[Object.keys(paths)[0]].forEach(string => {
      if (Object.keys(paths)[0] !== "root") {
        var current = this.database["root"][Object.keys(paths)[0]];
        path = "root/" + Object.keys(paths)[0];
      } else {
        var current = this.database["root"];
        path = "root";
      }

      var props = string.split("/");
      var myObj = current;
      this.deleteRecursively(path, props, 0, current, source);
      this.sendDataToRoom(path === "root" ? path + "/" : path, myObj, source);
    });
  }
  database(){
    return this.database;
  }
  setIo(i){
    this.io = i;
  }
  updateRecursively(path, props, index, current, updates, string, source) {
  if (index < props.length - 1) {
    var elem = props[index++];
    path += "/" + elem;
    if (typeof current[elem] !== "object") current[elem] = {};
    current = current[elem];
    var obj = current;
    this.updateRecursively(path, props, index, current, updates, string, source);
    this.sendDataToRoom(path, obj, source);
  } else {
    path += "/" + props[props.length - 1];
    current[props[props.length - 1]] = updates[Object.keys(updates)[0]][string];
    current = current[props[props.length - 1]];
    var obj = current;
    if (typeof current === "object" && Object.keys(current).length > 0) {
      this.traverse(current, this.process, path);
    }
    this.sendDataToRoom(path, current, source);
    
  }
}

deleteRecursively(path, props, index, current, source) {
  if (index < props.length - 1) {
    var elem = props[index++];
    path += "/" + elem;
    if (!current[elem]) current[elem] = {};
    current = current[elem];
    var obj = current;
    this.deleteRecursively(path, props, index, current, source);
    this.sendDataToRoom(path, obj, source);
  } else {
    if(Array.isArray(current))
    {
      current.splice(props[props.length - 1], 1);
    }
    
    else
    {
      delete current[props[props.length - 1]];
    }
    
  }
}

process(key, value) {
  console.log(key + " : " + value);
}

traverse(o, func, path) {
  for (var i in o) {
    let localPath = path + "/" + i;
    
    this.sendDataToRoom(localPath, o[i]);
    // func.apply(this, [i, o[i]]);
    if (o[i] !== null && typeof o[i] == "object") {
      //going one step down in the object tree!!
      this.traverse(o[i], func, localPath);
    }
  }
}

async sendDataToRoom(path, data, source) {
  this.io.to(path).emit(`dataReceived-${path}`, data, source);
}
  
startUpdates(updates, options){
    //dbase - name of the database. it is first properties in database object
    var path = "";
    Object.keys(updates[Object.keys(updates)[0]]).forEach(string => {
      if (Object.keys(updates)[0] !== "root") {
        var current = this.database["root"][Object.keys(updates)[0]];
        path = "root/" + Object.keys(updates)[0];
      } else {
        var current = this.database["root"];
        path = "root";
      }

      var props = string.split("/");
      var myObj = current;
      this.updateRecursively(path, props, 0, current, updates, string, options.source);
      this.sendDataToRoom(path === "root" ? path + "/" : path, myObj, options.source);
    });
    files.write(this.database, "database.txt");
}
  
};

