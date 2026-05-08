const express = require("express");
const User = require("../models/User.js");

const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");

router.post("/", authenticate, async (req, res) => {
  try {

    const { name, email, password, phone, role } = req.body;

  
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
      role
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

router.get("/", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // DATA + COUNT parallel me
    const [users, totalUsers] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      User.countDocuments()
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    // invalid page
    if (page > totalPages && totalUsers !== 0) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
        data: []
      });
    }

    return res.json({
      success: true,
      message: "Users fetched successfully",
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        limit
      },
      data: users
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/:role/byrole", authenticate, async (req, res) => {
  try {
    const { role } = req.params;

    const filter = {};

    // Role filter
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  const user = await User.findById(req.params.id);

  res.json({
    success: true,
    data: user
  });
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const { name, phone, role, status, password } = req.body;

    const updateData = {};

    // Only update if value exists
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    // Password update (only if provided)
    if (password) {
      const bcrypt = require("bcrypt");
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Update
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: "after", runValidators: true }
    );

    return res.json({
      success: true,
      message: "User updated",
      data: updatedUser
    });

  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      success: false,
      message: "Update failed"
    });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "User deleted"
  });
});

router.patch("/:Id/status", authenticate, async (req, res) => {
    try {
        const {Id} = req.params;
        const {status} = req.body;

        if(!["active" , "inactive"].includes(status)){
            return res.status(400).json({success: true,message: "Status invalid!"})
        }
        const user = await User.findById(Id);
        if(!user) {
            return res.status(400).json({success: true,message: "Bad request!"})
        }

        await User.findByIdAndUpdate(Id,{
            status
        },{
                returnDocument: 'after',
                runValidators: true
            });
        return res.status(200)
            .json({ success: true, message: "user has been updated!" });
    } catch (error) {
        console.log(error.message);
    }
});

router.patch("/:Id/favourites", authenticate, async (req, res) => {
  try {
    const { Id } = req.params;
    const { categories } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "categories array required!",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      Id,
      {
        $addToSet: {
          favourites: { $each: categories },
        },
      },
      { returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: "Favourites updated",
      data: updatedUser.favourites,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.patch("/:Id/saved", authenticate, async (req, res) => {
  try {
    const { Id } = req.params;
    const { blogId } = req.body;

    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "blogId required!",
      });
    }

    const user = await User.findById(Id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const isExist = user.saved.includes(blogId);

    const updatedUser = await User.findByIdAndUpdate(
      Id,
      isExist
        ? { $pull: { saved: blogId } } // 
        : { $addToSet: { saved: blogId } }, // 
      { returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: isExist
        ? "Removed from saved"
        : "Saved successfully",
      data: updatedUser.saved,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.patch("/:Id/liked", authenticate, async (req, res) => {
  try {
    const { Id } = req.params;
    const { blogId } = req.body;

    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "blogId required!",
      });
    }

    const user = await User.findById(Id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const isExist = user.liked.includes(blogId);

    const updatedUser = await User.findByIdAndUpdate(
      Id,
      isExist
        ? { $pull: { liked: blogId } } // 
        : { $addToSet: { liked: blogId } }, // 
      { returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: isExist
        ? "Removed from liked"
        : "Saved successfully",
      data: updatedUser.liked,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;