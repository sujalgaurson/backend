import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary} from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken
        user.save({validateBeforeSave: false})

        return{accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating token")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    // get user detail from frontend
    // check for validation 
    // check if user already exist : username, email
    // check for images, avatar, coverimage
    // upload them to cloudinary
    // save user to database create user object in db
    // remove password and refreshToken from user object
    // check for user creation
    // send response to frontend 

    const {fullname, email, username, password} = req.body

    console.log("email :", email)
    console.log("password", password)

    if (
        [fullname, email, username, password].some((fields)=> fields?.trim() === "")
    ) {
        throw new ApiError(400 , "All fields are required");
    }
    
    const existedUser = User.findOne({
        $or: [ { username } , { email } ]
    })

    if (existedUser) {
        throw new ApiError(409 , "User already exist with this username or email");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400 , "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400 , "Avatar file is required");
    }

    const user = await User.create({
        fullname,
        email,
        password,
        username: username.toLowerCase(),
        coverImage: coverImage?.url || "",
        avatar: avatar.url
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something is wrong while registering the user");
    }

    return req.status(201).json(
        new ApiResponse(200 , "User registered successfully", createdUser)
    )
})

const loginUser = asyncHandler( async (req,res)=>{
    //req.body => data (taking data from frontend)
    //check for username and email
    // find the user
    //check for password
    //generate token
    //send cookie to frontend

    const {email, username, password} = req.body

    if (!username || !email) {
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordVaild = await user.isPasswordCorrect(password)

    if (!isPasswordVaild) {
        throw new ApiError(401, "Invalid credentials")
        
    }

    const {refreshToken, accessToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser =  await User.findById(user._id).select("-password -refreshToken")

    // by this option cookie can't be modified on frontend
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(200, "User logged in successfully", {user: accessToken, refreshToken, loggedInUser})
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

export {registerUser, loginUser, logoutUser}

