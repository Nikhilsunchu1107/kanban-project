import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
},
{
    timestamps: true, //Automatically adds createdAt and updatedAt fields
});

// This function runs BEFORE a user is saved to the database
userSchema.pre('save', async function (next) {
    // Only hash the password if it's new or has been modified
    if (!this.isModified('password')) {
        return next();
    }

    // Hash the password with a salt round of 10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

export default User;