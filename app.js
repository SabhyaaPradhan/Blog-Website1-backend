const express = require('express');
const mongoose = require('mongoose');
const { requestLogger, unknownEndpoint, errorHandler } = require('./utils/middleware');
const app = express();
const blogRouter = require('./controllers/blogs');
const userRouter = require('./controllers/users');
const logger = require('./utils/logger');
const config = require('./utils/config');

mongoose.set('strictQuery', true);
mongoose.connect(config.MONGODB_URI)
  .then(() => logger.info('Connected to mongodb'))
  .catch(() => logger.error('Couldn\'t connect to mongodb'));

app.use(express.json());
app.use(requestLogger);

app.get('/', (req, res) => {
  res.end('Welcome to my application');
})

app.use("/api/users", userRouter);
app.use("/api/blogs", blogRouter);
app.use("/blogs/:id", userRouter)
app.use("/:id/like", blogRouter)

app.use(errorHandler);
app.use(unknownEndpoint);
module.exports = app;