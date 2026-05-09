// src/models/refresh-token.model.ts

import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        token: {
            type: String,
            required: true,
            unique: true,
        },

        expires_at: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

refreshTokenSchema.index(
    {
        expires_at: 1,
    },
    {
        expireAfterSeconds: 0,
    }
);

export const RefreshToken = mongoose.model(
    "RefreshToken",
    refreshTokenSchema
);