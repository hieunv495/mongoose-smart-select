const deepEqualInAnyOrder = require('deep-equal-in-any-order');
var chai = require('chai')
chai.use(deepEqualInAnyOrder);

var assert = chai.assert;
var expect = chai.expect

var mongoose = require('mongoose')
require('../src').setMongoose(mongoose)

var ObjectId = mongoose.Types.ObjectId
var { smartSelect } = require('../src')


var categorySchema = mongoose.Schema({
    name: String
})

categorySchema.virtual('posts', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'category',
    justOne: false
})

var addressSchema = mongoose.Schema({
    city: {
        name: String,
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        }
    },
    street: String
})

var postSchema = mongoose.Schema({
    image: String,
    name: String,
    date: {
        month: Number,
        year: Number,
        time: {
            h: Number,
            m: Number,
            s: Number
        }
    },
    address: addressSchema,
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
        let _id = ObjectId()
        result.push({
            _id,
            image: 'Image ' + (i + 1),
            name: 'Post ' + (i + 1),
            address: {
                street: 'Street ' + i,
                city: {
                    name: 'City ' + i,
                    post: _id
                }
            },
            category: categories[i % 2],
            date: {
                month: i,
                year: i,
                time: {
                    h: i,
                    m: i,
                    s: i
                }
            }
        })
    }
    return result
}

var posts = getPostData()


const findCategory = (id) => {
    return categories.find(c => c._id + '' === id + '')
}

const findPost = (id) => {
    return posts.find(p => p._id + '' === id + '')
}


async function initData() {
    mongoose.connect('mongodb://localhost:27017/mongoosesmartselect')

    await Category.remove({})
    await Post.remove({})

    var i
    for (i = 0; i < 5; i++) {
        await Category.create(categories[i])
    }

    categories = await Category.find({}).lean()

    for (i = 0; i < 10; i++) {
        await Post.create(posts[i])
    }

    posts = await Post.find({}).lean()
}




describe('Test smartSelect', function () {

    it('init db', async () => {
        await initData()
    })

    it('local field: select 1 field', async function () {
        var expected = {
            select: ['name'],
            populate: []
        }
        var data = smartSelect(Post, 'name')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            name: post.name
        })
    })

    it('local field: select 2 field', async function () {
        var expected = {
            select: ['image', 'name'],
            populate: []
        }
        var data = smartSelect(Post, 'image,name')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            image: post.image,
            name: post.name
        })
    })

    it('local field: select 1 field and spreed root', async function () {
        var expected = {
            select: ['_id', '__v', 'name', 'image', 'date', 'address', 'category'],
            populate: []
        }
        var data = smartSelect(Post, 'image,...')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            __v: post.__v,
            image: post.image,
            name: post.name,
            date: post.date,
            address: post.address,
            category: post.category
        })
    })

    it('local object: select field of object field', async function () {
        var expected = {
            select: ['date.month', 'date.year'],
            populate: []
        }
        var data = smartSelect(Post, 'date{month,year}')

        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            date: {
                month: post.date.month,
                year: post.date.year
            }
        })
    })

    it('local object: select field of object field and root spread', async function () {
        var expected = {
            select: ['date.month', 'date.year', '_id', '__v', 'name', 'image', 'address', 'category'],
            populate: []
        }
        var data = smartSelect(Post, 'date{month,year},...')

        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            __v: post.__v,
            date: {
                month: post.date.month,
                year: post.date.year
            },
            name: post.name,
            image: post.image,
            address: post.address,
            category: post.category
        })
    })

    it('local object: select field of object field and spread object field', async function () {
        var expected = {
            select: ['date.month', 'date.year', 'date.time'],
            populate: []
        }
        var data = smartSelect(Post, 'date{month,year,...}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            date: {
                month: post.date.month,
                year: post.date.year,
                time: post.date.time
            }
        })
    })

    it('local object: select field of object field and spread object field and spread root', async function () {
        var expected = {
            select: ['date.month', 'date.year', 'date.time', '_id', '__v', 'name', 'image', 'address', 'category'],
            populate: []
        }
        var data = smartSelect(Post, 'date{month,year,...},...')

        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()

        // console.log(post,post_db)

        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            __v: post.__v,
            date: {
                month: post.date.month,
                year: post.date.year,
                time: post.date.time
            },
            name: post.name,
            image: post.image,
            address: post.address,
            category: post.category
        })
    })

    it('deep local object: select 1 field', async function () {
        var expected = {
            select: ['date.time.h'],
            populate: []
        }
        var data = smartSelect(Post, 'date{time{h}}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            date: {
                time: {
                    h: post.date.time.h
                }
            }
        })
    })

    it('deep local object: select and spread deep child', async function () {
        var expected = {
            select: ['date.time.h', 'date.time.m', 'date.time.s'],
            populate: []
        }
        var data = smartSelect(Post, 'date{time{h,...}}')
        var data1 = smartSelect(Post, 'date{time{}}')

        expect(expected).to.deep.equalInAnyOrder(data)
        expect(expected).to.deep.equalInAnyOrder(data1)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            date: {
                time: {
                    h: post.date.time.h,
                    m: post.date.time.m,
                    s: post.date.time.s
                }
            }
        })
    })

    it('deep local object: select child both 2 level', async function () {
        var expected = {
            select: ['date.month', 'date.time.h'],
            populate: []
        }
        var data = smartSelect(Post, 'date{time{h},month}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            date: {
                month: post.date.month,
                time: {
                    h: post.date.time.h,
                }
            }
        })
    })

    it('related field: select only', async function () {
        var expected = {
            select: ['category'],
            populate: []
        }
        var data = smartSelect(Post, 'category')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            category: post.category
        })
    })

    it('related field: populate all', async function () {
        var expected = {
            select: ['category'],
            populate: [{
                path: 'category',
                select: ['_id', '__v', 'name'],
                populate: []
            }]
        }
        var data = smartSelect(Post, 'category{}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            category: findCategory(post.category)
        })
    })

    it('related field: populate limit', async function () {
        var expected = {
            select: ['category'],
            populate: [{
                path: 'category',
                select: ['name'],
                populate: []
            }]
        }
        var data = smartSelect(Post, 'category{name}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        let category = findCategory(post.category)
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            category: {
                _id: category._id,
                name: category.name
            }
        })
    })

    it('related field: populate > populate', async function () {
        var expected = {
            select: ['address.city.post'],
            populate: [{
                path: 'address.city.post',
                select: ['address.city.post'],
                populate: [{
                    path: 'address.city.post',
                    select: ['name'],
                    populate: []
                }]
            }]
        }
        var data = smartSelect(Post, 'address{city{post{address{city{post{name}}}}}}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        let relatedPost = findPost(post.address.city.post)
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            address: {
                city: {
                    post: {
                        _id: relatedPost._id,
                        address: {
                            city: {
                                post: {
                                    _id: post._id,
                                    name: post.name
                                }
                            }
                        }
                    }
                }
            }
        })
    })

    it('virtual field: populate all', async function () {
        var expected = {
            select: ['posts'],
            populate: [{
                path: 'posts',
                select: ['_id', '__v', 'image', 'name', 'address', 'category', 'date'],
                populate: []
            }]
        }
        var data = smartSelect(Category, 'posts{}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let category = categories[0]
        let category_db = await Category.findById(category._id).select(data.select).populate(data.populate).lean()
        let relatedPosts = posts.filter(p => p.category + '' === category._id + '')
        expect(category_db).to.deep.equalInAnyOrder({
            _id: category._id,
            posts: relatedPosts
        })
    })

    it('virtual field: populate limit', async function () {
        var expected = {
            select: ['posts'],
            populate: [{
                path: 'posts',
                select: ['name'],
                populate: []
            }]
        }
        var data = smartSelect(Category, 'posts{name}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let category = categories[0]
        let category_db = await Category.findById(category._id).select(data.select).populate(data.populate).lean()
        let relatedPosts = posts.filter(p => p.category + '' === category._id + '')
        expect(category_db).to.deep.equalInAnyOrder({
            _id: category._id,
            posts: relatedPosts.map(({_id,name,category}) => ({_id,name,category}) ),
        })
    })

    it('virtual field: populate related > populate virtual', async function () {
        var expected = {
            select: ['category'],
            populate: [{
                path: 'category',
                select: ['posts'],
                populate: [{
                    path: 'posts',
                    select: ['name'],
                    populate: []
                }]
            }]
        }
        var data = smartSelect(Post, 'category{posts{name}}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        let relatedCategory = findCategory(post.category)
        let relatedCategoryPosts = posts.filter(p => p.category + '' === relatedCategory._id + '')
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post_db._id,
            category: {
                _id: relatedCategory._id,
                posts: relatedCategoryPosts.map(({_id,name,category})=>({_id,name,category}))
            }
        })
    })

    // Hiện tại không thể populate trong virtual populate
    // it('virtual field: populate > populate', async function () {
    //     var expected = {
    //         select: ['posts'],
    //         populate: [{
    //             path: 'posts',
    //             select: ['category'],
    //             populate: [{
    //                 path: 'category',
    //                 select: ['name'],
    //                 populate: []
    //             }]
    //         }]
    //     }
    //     var data = smartSelect(Category, 'posts{name,category{}}')
    //     console.log(data.select,data.populate[0].populate[0])
    //     // expect(expected).to.deep.equalInAnyOrder(data)

    //     let category = categories[0]
    //     let category_db = await Category.findById(category._id).select(data.select).populate(data.populate).lean()
    //     let relatedPosts = posts.filter(p => p.category + '' === category._id + '')
    //     console.log(category_db)
    //     console.log(relatedPosts)
    //     expect(category_db).to.deep.equalInAnyOrder({
    //         _id: category._id,
    //         posts: relatedPosts.map(({_id,name,category}) => ({_id,name,category: {_id: category._id,name: category.name}}) ),
    //     })
    // })

    it('schema field: select only', async function () {
        var expected = {
            select: ['address'],
            populate: []
        }
        var data = smartSelect(Post, 'address')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            address: post.address
        })
    })

    it('schema field: select all child', async function () {
        var expected = {
            select: ['address._id', 'address.street','address.city'],
            populate: []
        }
        var data = smartSelect(Post, 'address{}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            address: {
                _id: post.address._id,
                street:  post.address.street,
                city: post.address.city
            }
        })
    })

    it('schema field: select all child 2', async function () {
        var expected = {
            select: ['address.city.name', 'address.city.post'],
            populate: []
        }
        var data = smartSelect(Post, 'address{city{}}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            address: {
                city: {
                    name: post.address.city.name,
                    post: post.address.city.post
                }
            }
        })
    })

    it('schema field: select limit child', async function () {
        var expected = {
            select: ['address.street'],
            populate: []
        }
        var data = smartSelect(Post, 'address{street}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            address: {
                street:  post.address.street
            }
        })
    })

    it('schema field: select limit child 2', async function () {
        var expected = {
            select: ['address.city.name'],
            populate: []
        }
        var data = smartSelect(Post, 'address{city{name}}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            address: {
                city: {
                    name: post.address.city.name
                }
            }
        })
    })

    it('schema field: select and populate related child', async function () {
        var expected = {
            select: ['address.city.post'],
            populate: [{
                path: 'address.city.post',
                select: ['_id','__v','image','name','date','address','category'],
                populate: []
            }]
        }
        var data = smartSelect(Post, 'address{city{post{}}}')
        expect(expected).to.deep.equalInAnyOrder(data)

        let post = posts[0]
        let post_db = await Post.findById(post._id).select(data.select).populate(data.populate).lean()
        expect(post_db).to.deep.equalInAnyOrder({
            _id: post._id,
            address: {
                city: {
                    post: findPost(post.address.city.post)
                }
            }
        })
    })

    it('Disable mongoose connect', async function () {
        mongoose.connection.close()
    })
})