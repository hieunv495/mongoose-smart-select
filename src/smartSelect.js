const getMongoose = require('./mongooseConfig').getMongoose
const getRawSelect = require('./pegjs/getRawSelect.js')

/**
 * @typedef RawField
 * @property {String} name
 * @property {RawSelect} select
 */

/**
 * @typedef RawSelect
 * @property {Boolean} all
 * @property {RawField[]} fields
 */


/**
 * @typedef ParseResult
 * @property {String[]} select 
 * @property {MongoosePopulate[]} populate
 */

/**
 * @typedef MongoosePopulate
 * @property {String} path
 * @property {String[]} select
 * @property {MongoosePopulate[]} populate
 */

/**
 * Get {select,populate} from schema by select data
 * @param {Object} schema Mongoose schema
 * @param {RawSelect} select Raw select after use pegjs parser
 * @return {ParseResult}
 */
const parseSchema = (schema, select) => {
    let { all, fields } = select

    let result = {
        select: [],
        populate: []
    }

    let allPaths = Object.keys(schema.paths)

    if (all) {
        let otherPaths = getOtherChildPaths(allPaths, '', fields.map(({ name }) => name))
        result.select.push(...otherPaths)
    }

    fields.forEach(({ name, select }) => {
        let { select: _select, populate: _populate } = parsePath(schema, allPaths, name, select)
        result.select.push(..._select)
        result.populate.push(..._populate)
    })

    return result
}

/**
 * Get other path at child level not contain declared childName
 * @param {Array} allPaths All path
 * @param {String} parentPath Parent path
 * @param {Array} childNames List names of child paths (example:parentPath=user.address, childNames=[street,city]) 
 * @return {Array} List of other paths
 */
const getOtherChildPaths = (allPaths, parentPath, childNames) => {
    let childNameMap = {}
    childNames.forEach(name => childNameMap[name] = true)
    let parentPathLength = parentPath.split('.').filter(bit => bit).length
    let scopedPaths = allPaths.filter(path => path.startsWith(parentPath)).map(path => path.split('.').slice(0, parentPathLength + 1))
    scopedPaths = scopedPaths.filter(pathBits => pathBits.length > parentPathLength)
    let otherPaths = scopedPaths.filter(pathBits => !childNameMap[pathBits[parentPathLength]]).map(pathBits => pathBits.join('.'))
    otherPaths = [... new Set(otherPaths)]
    return otherPaths
}

/**
 * Parse path
 * @param {Object} schema Mongoose schema
 * @param {String[]} allPaths List of string paths
 * @param {String} path Current path string
 * @param {RawSelect} select Select fields data
 * @return {ParseResult} Select and populate data in mongoose query
 */
const parsePath = (schema, allPaths, path, select) => {

    if (!select) {
        return {
            select: [path],
            populate: []
        }
    }

    let result = {
        select: [],
        populate: []
    }

    if (select.all) {
        let otherPaths = getOtherChildPaths(allPaths, path, select.fields.map(({ name }) => name))
        result.select.push(...otherPaths)
    }

    // Is virtual
    if (schema.virtuals[path]) {

        let field = schema.virtuals[path]
        if (field.options && field.options.ref) {
            let relatedModel
            try {
                relatedModel = getMongoose().model(field.options.ref)
            } catch (e) {
                throw e
            }

            let relatedSchema = relatedModel.schema

            let { select: relatedSelect, populate: relatedPopulate } = parseSchema(relatedSchema, select)

            result.populate.push({
                path,
                select: relatedSelect,
                populate: relatedPopulate
            })

            result.select.push(path)
        }
    }

    // Is related
    else if (schema.paths[path] && schema.paths[path].options.type === getMongoose().Schema.Types.ObjectId) {
        let field = schema.paths[path]
        let relatedModel
        try {
            relatedModel = getMongoose().model(field.options.ref)
        } catch (e) {
            throw e
        }

        let relatedSchema = relatedModel.schema

        let { select: relatedSelect, populate: relatedPopulate } = parseSchema(relatedSchema, select)

        result.populate.push({
            path: path,
            select: relatedSelect,
            populate: relatedPopulate
        })

        result.select.push(path)
    }

    // Is schema
    else if (schema.paths[path] && schema.paths[path].schema) {

        let relatedSchema = schema.paths[path].schema

        let { select: relatedSelect, populate: relatedPopulate } = parseSchema(relatedSchema, select)

        result.populate.push(...relatedPopulate.map(({ path: childPath, select, populate }) => ({
            path: path + '.' + childPath,
            select,
            populate
        })))
        result.select.push(...relatedSelect.map(childPath => path + '.' + childPath))
    }

    // Is local field
    else if (schema.paths[path]) {
        result.select.push(path)
    }
    // Is local Object
    else if (allPaths.find(path => path.startsWith(path))) {

        select.fields.forEach(({ name, select }) => {
            let { select: _select, populate: _populate } = parsePath(schema, allPaths, path + '.' + name, select)
            result.select.push(..._select)
            result.populate.push(..._populate)
        })
    }

    return result
}


/**
 * Get {select,populate} data used for mongoose from smart select text
 * @param {Object} model Mongoose model (exam: User, Post, Category, ...)
 * @param {String} text Smart select text (exam: 'post{image,name,category{name},text}')
 * @return {ParseResult} Select and populate data in mongoose
 */
const smartSelect = (model, text) => {
    if (!text)
        return {
            select: [],
            populate: []
        }
    let selectData
    try {
        selectData = getRawSelect.parse(text)
    } catch (e) {
        throw new Error('Smart select text invalid')
    }
    return parseSchema(model.schema, selectData)
}
module.exports = smartSelect