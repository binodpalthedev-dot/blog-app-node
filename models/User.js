const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    name: {
        type:String,
        required: true,
        trim: true,
    },
    email: {
        type:String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type:String,
        required: true,
        trim: true,
        unique: true
    },
    phone: {
        type:String,
        required: true,
        trim: true,
        unique: true
    },
    favourites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    saved: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog",
      },
    ],
    liked: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog",
      },
    ],
    role: {
        type:String,
        enum: ["admin", "user"],
        default: "user"
    },
    status: {
        type:String,
        enum: ["active", "inactive"],
        default: "active"
    }
},{ timestamps: true });

UserSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    console.log(this.password);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("Users",UserSchema);