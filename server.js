const fs = require("fs");
const io = require("./socket-server");
var utils = require("./utils");
const files = require("./files");
var connections = [];
var rooms = {};
let a = "asd";
const Database = require("./database");

var database = new Database(io);
launch();

async function launch(){
  var dbase = await files.read("database.txt");
  database.setDatabase(dbase);
  io.use(function(socket, next) {
  if (
    socket.handshake.query &&
    socket.handshake.query.databaseId &&
    socket.handshake.query.email
  ) {
    var databaseId = socket.handshake.query.databaseId;
    var request = utils.requestSocketConnection(databaseId);
    if (request.satisfied) {
      socket.databaseId = socket.handshake.query.databaseId;
      socket.uniqueId = socket.handshake.query.email;
      socket.myRooms = socket.handshake.query.rooms ? socket.handshake.query.rooms.split(",") : [];
      next();
    } else {
      next(new Error("Negalime patenkinti jūsų prašymo prisijungti"));
    }
  } else {
    next(new Error("Truksta duomenu užmegsti socket ryšį"));
  }
}).on("connection", socket => {
  connections[socket.uniqueId] = socket.databaseId;
    
  if(Array.isArray(socket.myRooms))
  {
    socket.myRooms.forEach(x => {
      socket.join(x, function(){
        var data = database.get(x);
        io.to(x).emit(`dataReceived-${x}`, data, "unset");
      }); // sugrazinami kambarius
      
    })
  }
  console.log("All connections", connections)
  io.clients((error, clients) => {
      if (error) throw error;
      console.log(clients); // => [6em3d4TJP8Et9EMNAAAA, G5p55dHhGgUnLUctAAAB]
});
                                                                                             
  socket.on("disconnect", () => {
    console.log("diconected with", socket.uniqueId);
  });
  
  socket.on("simulateError", a => {
    console.log("clients wants to simulate error");
    console.log(a.length)
  })
  
  socket.on("getDataOn", path => {
      var data = database.get(path);
      socket.emit(`dataReceived-${path}`, data);
      socket.join(path);
      socket.myRooms.push(path);
  });

  socket.on("getDataOnce", path => {
      var data = database.get(path);
      socket.emit(`dataReceived-${path}`, data);
  });

  socket.on("getDataOff", path => {
    if(path === undefined)
    {
      console.log("socket " + socket.uniqueId + " trie to leave undefined room")
    }
   if(Array.isArray(socket.myRooms))
    {
      var index = socket.myRooms.indexOf(path);
      if(index >= 0)
      {
        socket.myRooms.splice(index, 1);
      }
    }
    socket.leave(path);
  
  });

  socket.on("stream", data => {
    console.log(data.index);
    io.to("stream").emit("stream", data);
  })
    
  socket.on("joinStream", () => {
    socket.join("stream")
  })
    
  socket.on("delete", (path, deleteId, source) => {
   
      database.delete(path, source);
      socket.emit(`deleteCallback-${deleteId}`, deleteId);
    
  });
  
  socket.on("getMyListeners", () => {
    var rooms = Object.keys(socket.rooms);
    //rooms === paths === listeners paths
    socket.emit("sendListeners", rooms);
  });

  socket.on("updateDatabase", (updates, options, updateId) => {
      database.update(updates, options);
    socket.emit(`updateCallback-${updateId}`, updateId);
  });
});
  
}


process.on("SIGTERM", function() {
  var data = database.database;
  console.log(data)
  
  utils.writeFile(data);
  process.exit(0);
});

console.log("starteed")