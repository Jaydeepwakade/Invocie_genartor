const express = require("express");
const router = express.Router();
const bycrypt = require("bcryptjs");
const userModel = require("../models/user.model");
const JWT = require("jsonwebtoken");

router.get("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      res.status(400).json({ error: `user not found` });
    }
    const comparepassword = bycrypt.compareSync(password, user.password);
    console.log(comparepassword);

    if (!comparepassword) {
      return res.status(400).json({ error: `password is incorrect` });
    }

    const token = JWT.sign( 
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      message: `user logged in successfully`,
      token,
      user: {
        ...user._doc,
        password: password,
      },
    });
  } catch (error) {
    res.status(500).json({ error: `Error logging in user: ${error.message}` });
  }
});

router.post("/register", async (req, res) => {
  const { name, email, password, date } = req.body;
  const hashPassword = bycrypt.hashSync(password, 10);
  try {
    const allreadyuser = await userModel.findOne({ email });

    if (allreadyuser) {
      return res.status(400).json({ error: `user already exists` });
    } else {
      const user = await new userModel({
        name, 
        email,
        password: hashPassword,
        date,
      });
      await user.save();
      console.log(user);
      res.status(201).json({ message: `user registered successfully `, user });
    }
  } catch (error) {
    res.status(500).json({ error: `Error registering user: ${error.message}` });
  }
});

module.exports = router;
