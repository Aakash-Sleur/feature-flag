import mongoose, { type InferSchemaType } from "mongoose";

export enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ORG_ADMIN = "ORG_ADMIN",
    END_USER = "END_USER",
}

const profileSchema = new mongoose.Schema(
    {
        avatar: String,
        phone: String,
    },
    {
        _id: false,
    }
);

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password_hash: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.END_USER,
        },

        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            default: null,
        },

        profile: {
            type: profileSchema,
            default: {},
        },

        is_super_admin: {
            type: Boolean,
            default: false,
        },

        access_token: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export type UserDocument = mongoose.Document & InferSchemaType<typeof userSchema> & {
    _id: mongoose.Types.ObjectId;
};

export const User = mongoose.model("User", userSchema);