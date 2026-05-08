const express = require("express");
const router = express.Router();
const Category = require("../models/Categories");

router.get("/", async (req, res) => {
    try {
        const categorys = await Category.find({ status: "active" }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: categorys
        });

    } catch (error) {
        console.log(error.message);
    }
});


module.exports = router;