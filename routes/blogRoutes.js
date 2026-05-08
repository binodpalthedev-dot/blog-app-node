const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Blog = require("../models/Blog");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================
   CREATE UPLOADS FOLDER
========================= */
const uploadPath = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

/* =========================
   MULTER CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/* =========================
   CREATE BLOG
========================= */
router.post("/", upload.single("image"), authenticate, async (req, res) => {
  try {
    const { title, category, content, tags } = req.body;

    if (!title || !category || !content) {
      return res.status(400).json({
        success: false,
        message: "Title, category and content are required",
      });
    }

    const blog = await Blog.create({
      title,
      category,
      content,
      tags,
      image: req.file ? `/uploads/${req.file.filename}`: null,
    });

    res.status(201).json({
      success: true,
      data: blog,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================
   GET ALL BLOGS
========================= */
router.get("/", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const result = await Blog.aggregate([
      // JOIN CATEGORY
      {
        $lookup: {
          from: "categories", // collection name (MongoDB)
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },

      // convert array → object
      {
        $unwind: {
          path: "$categoryInfo",
          preserveNullAndEmptyArrays: true,
        },
      },

      // CLEAN OUTPUT
      {
        $project: {
          title: 1,
          content: 1,
          status: 1,
          createdAt: 1,
          tags: 1,

          category: {
            _id: "$categoryInfo._id",
            name: "$categoryInfo.name",
          },
        },
      },

      // SORT
      {
        $sort: { createdAt: -1 },
      },

      // PAGINATION
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const blogs = result[0].data;
    const totalBlogs = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalBlogs / limit);

    if (page > totalPages && totalBlogs !== 0) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blog list fetched successfully!",
      pagination: {
        totalBlogs,
        totalPages,
        currentPage: page,
        limit,
      },
      data: blogs,
    });

  } catch (error) {
    console.log("ERROR", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong!",
    });
  }
});

/* =========================
   GET SINGLE BLOG
========================= */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const result = await Blog.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      // JOIN CATEGORY
      {
        $lookup: {
          from: "categories", // collection name (MongoDB)
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },

      // convert array → object
      {
        $unwind: {
          path: "$categoryInfo",
          preserveNullAndEmptyArrays: true,
        },
      },

      // CLEAN OUTPUT
      {
        $project: {
          title: 1,
          content: 1,
          status: 1,
          createdAt: 1,
          tags: 1,
          category: {
            _id: "$categoryInfo._id",
            name: "$categoryInfo.name",
          },
          image: 1
        },
      }
    ]);

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================
   UPDATE BLOG (IMAGE REPLACE)
========================= */
router.put("/:id", upload.single("image"), authenticate, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // 🔥 delete old image if new uploaded
    if (req.file && blog.image?.public_id) {
      const oldImagePath = path.join(uploadPath, blog.image.public_id);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const updatedData = {
      ...req.body,
    };

    if (req.file) {
      updatedData.image = `/uploads/${req.file.filename}`;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Blog updated",
      data: updatedBlog,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================
   DELETE BLOG (IMAGE DELETE)
========================= */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // 🔥 delete image file
    if (blog.image?.public_id) {
      const imagePath = path.join(uploadPath, blog.image.public_id);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================
   LIKE / UNLIKE
========================= */
router.post("/:id/like", authenticate, async (req, res) => {
  try {
    const { userId } = req.body;

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const alreadyLiked = blog.likes.includes(userId);

    if (alreadyLiked) {
      blog.likes = blog.likes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      blog.likes.push(userId);
    }

    await blog.save();

    res.status(200).json({
      success: true,
      message: alreadyLiked ? "Unliked" : "Liked",
      likesCount: blog.likes.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================
   ACTIVE / INACTIVE
========================= */
router.patch("/:Id/status", authenticate, async (req, res) => {
    try {
        const {Id} = req.params;
        const {status} = req.body;

        if(!["active" , "inactive"].includes(status)){
            return res.status(400).json({success: true,message: "Status invalid!"})
        }
        const blog = await Blog.findById(Id);
        if(!blog) {
            return res.status(400).json({success: true,message: "Bad request!"})
        }

        await Blog.findByIdAndUpdate(Id,{
            status
        },{
                returnDocument: 'after',
                runValidators: true
            });
        return res.status(200)
            .json({ success: true, message: "Blog has been updated!" });
    } catch (error) {
        console.log(error.message);
    }
});

module.exports = router;