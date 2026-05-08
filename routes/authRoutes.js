const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { authenticate } = require("../middleware/authMiddleware");

const authRouter = express.Router();

// ============================================
// LOGIN ROUTE
// ============================================

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(400).json({
        success: false,
        message: "Credentials is wrong!"
      });
    }

    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Credentials is wrong!"
      });
    }

    const token = jwt.sign(
      {
        id: userData._id,
        username: userData.name,
        role: userData.role,
        favourites: userData.favourites,
        saved: userData.saved,
        liked: userData.liked,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    if (userData.role === 'admin') {
      res.cookie("adminToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 1000
      });
    } else {
      res.cookie("userToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 1000
      });
    }

    const user = userData.toObject();
    delete user.password;

    return res.status(200).json({
      success: true,
      message: "Logged In Successful!",
      userData: user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something wrong!"
    });
  }
});

// ============================================
// ADMIN PROFILE ROUTE - ADMIN ONLY
// ============================================
authRouter.get("/admin/profile/me", authenticate, async (req, res) => {
  try {
    // req.admin check karo
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: "Admin access only!"
      });
    }

    const user = await User.findById(req.admin.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found!"
      });
    }

    const userData = user.toObject();
    delete userData.password;

    return res.status(200).json({
      success: true,
      message: "Admin profile fetched successfully!",
      data: userData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something wrong!"
    });
  }
});

// ============================================
// USER PROFILE ROUTE - USER ONLY
// ============================================
authRouter.get("/user/profile/me", authenticate, async (req, res) => {
  try {
    // console.log("req.user:", req.user);
    // console.log("req.admin:", req.admin);

    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: "User access only!"
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!"
      });
    }

    const userData = user.toObject();
    delete userData.password;

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully!",
      data: userData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something wrong!"
    });
  }
});

// ============================================
// REGISTER ROUTE
// ============================================
authRouter.post("/register", async (req, res) => {
  try {

    const { name, email, password, phone } = req.body;

  
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone already exists"
      });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// ============================================
// LOGOUT ROUTE
// ============================================
authRouter.post("/logout", authenticate, async (req, res) => {
  try {
    if (req.admin) {
      res.clearCookie("adminToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
      });
    } else if (req.user) {
      res.clearCookie("userToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged Out Successful!"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something wrong!"
    });
  }
});

module.exports = authRouter;