// scripts/seed-superadmin.ts
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, UserRole } from "../src/models/user.model.js";
import "dotenv/config";
const SUPER_ADMIN_DATA = {
    name: "Super Admin",
    email: "admin@example.com",
    password: "admin123456", // Change this to a secure password
};
async function connectToDatabase() {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/assignment";
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            retryWrites: true,
            retryReads: true,
            maxPoolSize: 10,
            bufferCommands: false,
        });
        console.log("✅ Connected to MongoDB");
    }
    catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        process.exit(1);
    }
}
async function createSuperAdmin() {
    try {
        // Check if super admin already exists
        const existingAdmin = await User.findOne({
            email: SUPER_ADMIN_DATA.email
        });
        if (existingAdmin) {
            console.log("⚠️  Super admin already exists with email:", SUPER_ADMIN_DATA.email);
            // Update existing user to be super admin if not already
            if (!existingAdmin.is_super_admin || existingAdmin.role !== UserRole.SUPER_ADMIN) {
                await User.findByIdAndUpdate(existingAdmin._id, {
                    role: UserRole.SUPER_ADMIN,
                    is_super_admin: true,
                });
                console.log("✅ Updated existing user to super admin");
            }
            return existingAdmin;
        }
        // Hash password
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(SUPER_ADMIN_DATA.password, saltRounds);
        // Create super admin user
        const superAdmin = await User.create({
            name: SUPER_ADMIN_DATA.name,
            email: SUPER_ADMIN_DATA.email.toLowerCase(),
            password_hash,
            role: UserRole.SUPER_ADMIN,
            is_super_admin: true,
            profile: {
                avatar: null,
                phone: null,
            },
        });
        console.log("✅ Super admin created successfully!");
        console.log("📧 Email:", superAdmin.email);
        console.log("🔑 Password:", SUPER_ADMIN_DATA.password);
        console.log("⚠️  Please change the password after first login!");
        return superAdmin;
    }
    catch (error) {
        console.error("❌ Failed to create super admin:", error);
        throw error;
    }
}
async function seedSuperAdmin() {
    console.log("🌱 Starting super admin seeding...");
    try {
        await connectToDatabase();
        await createSuperAdmin();
        console.log("🎉 Super admin seeding completed successfully!");
    }
    catch (error) {
        console.error("💥 Super admin seeding failed:", error);
        process.exit(1);
    }
    finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
}
// Run the seeding script
seedSuperAdmin();
//# sourceMappingURL=seed-superadmin.js.map