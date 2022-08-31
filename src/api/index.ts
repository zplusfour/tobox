import express from "express";
import Cryptr from "cryptr";
import * as argon2 from "argon2";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { TodoInterface, User } from "../db/schemas";
import rateLimit from "express-rate-limit";

dotenv.config();

const router = express.Router();
const cryptr = new Cryptr(`${process.env.SUPER_SECRET}`);
const bannedIps: string[] = JSON.parse(String(process.env.BANNED_IPS)) as string[];

const apiLimiter = rateLimit({
  windowMs: 16 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(apiLimiter);
router.use(express.json());
router.use(express.urlencoded({ extended: false }));
router.use(cookieParser());

const isEmpty = (str: any) => {
  return str.length === 0 || str == " " || /^\s*$/.test(str);
};

router.get("/", (_req: express.Request, res: express.Response) => {
  res.send("no");
});

router.get("/archive", (_req: express.Request, res: express.Response) => {
	res.send("no");
});

router.get("/archive/:id", async (req: express.Request, res: express.Response) => {
	const { id } = req.params;
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
  if (req.cookies["user"]) {
    try {
      const user = await User.findOne({
        username: cryptr.decrypt(req.cookies["user"]),
      });
      if (user) {
				const todo = user.todos.filter((todo) => todo.todoId === id);
        const todos = user.todos.filter((todo) => todo.todoId !== id);
        user.todos = todos;
				user.archive.push(todo[0]);
        await user.save();
        res.redirect("/");
      } else {
        res.redirect("/signin");
      }
    } catch (e) {
      if (e.name === "TypeError") {
        return res.redirect("/signin");
      }
    }
  } else {
    return res.redirect("/signin");
  }
});

router.get("/unarchive/:id", async (req: express.Request, res: express.Response) => {
	const { id } = req.params;
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
  if (req.cookies["user"]) {
    try {
      const user = await User.findOne({
        username: cryptr.decrypt(req.cookies["user"]),
      });
      if (user) {
				const todo = user.archive.filter((todo) => todo.todoId === id)[0];
        const todos = user.archive.filter((todo) => todo.todoId !== id);
        user.archive = todos;
				user.todos.push(todo);
        await user.save();
        res.redirect("/archive");
      } else {
        res.redirect("/signin");
      }
    } catch (e) {
      if (e.name === "TypeError") {
        return res.redirect("/signin");
      }
    }
  } else {
    return res.redirect("/signin");
  }
});

router.post("/signup", async (req: express.Request, res: express.Response) => {
  const { username, password } = req.body;
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
  if (req.body === null) {
    return res.redirect("/signup");
  }

  if (username || password) {
    if (isEmpty(username) || isEmpty(password)) {
      return res.redirect("/signup");
    }
  }

  if (username === "" || password === "") {
    return res.redirect("/signup");
  }

  if (!username || !password) {
    return res.redirect("/signup");
  }

	if (username.includes(" ") || password.includes(" ")) {
		return res.redirect("/signup");
	}

	const specialChars = ["@", ".", ":", ";", ",", "!", "?", "\"", "'", "\\", "/", "|", "*", "&", "=", "<", ">", "?", "\\", "^", "`", "~", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\", "|", "*", "&", "=", "<", ">", "?", "\\"];
	for (const char of specialChars) {
		if (username.includes(char)) {
			return res.redirect("/signup");
		}
	}
	
  const hashedPassword = await argon2.hash(password);
	const hashedIp = await argon2.hash(String(req.headers['x-forwarded-for']));

  if (await User.findOne({ username })) {
    res.json({ message: "Username already exists", status: 400 });
  } else {
    const user = new User({
      username,
      password: hashedPassword,
			ip: hashedIp,
			createdOn: new Date().toLocaleDateString(),
      todos: [
        {
          todoId: uuidv4(),
          title: "Welcome to tobox!",
          content: "# Start editing now!",
          date: new Date().toLocaleDateString(),
        },
      ],
    });

    await user.save();
    res.redirect("/signin");
  }
});

router.post("/signin", async (req: express.Request, res: express.Response) => {
  const { username, password } = req.body;
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
  if (req.body === null) {
    return res.redirect("/signin");
  }

  if (username || password) {
    if (isEmpty(username) || isEmpty(password)) {
      return res.redirect("/signin");
    }
  }

  if (username === "" || password === "") {
    return res.redirect("/signin");
  }

  if (!username || !password) {
    return res.redirect("/signin");
  }

  const user = await User.findOne({ username });
  if (user) {
    if (await argon2.verify(user.password, password)) {
      res.cookie("user", cryptr.encrypt(username));
      res.redirect("/");
    } else {
      res.redirect("/signin");
    }
  } else {
    res.redirect("/signin");
  }
});

router.post("/del/:id", async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
  if (req.cookies["user"]) {
    try {
      const user = await User.findOne({
        username: cryptr.decrypt(req.cookies["user"]),
      });
      if (user) {
        const todos = user.todos.filter((todo) => todo.todoId !== id);
        user.todos = todos;
        await user.save();
        res.redirect("/");
      } else {
        res.redirect("/signin");
      }
    } catch (e) {
      if (e.name === "TypeError") {
        return res.redirect("/signin");
      }
    }
  } else {
    return res.redirect("/signin");
  }
});

router.post("/archive/del/:id", async (req: express.Request, res: express.Response) => {
	const { id } = req.params;
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
  if (req.cookies["user"]) {
    try {
      const user = await User.findOne({
        username: cryptr.decrypt(req.cookies["user"]),
      });
      if (user) {
        const todos = user.archive.filter((todo) => todo.todoId !== id);
        user.archive = todos;
        await user.save();
        res.redirect("/archive");
      } else {
        res.redirect("/signin");
      }
    } catch (e) {
      if (e.name === "TypeError") {
        return res.redirect("/signin");
      }
    }
  } else {
    return res.redirect("/signin");
  }
});

router.post("/new", async (req: express.Request, res: express.Response) => {
  const { title, content } = req.body;
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}
  if (req.body === null) {
    return res.redirect("/new");
  }

  if (typeof title === "undefined" || typeof content === "undefined") {
    return res.redirect("/new");
  }

  if (title || content) {
    if (isEmpty(title) || isEmpty(content)) {
      return res.redirect("/new");
    }
  }

  if (title === "" || content === "") {
    return res.redirect("/new");
  }

  if (!title || !content) {
    return res.redirect("/new");
  }
  if (req.cookies["user"]) {
    try {
      const user = await User.findOne({
        username: cryptr.decrypt(req.cookies["user"]),
      });
      if (user) {
        const todo = {
          todoId: uuidv4(),
          title,
          content,
          date: new Date().toLocaleDateString(),
        };
        user.todos.push(todo);
        await user.save();
        res.redirect("/");
      } else {
        res.redirect("/signin");
      }
    } catch (e) {
      if (e.name === "TypeError") {
        return res.redirect("/signin");
      }
    }
  } else {
    return res.redirect("/signin");
  }
});

router.post(
  "/edit/:id",
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { title, content } = req.body;
		for (const ip of bannedIps) {
			if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
				res.json({ mesage: "you're banned lol" });
				return;
			}
		}
    if (req.body === null) {
      return res.redirect(`/edit/${id}`);
    }

    if (title || content) {
      if (isEmpty(title) || isEmpty(content)) {
        return res.redirect(`/edit/${id}`);
      }
    }

    if (title === "" || content === "") {
      return res.redirect(`/edit/${id}`);
    }

    if (!title || !content) {
      return res.redirect(`/edit/${id}`);
    }

    if (req.cookies["user"]) {
      try {
        const user = await User.findOne({
          username: cryptr.decrypt(req.cookies["user"]),
        });
        if (user) {
          let todo = user.todos.find(
            (todo) => todo.todoId === id
          ) as TodoInterface;
          todo.title = title;
          todo.content = content;
          todo.date = new Date().toLocaleDateString() + " (edited)";
          await user.save();
          res.redirect("/");
        } else {
          res.redirect("/signin");
        }
      } catch (e) {
        if (e.name === "TypeError") {
          return res.redirect("/signin");
        }
      }
    } else {
      return res.redirect("/signin");
    }
  }
);

router.post("/clear-warns", async (req: express.Request, res: express.Response) => {
	for (const ip of bannedIps) {
		if (await argon2.verify(ip, String(req.headers['x-forwarded-for']))) {
			res.json({ mesage: "you're banned lol" });
			return;
		}
	}

	if (req.cookies["user"]) {
    try {
  	  const user = await User.findOne({
  	    username: cryptr.decrypt(req.cookies["user"]),
	    });
      if (user) {
        user.warns = [];
				await user.save();
				res.redirect("/warns");
      } else {
        res.redirect("/signin");
      }
    } catch (e) {
      if (e.name === "TypeError") {
        return res.redirect("/signin");
      }
    }
  } else {
  	return res.redirect("/signin");
  }
});

router.post("/logout", async (req: express.Request, res: express.Response) => {
  const user = req.cookies["user"];
  if (user) {
    res.cookie("user", "");
    res.redirect("/");
  } else {
    res.redirect("/signin");
  }
});

export default router;
