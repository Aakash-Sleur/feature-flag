import { FeatureFlag } from "../models/feature.model.js"

export interface FeatureData {
    organizationId: string
    title: string
    featureKey: string
    description: string
    created_by: string
}


export interface UpdateFeatureFlagData {
    featureId: string
    organizationId: string
    title?: string
    featureKey?: string
    description?: string
    enabled?: boolean
}

export const createFeatureFlag = async (
    data: FeatureData
) => {
    const {
        organizationId,
        title,
        featureKey,
        description,
        created_by,
    } = data

    if (
        !organizationId ||
        !title ||
        !featureKey ||
        !description ||
        !created_by
    ) {
        throw new Error(
            "Organization, title, feature flag, description and created by is required"
        )
    }

    const existingFeature =
        await FeatureFlag.findOne({
            feature_key: featureKey,
            organization_id: organizationId,
        })

    if (existingFeature) {
        throw new Error(
            "Feature flag already exists"
        )
    }

    const feature =
        await FeatureFlag.create({
            organization_id: organizationId,
            title,
            feature_key: featureKey,
            description,
            created_by,
            enabled: false,
        })

    return feature
}

export const getFeatureFlags = async (
    organizationId: string
) => {
    if (!organizationId) {
        throw new Error(
            "Organization ID is required"
        )
    }

    const featureFlags =
        await FeatureFlag.find({
            organization_id: organizationId,
        })
            .sort({ createdAt: -1 })
            .lean()

    return {
        success: true,
        count: featureFlags.length,
        data: featureFlags,
    }
}
export const updateFeatureFlag = async (
    data: UpdateFeatureFlagData
) => {
    const {
        featureId,
        organizationId,
        title,
        featureKey,
        description,
        enabled,
    } = data

    if (!featureId) {
        throw new Error(
            "Feature flag ID is required"
        )
    }

    if (!organizationId) {
        throw new Error(
            "Organization ID is required"
        )
    }

    const existingFeature =
        await FeatureFlag.findOne({
            _id: featureId,
            organization_id: organizationId,
        })

    if (!existingFeature) {
        throw new Error(
            "Feature flag not found"
        )
    }

    // PREVENT DUPLICATE FEATURE KEY
    if (
        featureKey &&
        featureKey !==
        existingFeature.feature_key
    ) {
        const duplicateFeature =
            await FeatureFlag.findOne({
                feature_key: featureKey,
                organization_id: organizationId,
                _id: {
                    $ne: featureId,
                },
            })

        if (duplicateFeature) {
            throw new Error(
                "Feature key already exists"
            )
        }
    }

    const updatedFeature =
        await FeatureFlag.findByIdAndUpdate(
            featureId,
            {
                ...(title && { title }),
                ...(featureKey && {
                    feature_key: featureKey,
                }),
                ...(description && {
                    description,
                }),
                ...(typeof enabled ===
                    "boolean" && {
                    enabled,
                }),
            },
            {
                new: true,
                runValidators: true,
            }
        ).lean()

    return {
        success: true,
        data: updatedFeature,
    }
}