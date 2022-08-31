import express from "express";
import ejs from "ejs";
import mongoose, { ObjectId } from "mongoose";
// import { marked } from 'marked';
import { User } from "./db/schemas";
import dotenv from "dotenv";
import api from "./api";
import Cryptr from "cryptr";
import * as argon2 from "argon2";
import cookieParser from "cookie-parser";

dotenv.config();
const bannedIps: string[] = JSON.parse(String(process.env.BANNED_IPS)) as string[];

const app = express();
const cryptr = new Cryptr(`${process.env.SUPER_SECRET}`);

app.set("view engine", "html");
app.engine("html", ejs.renderFile);
app.use("/api", api);
app.use(cookieParser());

mongoose.connect(`${process.env.MDB_URI}`);

app.get("/", async (req: express.Request, res: express.Response) => {
  const user = req.cookies["user"];
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
  try {
    if (user && (await User.findOne({ username: cryptr.decrypt(user) }))) {
			for (const ip of bannedIps) {
				if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
					res.json({ mesage: "you're banned lol" });
					return;
				} else {
					res.render("index", {
        		user: await User.findOne({ username: cryptr.decrypt(user) }),
      		});
				}
			}
    } else {
      res.redirect("/signin");
    }
  } catch (e) {
    if (e.name === "TypeError") {
      return res.redirect("/signin");
    }
  }
});

app.get("/archive", async (req: express.Request, res: express.Response) => {
	const username = req.cookies['user'];
  const user: any = await User.findOne({ username: cryptr.decrypt(username) });
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
	try {
		if (username && user) {
			for (const ip of bannedIps) {
				if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
					return res.json({ mesage: "you're banned lol" });
				} else {
					res.render("archive", { user });
				}
			}
		} else {
			res.redirect("/signin")
		}
	} catch (e) {
		if (e.name === "TypeError") {
			return res.redirect("/signin");
		} else {
			return res.send(e);
		}
	}
});

app.get("/warns", async (req: express.Request, res: express.Response) => {
	const username = req.cookies['user'];
  const user: any = await User.findOne({ username: cryptr.decrypt(username) });
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
	try {
		if (username && user) {
			for (const ip of bannedIps) {
				if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
					return res.json({ mesage: "you're banned lol" });
				} else {
					res.render("warns", { user });
				}
			}
		} else {
			res.redirect("/signin")
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
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
  try {
    if (
      req.cookies["user"] &&
      (await User.findOne({ username: cryptr.decrypt(req.cookies["user"]) }))
    ) {
			for (const ip of bannedIps) {
				if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
					res.json({ mesage: "you're banned lol" });
					return;
				} else {
      		res.redirect("/");
				}
			}
    } else {
			res.render("signin");
    }
  } catch (e) {
    if (e.name === "Error") {
      console.log(e);
    }
  }
});

app.get("/signup", async (req: express.Request, res: express.Response) => {
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
  if (req.cookies["user"]) {
    for (const ip of bannedIps) {
			if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
				res.json({ mesage: "you're banned lol" });
				return;
			} else {
				try {
					cryptr.encrypt(req.cookies["user"]);
				} catch (e) {
					if (e.name === "TypeError") {
						res.cookie("user", "");
					} else {
						res.redirect("/")
					}
				}
			}
		}
  } else {
    for (const ip of bannedIps) {
			if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
				res.json({ mesage: "you're banned lol" });
				return;
			} else {
     		res.render("signup");
			}
		}
  }
});

app.get("/new", async (req: express.Request, res: express.Response) => {
  const user = req.cookies["user"];
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
  if (user) {
		for (const ip of bannedIps) {
			if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
				res.json({ mesage: "you're banned lol" });
				return;
			} else {
     		res.render("new");
			}
		}
  } else {
    for (const ip of bannedIps) {
			if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
				res.json({ mesage: "you're banned lol" });
				return;
			} else {
     		res.redirect("/signin");
			}
		}
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

	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
	
  if (username) {
    if (typeof todo === "undefined") {
			for (const ip of bannedIps) {
				if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
					res.json({ mesage: "you're banned lol" });
					return;
				} else {
     			res.render("error", { err: "Todo not found." });
				}
			}
    } else {
			for (const ip of bannedIps) {
				if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
					res.json({ mesage: "you're banned lol" });
					return;
				} else {
     			res.render("edit", { todo });
				}
			}
    }
  } else {
		for (const ip of bannedIps) {
			if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
				res.json({ mesage: "you're banned lol" });
				return;
			} else {
  			res.redirect("/signin");
			}
		}
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

	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}

  if (username) {
    if (typeof todo === "undefined") {
			for (const ip of bannedIps) {
				if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
					res.json({ mesage: "you're banned lol" });
					return;
				} else {
     			res.render("error", { err: "Todo not found." });
				}
			}
    } else {
			for (const ip of bannedIps) {
				if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
					res.json({ mesage: "you're banned lol" });
					return;
				} else {
     			res.render("view", { todo });
				}
			}
    }
  }
});

app.get("/up", async (req: express.Request, res: express.Response) => {
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}

	res.json({ message: "OK", status: 200 });
});

app.listen(8080, () => {
  console.log("Listening on port 8080");
});
