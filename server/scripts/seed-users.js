// scripts/seed-users.ts
// Comprehensive user seeding script
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, UserRole } from "../src/models/user.model.js";
import "dotenv/config";
const SEED_USERS = [
    {
        name: "Super Admin",
        email: "admin@example.com",
        password: "admin123456",
        role: UserRole.SUPER_ADMIN,
        is_super_admin: true,
    },
    {
        name: "Organization Admin",
        email: "orgadmin@example.com",
        password: "orgadmin123456",
        role: UserRole.ORG_ADMIN,
        is_super_admin: false,
    },
    {
        name: "End User",
        email: "user@example.com",
        password: "user123456",
        role: UserRole.END_USER,
        is_super_admin: false,
    },
    {
        name: "John Doe",
        email: "john@example.com",
        password: "john123456",
        role: UserRole.END_USER,
        is_super_admin: false,
    },
    {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "jane123456",
        role: UserRole.ORG_ADMIN,
        is_super_admin: false,
    }
];
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
async function createUser(userData) {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({
            email: userData.email
        });
        if (existingUser) {
            console.log(`⚠️  User already exists: ${userData.email}`);
            // Update existing user if needed
            const updateData = {
                role: userData.role,
                is_super_admin: userData.is_super_admin,
            };
            await User.findByIdAndUpdate(existingUser._id, updateData);
            console.log(`✅ Updated user: ${userData.email}`);
            return existingUser;
        }
        // Hash password
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(userData.password, saltRounds);
        // Create user
        const user = await User.create({
            name: userData.name,
            email: userData.email.toLowerCase(),
            password_hash,
            role: userData.role,
            is_super_admin: userData.is_super_admin,
            profile: {
                avatar: null,
                phone: null,
            },
        });
        console.log(`✅ Created user: ${user.email} (${user.role})`);
        return user;
    }
    catch (error) {
        console.error(`❌ Failed to create user ${userData.email}:`, error);
        throw error;
    }
}
async function seedUsers() {
    console.log("🌱 Starting user seeding...");
    try {
        await connectToDatabase();
        console.log(`📝 Creating ${SEED_USERS.length} users...`);
        for (const userData of SEED_USERS) {
            await createUser(userData);
        }
        console.log("\n🎉 User seeding completed successfully!");
        console.log("\n📋 Login Credentials:");
        console.log("=".repeat(50));
        SEED_USERS.forEach(user => {
            console.log(`${user.role.padEnd(15)} | ${user.email.padEnd(25)} | ${user.password}`);
        });
        console.log("=".repeat(50));
        console.log("⚠️  Please change passwords after first login!");
    }
    catch (error) {
        console.error("💥 User seeding failed:", error);
        process.exit(1);
    }
    finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}
// Run the seeding script
seedUsers();
//# sourceMappingURL=seed-users.js.map