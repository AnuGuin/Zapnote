import  mongoose, {model, Schema} from 'mongoose';

const linkSchema = new Schema ({
    hashedLink : {type: String, required: true},
    userId: {type: mongoose.Types.ObjectId, ref: 'user', required: true}
})

export const Link = model('link', linkSchema);