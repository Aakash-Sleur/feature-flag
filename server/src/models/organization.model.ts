// src/models/organization.model.ts

import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        admin_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        is_accepted: {
            type: Boolean,
            required: true,
            default: false
        },
        status: {
            type: String,
            enum: ["INVITED", "ACTIVE"],
            default: "INVITED"
        },
    },
    {
        timestamps: true,
    }
);

export const Organization = mongoose.model(
    "Organization",
    organizationSchema
);