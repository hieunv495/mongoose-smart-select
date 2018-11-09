# MONGOOSE SMART SELECT

Mongoose smart select mongoose property tool

# Install

**ES6 or laster required**

```
npm install mongoose-smart-select
```

In your project

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

## Limit select

```js
'name'
```

## Populate select
```js
'name,cateogy'
```
## Virtual populate select

```js
'posts{name}'
```

## Nestest child deep select

```js
'name,category{name}
```

## Populate only

```js
'...,category{}'
```

# History


# License
[MIT](LICENSE)