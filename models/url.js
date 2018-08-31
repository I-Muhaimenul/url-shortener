const mongoose = require('mongoose')

const urlScheme = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    originalUrl: { type: String, required: true},
    shortUrl: { type: Number,  unique: true, required: true}
})

module.exports = mongoose.model('Url', urlScheme)