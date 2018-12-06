const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, index:true, required: true, unique: true},
    password: String,
    admin: Boolean,
    name: String,
    affiliation: String,
    title: String,
    phone: String,
    city: String,
    state: String,
    profile: String,
    link: String,
    savedTopics: [Schema.Types.ObjectId],
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema, 'sbir-users');