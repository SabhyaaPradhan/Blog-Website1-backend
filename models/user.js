const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  passwordHash: String,
  blogs: [
    {
      ref: 'Blog',
      type: mongoose.Schema.Types.ObjectId,
    }
  ]
})

userSchema.set('toJSON', {
    transform: (document, returnedDocument) => {
        returnedDocument.id = returnedDocument._id.toString()

        delete returnedDocument._id
       delete returnedDocument.__v
        delete returnedDocument.passwordHash
    }
})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)