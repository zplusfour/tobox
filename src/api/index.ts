import express from "express";
import Cryptr from "cryptr";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import { TodoInterface, User } from "../db/schemas";
const router = express.Router();
const cryptr = new Cryptr("verysecretpasswordxkjwloi2xnrewi");

router.use(express.json());
router.use(express.urlencoded({ extended: false }));
router.use(cookieParser());

router.get("/", (_req: express.Request, res: express.Response) => {
  res.json({ message: "OK", status: 200 });
});

router.post("/signup", async (req: express.Request, res: express.Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.redirect("/signup");
  }
  const enpassword = cryptr.encrypt(password);

  if (await User.findOne({ username })) {
    res.json({ message: "Username already exists", status: 400 });
  } else {
    const user = new User({
      username,
      password: enpassword,
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
  if (!username || !password) {
    res.redirect("/signin");
  }
  const user = await User.findOne({ username });
  if (user) {
    if (cryptr.decrypt(user.password) === password) {
      res.cookie("user", cryptr.encrypt(username));
      res.redirect("/");
    } else {
      res.redirect("/signin");
    }
  } else {
    res.redirect("/signin");
  }
});

router.get("/del/:id", async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
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
});

router.post("/new", async (req: express.Request, res: express.Response) => {
  const { title, content } = req.body;
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
});

router.post(
  "/edit/:id",
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const user = await User.findOne({
      username: cryptr.decrypt(req.cookies["user"]),
    });
    if (user) {
      let todo = user.todos.find((todo) => todo.todoId === id) as TodoInterface;
      todo.title = title;
      todo.content = content;
      todo.date = new Date().toLocaleDateString() + " (edited)";
      await user.save();
      res.redirect("/");
    } else {
      res.redirect("/signin");
    }
  }
);

router.get("/logout", async (req: express.Request, res: express.Response) => {
  const user = req.cookies["user"];
  if (user) {
    res.cookie("user", "");
    res.redirect("/");
  } else {
    res.redirect("/signin");
  }
});

export default router;
