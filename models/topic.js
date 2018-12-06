const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const TopicSchema = new Schema({
    topicNumber: String,
    title: String,
    agency: String,
    branch: String,
    desc: String,
    overview: String,
    releaseDate: Date,
    openDate: Date,
    closeDate: Date,
    program: String,
    solicitationLink: String,
    listedUsers: [Schema.Types.ObjectId]
});

TopicSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Topic', TopicSchema, 'sbir-topics');