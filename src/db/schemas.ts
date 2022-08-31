import mongoose from "mongoose";

export type TodoInterface = {
  todoId: string;
  title: string;
  content: string;
  date: string;
};

export type Warn = {
  title: string;
  reason: string;
};

export type UserInterface = {
  username: string;
  password: string;
  ip: string;
  createdOn: string;
  warns: Warn[];
  archive: TodoInterface[];
  todos: TodoInterface[];
};

const UserSchema: mongoose.Schema<UserInterface> = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    maxLength: 30,
  },
  password: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  createdOn: {
    type: String,
    required: true,
  },
  warns: [
    {
      title: {
        type: String,
        required: true,
      },
      reason: {
        type: String,
        required: true,
      },
    },
  ],
  archive: [
    {
      todoId: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      date: {
        type: String,
        required: true,
      },
    },
  ],
  todos: [
    {
      todoId: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
        maxLength: 30,
      },
      content: {
        type: String,
        required: true,
      },
      date: {
        type: String,
        required: true,
      },
    },
  ],
});

export const User = mongoose.model("User", UserSchema);
