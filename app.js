const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Launching Server at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

///Registered API-1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username ='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    ///created new user
    const createUserQuery = `INSERT INTO 
      user(username,name,password,gender,location)
      VALUES(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
      );`;
    if (password.length > 5) {
      const newUser = await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    ///user already exist
    response.status(400);
    response.send("User already exists");
  }
});

///Login User API-2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT
     *
    FROM
     user
    WHERE 
    username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

///Change NewPassword API-3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT
     *
    FROM
     user
    WHERE 
    username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const verifyPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (verifyPassword) {
      //validPassword
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `UPDATE user SET password='${hashedPassword}' WHERE username = '${username}';`;
        db.run(updatePasswordQuery);
        response.send("Password updated");
      }
    } else {
      ///invalidPassword
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
