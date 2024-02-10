const { Error: MongooseError, CastError } = require('mongoose');
const logger = require("./logger");
const User = require("../models/user");
const jwt = require('jsonwebtoken');

const requestLogger = (req, res, next) => {
  logger.info("Method: ", req.method);
  logger.info("Path: ", req.path);
  logger.info("Body: ", req.body);

  next();
};

const unknownEndpoint = (req, res, next) => {
  res.status(404).send({ message: "Unknown endpoint" });
};

const errorHandler = (error, req, res, next) => {
  logger.error(error.name);

  if (error instanceof CastError) {
    res.status(400).send({ message: "Send a valid id" });
  } else if (error instanceof MongooseError) {
    res.status(400).send({ message: "Can't connect to Mongoose" });
  } else if (error.name === 'JsonWebTokenError') {
    res.status(401).send({ message: "Invalid token" });
  }

  next(error);
};

const getTokenFrom = req => {
  const authorization = req.get("Authorization");

  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }

  return null;
};

const tokenExtractor = async (req, res, next) => {
  const token = getTokenFrom(req);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);

    if (!decodedToken.id) {
      throw new Error("Invalid token");
    }

    const user = await User.findById(decodedToken.id);

    if (!user) {
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ message: error.message });
  }
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor
};