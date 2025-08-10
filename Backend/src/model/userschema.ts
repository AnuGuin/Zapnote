import  {model, Schema} from 'mongoose';

const userSchema = new Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    shareEnabled: { type: Boolean, default: false }
}, { timestamps: true }
) 

export const User = model('user', userSchema);
