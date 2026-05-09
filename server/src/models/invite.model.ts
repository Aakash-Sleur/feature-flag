// src/models/invite.model.ts

import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
        },

        username: {
            type: String,
            required: true,
        },

        is_admin: {
            type: Boolean,
            default: false,
        },

        token: {
            type: String,
            required: true,
            unique: true,
        },

        expired_at: {
            type: Date,
            required: true,
        },

        is_available: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Invite = mongoose.model(
    "Invite",
    inviteSchema
);