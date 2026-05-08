require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const tagRoutes = require("./routes/tagRoutes");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");

const frontCategoryRoutes = require("./front-routes/categoryRoutes");
const frontBlogRoutes = require("./front-routes/blogRoutes");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//Routes
app.use("/user", userRoutes);
app.use("/category", categoryRoutes);
app.use("/auth", authRoutes);
app.use("/tag", tagRoutes);
app.use("/blog", blogRoutes);

app.use("/web/categories", frontCategoryRoutes);
app.use("/web/blogs", frontBlogRoutes);
 
//Mongo Db connection
mongoose.connect(process.env.MONGO)
.then(() => console.log(`Mongo is connected`))
.catch((e) => console.log(e.message ||`Mongo is not connected`));

//Server starting...
app.listen(process.env.PORT, (e) => console.log(`Server is connected on PORT ${process.env.PORT}`));