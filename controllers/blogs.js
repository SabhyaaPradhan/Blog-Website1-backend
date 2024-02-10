const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");
const { tokenExtractor } = require('../utils/middleware');

blogsRouter.get("/", (req, res) => {
  Blog.find({}).then((blogs) => res.json(blogs));
});

blogsRouter.get("/:id", (req, res, next) => {
  Blog.findById(req.params.id)
    .then((blog) => {
      if (blog) {
        res.json(blog);
      } else {
        res.status(404).end();
      }
    })
    .catch(error => next(error));
});

blogsRouter.post("/", tokenExtractor, async (req, res, next) => {
  const { title, author, url } = req.body;

  if (!title || !author || !url) {
    return res.status(400).json({ message: 'Title, author, and URL are required' });
  }

  try {
    const user = await User.findById(req.user._id);

    const blog = new Blog({
      title: title,
      author: author,
      url: url,
      user: user._id,
    });

    const savedBlog = await blog.save();

    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();

    res.status(201).json(savedBlog);
  } catch (error) {
    next(error);
  }
});

blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndRemove(request.params.id);
  response.status(204).end();
});

blogsRouter.put('/:id', (request, response, next) => {
  const body = request.body;

  const updatedBlog = {
    title: body.title,
    author: body.author,
    url: body.url,
    important: body.important,
  };

  Blog.findByIdAndUpdate(request.params.id, updatedBlog, { new: true })
    .then(updatedBlog => {
      response.json(updatedBlog);
    })
    .catch(error => next(error));
});

  blogsRouter.put('/:id/like', async (req, res) => {
    const { id } = req.params;
  
    try {
      const blog = await Blog.findById(id);
  
      if (!blog) {
        return res.status(404).json({ error: 'Blog not found' });
      }
  
      blog.likes = (blog.likes || 0) + 1;
  
      const updatedBlog = await blog.save();
  
      res.json(updatedBlog);
    } catch (error) {
      console.error('Error liking blog:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });  

module.exports = blogsRouter;