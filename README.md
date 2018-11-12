# MONGOOSE SMART SELECT

Mongoose smart select mongoose property tool

# Install

**ES6 or later required**

```
npm install mongoose-smart-select
```

**Then in your project**

```js
var mongoose = require('mongoose')
require('mongoose-smart-select').setMongoose(mongoose)
```

# Ussage

```js
const {smartSelect} = require('mongoose-smart-select')
const Post = require('mongoose').model('Post')

let {select,populate} = smartSelect(Post, 'image,name,category{slug,name}')
let posts = Post.find({}).select(select).pupulate(populate)
```

# Features

## With mongoose model:
```js

let categorySchema = mongoose.Schema({
    name: String
})
categorySchema.virtual('posts',{
    ref: 'Post',
    localField: '_id',
    foreignField: 'category',
    justOne: false
})

let dateSchema = mongoose.Schema({
    month: Number,
    year: Number
})

let postSchema = mongoose.Schema({
    name: String,
    address: {
        city: String,
        street: String,
        location: {
            lat: Number,
            lng: Number
        }
    },
    date: dateSchema,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }
})



let Post = mongoose.model('Post',postSchema)
let Category = mongoose.model('Category',categorySchema)
```
## Limit field select

```js
smartSelect(Post,'name') // Select name only
smartSelect(Post,'address{location{lat}}') // Select post.address.location.lat
smartSelect(Post,'date{year}') // Select post.date.year
```

## Populate related
```js
smartSelect(Post,'category{}') // Select all field of category
smartSelect(Post,'category{name}') // Select post.category.name only
smartSelect(Post,'...,category{name}') // Select all field of post and  name of category
```

## Populate virtuals

```js
smartSelect(Category,'posts{name}') // Select category.posts.name with category.posts is virtual field
```

## Select all
```js
smartSelect('...,category{}')
== smartSelect('category{},...')
== smartSelect('category{...},...') // Select all other fields
```

# History


# License
[MIT](LICENSE)