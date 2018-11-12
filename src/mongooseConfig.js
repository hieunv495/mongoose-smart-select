let mongoose = null

module.exports = {
    setMongoose(m) {
        mongoose = m;
    },
    getMongoose() {
        if(!mongoose){
            throw new Error('mongoose-smart-select mongoose is not set, please call setMongoose(mongoose)')
        }
        return mongoose
    }
}