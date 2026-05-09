// src/models/feature-flag.model.ts

import mongoose from "mongoose";

const featureFlagSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },

        feature_key: {
            type: String,
            unique: true,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        enabled: {
            type: Boolean,
            default: false,
        },

        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

featureFlagSchema.index(
    {
        organization_id: 1,
        feature_key: 1,
    },
    {
        unique: true,
    }
);

export const FeatureFlag = mongoose.model(
    "FeatureFlag",
    featureFlagSchema
);