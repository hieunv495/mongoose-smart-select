var assert = require('assert');
var mongoose = require('mongoose')
var ObjectId = mongoose.Types.ObjectId
var { smartSelect } = require('../src')


var categorySchema = mongoose.Schema({
    name: String
})

categorySchema.virtual('posts', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'category',
    justOne: false
})

var postSchema = mongoose.Schema({
    image: String,
    name: String,
    date: {
        month: Number,
        year: Number
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }
})

var Category = mongoose.model('Category', categorySchema)
var Post = mongoose.model('Post', postSchema)

function getCategoryData() {
    var result = []
    var i
    for (i = 0; i < 5; i++) {
        result.push({
            _id: ObjectId(),
            image: 'Image ' + (i + 1),
            name: 'Category ' + (i + 1)
        })
    }
    return result
}

var categories = getCategoryData()

function getPostData() {
    var result = []
    var i
    for (i = 0; i < 10; i++) {
        result.push({
            _id: ObjectId(),
            name: 'Post ' + (i + 1),
            category: categories[i % 2]
        })
    }
    return result
}

var posts = getPostData()

async function initData() {
    mongoose.connect('mongodb://localhost:27017/mongoosesmartselect')

    var i
    for (i = 0; i < 5; i++) {
        await Category.create(categories[i])
    }

    for (i = 0; i < 10; i++) {
        await Post.create(posts[i])
    }
}


describe('Test function', function () {
    it('should limit local 1 field', function () {
        var expected = {
            select: ['name'],
            populate: []
        }
        var data = smartSelect(Post, 'name')
        assert.deepEqual(data, expected)
    })

    it('should limit local 2 field', function () {
        var expected = {
            select: ['image','name'],
            populate: []
        }
        var data = smartSelect(Post, 'image,name')
        assert.deepEqual(data, expected)
    })

    it('should limit local nestest field', function () {
        var expected = {
            select: ['date.month','date.year'],
            populate: []
        }
        var data = smartSelect(Post, 'date{month,year}')
        assert.deepEqual(data, expected)
    })
})