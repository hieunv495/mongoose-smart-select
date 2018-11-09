let mongoose = require('mongoose')

let categorySchema = mongoose.Schema({
    name: String
})

categorySchema.virtual('posts',{
    ref: 'Post',
    localField: '_id',
    foreignField: 'category',
    justOne: 'false'
})

let dateSchema = mongoose.Schema({
    year: Number,
    month: Number
})

let postSchema = mongoose.Schema({
    name1: String,
    name2: {
        type: String,
        required: true
    },
    date1: {
        year: Number,
        month: Number,
        time: {
            h: Number,
            m: Number,
            s: Number
        }
    },
    date2: dateSchema,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }
})

postSchema.virtual('')

console.log(postSchema.paths)
// console.log(categorySchema.virtuals)