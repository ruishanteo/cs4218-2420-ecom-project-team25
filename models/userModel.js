import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+\@.+\..+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      match: [/^\d+$/, "Phone number must contain only digits"],
    },
    address: {
      type: {},
      required: true,
      validate: {
        validator: function (value) {
          return value && Object.keys(value).length > 0;
        },
        message: "Address must be a non-empty object",
      },
    },
    answer: {
      type: String,
      required: true,
    },
    role: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("users", userSchema);