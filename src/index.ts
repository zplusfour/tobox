import express from "express";
import ejs from "ejs";
import mongoose, { ObjectId } from "mongoose";
// import { marked } from 'marked';
import { User } from "./db/schemas";
import dotenv from "dotenv";
import api from "./api";
import Cryptr from "cryptr";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const cryptr = new Cryptr(`${process.env.SUPER_SECRET}`);

app.set("view engine", "html");
app.engine("html", ejs.renderFile);
app.use("/api", api);
app.use(cookieParser());

mongoose.connect(`${process.env.MDB_URI}`);

app.get("/", async (req: express.Request, res: express.Response) => {
  const user = req.cookies["user"];
  try {
    if (user && (await User.findOne({ username: cryptr.decrypt(user) }))) {
      res.render("index", {
        user: await User.findOne({ username: cryptr.decrypt(user) }),
      });
    } else {
      res.redirect("/signin");
    }
  } catch (e) {
    if (e.name === "TypeError") {
      return res.redirect("/signin");
    } else {
      return res.send(e);
    }
  }
});

app.get("/signin", async (req: express.Request, res: express.Response) => {
  try {
    if (
      req.cookies["user"] &&
      (await User.findOne({ username: cryptr.decrypt(req.cookies["user"]) }))
    ) {
      res.redirect("/");
    } else {
      res.render("signin");
    }
  } catch (e) {
    if (e.name === "Error") {
      console.log(e);
    }
  }
});

app.get("/signup", (req: express.Request, res: express.Response) => {
  if (req.cookies["user"]) {
    res.redirect("/");
  } else {
    res.render("signup");
  }
});

app.get("/new", async (req: express.Request, res: express.Response) => {
  const user = req.cookies["user"];
  if (user) {
    res.render("new");
  } else {
    res.redirect("/signin");
  }
});

app.get("/edit/:id", async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const username = req.cookies["user"];
  const user: any = await User.findOne({ username: cryptr.decrypt(username) });
  const todo = user.todos.find(
    (todo: {
      todoId: string;
      title: string;
      content: string;
      date: string;
      _id: ObjectId;
    }) => todo.todoId === id
  );

  if (username) {
    if (typeof todo === "undefined") {
      res.render("error", { err: "Todo not found." });
    } else {
      res.render("edit", { todo });
    }
  } else {
    res.redirect("/signin");
  }
});

app.get("/view/:id", async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const username = req.cookies["user"];
  const user: any = await User.findOne({ username: cryptr.decrypt(username) });
  const todo = user.todos.find(
    (todo: {
      todoId: string;
      title: string;
      content: string;
      date: string;
      _id: ObjectId;
    }) => todo.todoId === id
  );

  if (username) {
    if (typeof todo === "undefined") {
      res.render("error", { err: "Todo not found." });
    } else {
      res.render("view", { todo });
    }
  }
});

app.listen(8080, () => {
  console.log("Listening on port 8080");
});
