// server.js
// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const path = require("path");
const ace = path.dirname(require.resolve("ace-builds"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// init sqlite db
const dbFile = "./.data/mods.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE Mods (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, author TEXT, description TEXT, code TEXT)"
    );
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (req, res) => {
  res.send(format({ name: "js-2-mod", description: "turns js into a mod" }));
});

for (let i of require("fs").readdirSync(ace)) {
  app.get("/" + i, (req, res) => {
    res.sendFile(path.join(ace, i));
  });
}

app.get("/mod/:mod", (req, res, next) => {
  if (!req.hasOwnProperty("params")) {
    next();
    return;
  }
  if (!req.params.hasOwnProperty("mod")) {
    next();
    return;
  }
  if (isNaN(req.params.mod)) {
    next();
    return;
  }
  db.get("SELECT * from Mods WHERE id=?", req.params.mod, (err, row) => {
    if (err) {
      res.send(
        format({ name: "js-2-mod", description: "turns js into a mod" })
      );
      return;
    }
    if (!row) {
      res.send(format({ name: "no", description: "this mod doesn't exist" }));
      return;
    }
    res.send(
      format({
        name: row.name,
        description: `${row.description} (by ${row.author})`
      })
    );
  });
});

app.get("/api/:mod", (req, res, next) => {
  if (!req.hasOwnProperty("params")) {
    next();
    return;
  }
  if (!req.params.hasOwnProperty("mod")) {
    next();
    return;
  }
  if (isNaN(req.params.mod)) {
    next();
    return;
  }
  db.get("SELECT * from Mods WHERE id=?", req.params.mod, (err, row) => {
    if (err) {
      res.json({ error: true, message: "Server error!" });
      return;
    }
    if (!row) {
      res.json({ error: true, message: "Mod doesn't exist!" });
      return;
    }
    res.json(row);
  });
});

// endpoint to add a dream to the database
app.post("/new", (req, res) => {
  var data = req.body;

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects
  // so they can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.run(
      `INSERT INTO Mods (name, author, description, code) VALUES (?, ?, ?, ?)`,
      [data.name, data.author, data.description, data.code],
      error => {
        if (error) {
          res.json({ error: true, message: "Server error!" });
        } else {
          db.get("SELECT last_insert_rowid()", (error, data) => {
            if (error) {
              res.json({ error: true, message: "Server error!" });
            } else {
              res.json({ error: false, data: data["last_insert_rowid()"] });
            }
          });
        }
      }
    );
  }
});

function format(obj) {
  return fs
    .readFileSync(`${__dirname}/views/index.html`, "utf-8")
    .replace("$description", obj.description)
    .replace("$name", obj.name);
}

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
