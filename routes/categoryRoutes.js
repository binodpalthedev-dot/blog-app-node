const express = require("express");
const router = express.Router();
const Category = require("../models/Categories");

const { authenticate } = require("../middleware/authMiddleware");


router.post("/",authenticate, async (req, res) => {
    try {
        const {name} = req.body;
        if(!name) {
            return res.status(400).json({success: false,message: "Name is required!"})
        }
        const category = new Category({name});
        await category.save();
        return res.status(201).json({success: true, message: "Category created successfully!"})
    }catch (error) {
        console.log('ERROR',error.message)
    }
});



router.get("/", authenticate, async (req, res) => {
    try {
        const categorys = await Category.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: categorys
        });

    } catch (error) {
        console.log(error.message);
    }
});



router.get("/:id", authenticate, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        console.log(error.message);
    }
});



router.put("/:Id", authenticate, async (req, res) => {
    try {
        const {Id} = req.params;
        const {name} = req.body;

        const category = await Category.findById(Id);
        if(!category) {
            return res.status(400).json({success: true,message: "Bad request!"})
        }

        await Category.findByIdAndUpdate(Id,{
            name
            
        },{
            returnDocument: 'after',
            runValidators: true
        });
        return res.status(200)
            .json({ success: true, message: "Category has been updated!" });
    } catch (error) {
        console.log(error.message);
    }
});



router.delete("/:Id", authenticate, async (req, res) => {
    try {
        const{Id}= req.params;
        await 
        Category.findByIdAndDelete(Id);

         return res.status(200).json({
            success: true,
            message: "Category deleted!"});
          } catch (error) {
        console.log(error.message);
    }
});

router.patch("/:Id/status", authenticate, async (req, res) => {
    try {
        const {Id} = req.params;
        const {status} = req.body;

        if(!["active" , "inactive"].includes(status)){
            return res.status(400).json({success: true,message: "Status invalid!"})
        }
        const category = await Category.findById(Id);
        if(!category) {
            return res.status(400).json({success: true,message: "Bad request!"})
        }

        await Category.findByIdAndUpdate(Id,{
            status
        },{
                returnDocument: 'after',
                runValidators: true
            });
        return res.status(200)
            .json({ success: true, message: "Category has been updated!" });
    } catch (error) {
        console.log(error.message);
    }
});


module.exports = router;