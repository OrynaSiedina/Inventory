const asyncHandler = require('express-async-handler')
const {User, Token} = require('../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const sendEmail = require('../utils/sendemail')
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: "1d"
    })
}
const hashThis = (token) => { return crypto.createHash("sha256").update(token).digest("hex") }

const registerUser = asyncHandler(async (req, res) => {

    const {name, email, password} = req.body

    if (!name || !email || !password) {
        res.status(400)
        throw new Error("Please fill all required fields")
    }

    if (password.length < 6) {
        res.status(400)
        throw new Error("Password must be at least 6 characters long")
    }
    const userExists = await User.findOne({email: email})

    if (userExists) {
        res.status(400)
        throw new Error("User with this email already exists")
    }

    const user = await User.create({
        name,
        email,
        password
    })

    const token = generateToken(user._id)

    res.cookie('token', token, {
        path: '/',
        httpOnly: true,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sameSite: 'none',
        secure: true
    })

    if (user) {
        const {_id, name, email, photo, phone, position} = user
        res.status(201).json({
            _id, name, email, photo, phone, position, token
        })
    } else {
        res.status(400)
        throw new Error("Invalid user data")
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body

    if (!email || !password) {
        res.status(400)
        throw new Error("Please add email and password")
    }
    const user = await User.findOne({email})

    if (!user) {
        res.status(400)
        throw new Error("Invalid email or password")
    }

    passwordIsValid = await bcrypt.compare(password, user.password)
    const {_id, name, photo, phone, position} = user


    if (user && passwordIsValid) {
        const token = generateToken(user._id)
        res.cookie('token', token, {
            path: '/',
            httpOnly: true,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            sameSite: 'none',
            secure: true
        })
        res.status(200).json({
            _id, name, email, photo, phone, position, token
        })
    } else {
        res.status(400)
        throw new Error("Invalid email or password")
    }
})

const logoutUser = asyncHandler(async (req, res) => {
    res.cookie('token', '', {
        path: '/',
        httpOnly: true,
        expires: new Date(Date.now()),
        sameSite: 'none',
        secure: true
    })
    res.status(200).json({
        message: "Successfully logged out"
    })
})

const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password")
    if (user) {
        const {_id, name, email, photo, phone, position} = user
        res.status(200).json({
            _id, name, email, photo, phone, position
        })
    } else {
        res.status(404)
        throw new Error("User not found")
    }
})

const loginStatus = asyncHandler(async (req, res) => {

    const token = req.cookies.token
    if (!token) return res.json(false)

    const verified = jwt.verify(token, process.env.JWT_SECRET)
    if (verified) {
        return res.json(true)
    }

    return res.json(false)
})

const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    if (user) {
        const {name, email, photo, phone, position} = user
        user.email = email
        user.name = req.body.name || name
        user.photo = req.body.photo || photo
        user.phone = req.body.phone || phone
        user.position = req.body.position || position

        const updatedUser = await user.save()

        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            photo: updatedUser.photo,
            phone: updatedUser.phone,
            position: updatedUser.position
        })
    } else {
        res.status(404)
        throw new Error("User not found")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    const {oldPassword, password} = req.body
    if (!user) {
        res.status(404)
        throw new Error("User not found, please sign up")
    }

    if (!oldPassword || !password) {
        res.status(400)
        throw new Error("Please fill all required fields")
    }

    const passwordIsValid = await bcrypt.compare(oldPassword, user.password)
    if (!passwordIsValid) {
        res.status(400)
        throw new Error("Invalid password")
    }

    user.password = password
    await user.save()

    res.status(200).json({
        message: "Password changed successfully"
    })
})

const restorePassword = asyncHandler(async (req, res) => {
    const {email} = req.body
    const user = await User.findOne({email})
    if (!user) {
        res.status(400)
        throw new Error("User does not exist")
    }

    let token = await Token.findOne({userId: user._id})
    if (token) {
        await token.deleteOne()
    }

    let resetToken = crypto.randomBytes(32).toString("hex") + user._id
    const hashedToken = hashThis(resetToken)

    console.log(resetToken)

    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + process.env.RESET_PASS_EXPIRE * 60 * 1000
    }).save()

    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`
    const message = `
    <h2>Hello ${user.name},</br> you have requested a password reset</h2>
    <p>Please go to this link to reset your password</p>
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    <p>Password reset link will expire in ${process.env.RESET_PASS_EXPIRE} minutes</p>
    <p> Best regards, </br> Inventory team</p>
    <p>If you did not request a password reset, please ignore this email</p>`

    const subject = "Password reset request"
    const send_to = user.email
    const sent_from = process.env.EMAIL_USER

    try {
        await sendEmail(subject, message, send_to, sent_from)
        res.status(200).json({
            success: true,
            message: "Reset email sent"
        })
    } catch (error) {
        res.status(500)
        throw new Error(error.message)
    }
})

const resetPassword = asyncHandler(async (req, res) => {

    const {password} = req.body

    const userToken = await Token.findOne({
        token: hashThis(req.params.resetToken),
        expiresAt: {$gt: Date.now()}
    })

    if (!userToken) {
        res.status(404)
        throw new Error("Invalid or expired token")
    }

    const user = await User.findOne({_id: userToken.userId})

    user.password = password
    await user.save()
    await userToken.deleteOne()

    res.status(200).json({
        success: true,
        message: "Password reset successfully"
    })
})

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    restorePassword,
    resetPassword
}