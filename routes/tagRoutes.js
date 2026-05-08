const express = require("express");
const router = express.Router();
const Tag = require("../models/Tags");

const { authenticate } = require("../middleware/authMiddleware");


router.post("/",authenticate, async (req, res) => {
    try {
        const {name} = req.body;
        if(!name) {
            return res.status(400).json({success: false,message: "Name is required!"})
        }
        const tag = new Tag({name});
        await tag.save();
        return res.status(201).json({success: true, message: "Tag created successfully!"})
    }catch (error) {
        console.log('ERROR',error.message)
    }
});



router.get("/", authenticate, async (req, res) => {
    try {
        const tags = await Tag.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: tags
        });

    } catch (error) {
        console.log(error.message);
    }
});



router.get("/:id", authenticate, async (req, res) => {
    try {
        const tag = await Tag.findById(req.params.id);

        res.status(200).json({
            success: true,
            data: tag
        });

    } catch (error) {
        console.log(error.message);
    }
});



router.put("/:Id", authenticate, async (req, res) => {
    try {
        const {Id} = req.params;
        const {name} = req.body;

        const tag = await Tag.findById(Id);
        if(!tag) {
            return res.status(400).json({success: true,message: "Bad request!"})
        }

        await Tag.findByIdAndUpdate(Id,{
            name
            
        },{
            returnDocument: 'after',
            runValidators: true
        });
        return res.status(200)
            .json({ success: true, message: "Tag has been updated!" });
    } catch (error) {
        console.log(error.message);
    }
});



router.delete("/:Id", authenticate, async (req, res) => {
    try {
        const{Id}= req.params;
        await 
        Tag.findByIdAndDelete(Id);

         return res.status(200).json({
            success: true,
            message: "Tag deleted!"});
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
        const tag = await Tag.findById(Id);
        if(!tag) {
            return res.status(400).json({success: true,message: "Bad request!"})
        }

        await Tag.findByIdAndUpdate(Id,{
            status
        },{
                returnDocument: 'after',
                runValidators: true
            });
        return res.status(200)
            .json({ success: true, message: "Tag has been updated!" });
    } catch (error) {
        console.log(error.message);
    }
});


module.exports = router;