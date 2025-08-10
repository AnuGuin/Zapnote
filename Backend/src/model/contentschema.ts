import  mongoose, {model, Schema} from 'mongoose';

export const contentType = ['image', 'video' , 'article', 'audio']

const contentSchema = new Schema ({
    title: {type: String, required: true},
    link: {type: String, required: true},
    type: {type: String, enum: contentType, required: true},
    tags: [{ type: mongoose.Types.ObjectId, ref: 'tag' }],
    userId:  { type: mongoose.Types.ObjectId, ref: 'user', required: true }
})

export const Content = model('content' , contentSchema);