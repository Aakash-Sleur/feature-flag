// scripts/fix-user-indexes.ts
import mongoose from 'mongoose';
import { User } from '../src/models/user.model.js';
import config from '../src/config/config.js';
async function fixUserIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');
        // Get the users collection
        const collection = mongoose.connection.db.collection('users');
        // List all indexes
        console.log('Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach((index, i) => {
            console.log(`${i + 1}. ${JSON.stringify(index)}`);
        });
        // Drop the problematic username index if it exists
        try {
            await collection.dropIndex('username_1');
            console.log('✅ Dropped username_1 index');
        }
        catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  username_1 index does not exist (already dropped)');
            }
            else {
                console.log('❌ Error dropping username_1 index:', error.message);
            }
        }
        // Ensure the correct indexes exist
        console.log('\nEnsuring correct indexes...');
        // The email index should already exist from the schema
        await User.createIndexes();
        console.log('✅ User model indexes created/verified');
        // List indexes after cleanup
        console.log('\nIndexes after cleanup:');
        const newIndexes = await collection.indexes();
        newIndexes.forEach((index, i) => {
            console.log(`${i + 1}. ${JSON.stringify(index)}`);
        });
        console.log('\n✅ Database indexes fixed successfully!');
    }
    catch (error) {
        console.error('❌ Error fixing indexes:', error);
    }
    finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
// Run the script
fixUserIndexes().catch(console.error);
//# sourceMappingURL=fix-user-indexes.js.map