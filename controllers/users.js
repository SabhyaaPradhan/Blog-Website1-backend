const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Blog = require('../models/blog')
const jwt = require('jsonwebtoken');

const userRouter = express.Router();

userRouter.post("/register", async (req, res, next) => {
    const { username, name, password } = req.body;

    if (!username || !name || !password) {
        return res.status(401).json({ message: "Missing username, name, or password." });
    }

    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const user = new User({
            username,
            name,
            passwordHash 
        });

        const savedUser = await user.save();
        res.json(savedUser);
    } catch (error) {
        next(error);
    }
})

userRouter.post("/login", async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(401).json({ message: "Missing username or password." });
    }

    try {
        const user = await User.findOne({ username });

        if (user) {
            if ('passwordHash' in user && user.passwordHash) {
                const samePassword = await bcrypt.compare(password, user.passwordHash);

                if (samePassword) {
                    const userToken = {
                        username: user.username,
                        id: user._id
                    };

                    const signedToken = jwt.sign(userToken, process.env.SECRET);

                    return res.status(200).json({
                        username: user.username,
                        name: user.name,
                        token: signedToken
                    });
                }
            }
        }

        return res.status(401).json({ message: "Username or password is incorrect." });
    } catch (error) {
        next(error);
    }
})

userRouter.get("/", (req, res) => {
    User.find({}).then((users) => res.json(users))
});

userRouter.get('/blogs/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
      const user = await User.findById(id).populate('blogs')
      res.json(user);
    } catch (error) {
      next(error);
    }
});

userRouter.post('/follow/:userId', async (req, res) => {
    const { userId } = req.params;
    const { currentUser } = req.user; // Assuming you have middleware to extract the current user from the request
  
    try {
      const userToFollow = await User.findById(userId);
      if (!userToFollow) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      if (!userToFollow.followers.includes(currentUser._id)) {
        userToFollow.followers.push(currentUser._id);
        await userToFollow.save();
      }
  
      if (!currentUser.following.includes(userId)) {
        currentUser.following.push(userId);
        await currentUser.save();
      }
  
      res.status(200).json({ message: 'User followed successfully' });
    } catch (error) {
      console.error('Error following user:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  userRouter.post('/unfollow/:userId', async (req, res) => {
    const { userId } = req.params;
    const { currentUser } = req.user;
  
    try {
      const userToUnfollow = await User.findById(userId);
      if (!userToUnfollow) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      if (userToUnfollow.followers.includes(currentUser._id)) {
        userToUnfollow.followers = userToUnfollow.followers.filter((id) => id !== currentUser._id);
        await userToUnfollow.save();
      }
  
      if (currentUser.following.includes(userId)) {
        currentUser.following = currentUser.following.filter((id) => id !== userId);
        await currentUser.save();
      }
  
      res.status(200).json({ message: 'User unfollowed successfully' });
    } catch (error) {
      console.error('Error unfollowing user:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  module.exports = userRouter