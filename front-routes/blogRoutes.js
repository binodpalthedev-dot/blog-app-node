const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Blog = require("../models/Blog");
const User = require("../models/User");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();
/* =========================
   GET ALL BLOGS
========================= */
router.get("/" ,async (req, res) => {
  try {
    const { cname, search, favourites } = req.query; 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const result = await Blog.aggregate([
      {
        $match: {
          status: "active",
        }
      },

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },

      {
        $unwind: {
          path: "$categoryInfo",
          // preserveNullAndEmptyArrays: true,
        },
      },

      // CATEGORY FILTER
      ...(cname ? [{
        $match: {
          "categoryInfo.name": { $regex: cname, $options: "i" }
        }
      }] : []),

      // TITLE SEARCH
      ...(search ? [{
        $match: {
          title: { $regex: search, $options: "i" }
        }
      }] : []),

      // PROJECT AFTER FILTER
      {
        $project: {
          title: 1,
          content: 1,
          status: 1,
          createdAt: 1,
          tags: 1,
          image: 1,
          category: {
            _id: "$categoryInfo._id",
            name: "$categoryInfo.name",
          },
        },
      },

      { $sort: { createdAt: -1 } },

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
        return res.status(200).json({
            data: [],
            totalPages,
            currentPage: page,
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
router.get("/:id" ,async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Request" });
    }
    const result = await Blog.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          status: "active"
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
          likes: 1,
          saves: 1,
          image: 1,
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
   GET FAVOURITE BLOGS
========================= */
router.get("/favourites/list", authenticate ,async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "Authentication failed!",
        pagination: {
          totalBlogs: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
        data: [],
      });
    }
    const favourites  = user.favourites;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!favourites) {
      return res.status(200).json({
        success: true,
        message: "No favourites provided!",
        pagination: {
          totalBlogs: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
        data: [],
      });
    }

    const favouriteIds = favourites
      .map(id => id)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const result = await Blog.aggregate([
      {
        $match: {
          status: "active",
          category: { $in: favouriteIds },
        },
      },

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },

      {
        $unwind: {
          path: "$categoryInfo",
        },
      },

      {
        $project: {
          title: 1,
          content: 1,
          status: 1,
          createdAt: 1,
          tags: 1,
          image: 1,
          category: {
            _id: "$categoryInfo._id",
            name: "$categoryInfo.name",
          },
        },
      },

      { $sort: { createdAt: -1 } },

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
      return res.status(200).json({
        data: [],
        totalPages,
        currentPage: page,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Favourite blogs fetched successfully!",
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
   GET SAVED BLOGS
========================= */
router.get("/saved/list", authenticate ,async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "Authentication failed!",
        pagination: {
          totalBlogs: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
        data: [],
      });
    }
    const saved  = user.saved;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!saved) {
      return res.status(200).json({
        success: true,
        message: "No saved news!",
        pagination: {
          totalBlogs: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
        data: [],
      });
    }

    const savedIds = saved
      .map(id => id)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const result = await Blog.aggregate([
      {
        $match: {
          status: "active",
          _id: { $in: savedIds },
        },
      },

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },

      {
        $unwind: {
          path: "$categoryInfo",
        },
      },

      {
        $project: {
          title: 1,
          content: 1,
          status: 1,
          createdAt: 1,
          tags: 1,
          image: 1,
          category: {
            _id: "$categoryInfo._id",
            name: "$categoryInfo.name",
          },
        },
      },

      { $sort: { createdAt: -1 } },

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
      return res.status(200).json({
        data: [],
        totalPages,
        currentPage: page,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Favourite blogs fetched successfully!",
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
   GET LIKED BLOGS
========================= */
router.get("/liked/list", authenticate ,async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "Authentication failed!",
        pagination: {
          totalBlogs: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
        data: [],
      });
    }
    const liked  = user.liked;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!liked) {
      return res.status(200).json({
        success: true,
        message: "No liked news!",
        pagination: {
          totalBlogs: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
        data: [],
      });
    }

    const likedIds = liked
      .map(id => id)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const result = await Blog.aggregate([
      {
        $match: {
          status: "active",
          _id: { $in: likedIds },
        },
      },

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },

      {
        $unwind: {
          path: "$categoryInfo",
        },
      },

      {
        $project: {
          title: 1,
          content: 1,
          status: 1,
          createdAt: 1,
          tags: 1,
          image: 1,
          category: {
            _id: "$categoryInfo._id",
            name: "$categoryInfo.name",
          },
        },
      },

      { $sort: { createdAt: -1 } },

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
      return res.status(200).json({
        data: [],
        totalPages,
        currentPage: page,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Favourite blogs fetched successfully!",
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
   GET BLOGS BY TAGS
========================= */
router.get("/tag/:tag/list" ,async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { tag } = req.params

    if (!tag) {
      return res.status(200).json({
        success: true,
        message: "Invalid value!",
        pagination: {
          totalBlogs: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
        data: [],
      });
    }


    const result = await Blog.aggregate([
      {
        $match: {
          status: "active",
          tags: tag,
        },
      },

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },

      {
        $unwind: {
          path: "$categoryInfo",
        },
      },

      {
        $project: {
          title: 1,
          content: 1,
          status: 1,
          createdAt: 1,
          tags: 1,
          image: 1,
          category: {
            _id: "$categoryInfo._id",
            name: "$categoryInfo.name",
          },
        },
      },

      { $sort: { createdAt: -1 } },

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
      return res.status(200).json({
        data: [],
        totalPages,
        currentPage: page,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Favourite blogs fetched successfully!",
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

router.patch("/:blogId/like", authenticate, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { action } = req.body; // "inc" | "dec"

    if (!["inc", "dec"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        $inc: { likes: action === "inc" ? 1 : -1 },
      },
      { returnDocument: 'after' }
    );

    return res.json({
      success: true,
      message: action === "inc" ? "Liked" : "Unliked",
      data: updatedBlog.likes,
    });

  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.patch("/:blogId/save", authenticate, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { action } = req.body; // "inc" | "dec"

    if (!["inc", "dec"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        $inc: { saves: action === "inc" ? 1 : -1 },
      },
      { returnDocument: 'after' }
    );

    return res.json({
      success: true,
      message: action === "inc" ? "Saved" : "Unsaved",
      data: updatedBlog.saves,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;