const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')

const registerUser = asyncHandler(async (req,res) => {
    const {name, email, password} = req.body
    if(!name || !email || !password){
        res.status(400)
        throw new Error("Please fill all required fields")
    }
    if(password.length < 6){
        res.status(400)
        throw new Error("Password must be at least 6 characters long")
    }
    const userExists = await User.findOne({email: email})
    if(userExists){
        res.status(400)
        throw new Error("Email has already been used")
    }
    const user = await User.create({
        name,
        email,
        password
    })
    if(user){
        const {id, name, email, photo,phone, position} = user
        res.status(201).json({
            id, name, email, photo,phone, position
        })
    } else {
        res.status(400)
        throw new Error("Invalid user data")
    }
})

module.exports = {
    registerUser
}