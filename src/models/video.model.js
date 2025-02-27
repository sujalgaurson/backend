import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema = new Schema(
    {
        videoFile:{
            type: String,
            required: true
        },
        thumbnail:{
            type: String,
            required: true
        },
        title:{
            type: String,
            required: true
        },
        discription:{
            type: String,
            required: true
        },
        duration:{
            type: Number, //cloudnairy se hi mil jaata h apne aapp
            required: true
        },
        views:{
            type: Number,
            default: 0
        },
        isPublished:{
            type: Boolean,
            default: true
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    });

VideoSchema.plugins(mongooseAggregatePaginate);    

export const Video = mongoose.model("Video", VideoSchema); 