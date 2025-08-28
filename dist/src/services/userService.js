// src/services/userService.ts
// User management service (in-memory storage for now)
import logger from '../utils/logger.js';
export class UserService {
    users = new Map();
    // Hardcoded test wallet for development
    TEST_WALLET = '0x0ed637de4b9ccebe6d69991661a2d14f07f569d0';
    /**
     * Link a wallet address to a user
     */
    async linkUserWallet(userId, walletAddress) {
        try {
            const existingUser = this.users.get(userId);
            const now = new Date();
            const userData = {
                userId,
                walletAddress,
                preferences: existingUser?.preferences || {},
                createdAt: existingUser?.createdAt || now,
                updatedAt: now
            };
            this.users.set(userId, userData);
            logger.info(`Linked wallet ${walletAddress} to user ${userId}`);
        }
        catch (error) {
            logger.error(`Failed to link wallet for user ${userId}:`, error);
            throw new Error('Failed to link wallet');
        }
    }
    /**
     * Get user's wallet address
     */
    async getUserWallet(userId) {
        // For development/testing: always return the test wallet
        if (process.env.NODE_ENV === 'development') {
            return this.TEST_WALLET;
        }
        const user = this.users.get(userId);
        return user?.walletAddress || null;
    }
    /**
     * Check if user has a linked wallet
     */
    async hasLinkedWallet(userId) {
        // For development/testing: always return true
        if (process.env.NODE_ENV === 'development') {
            return true;
        }
        const user = this.users.get(userId);
        return !!(user?.walletAddress);
    }
    /**
     * Unlink wallet from user
     */
    async unlinkUserWallet(userId) {
        const user = this.users.get(userId);
        if (user) {
            user.walletAddress = undefined;
            user.updatedAt = new Date();
            this.users.set(userId, user);
            logger.info(`Unlinked wallet for user ${userId}`);
        }
    }
    /**
     * Get user data
     */
    async getUserData(userId) {
        return this.users.get(userId) || null;
    }
    /**
     * Create or update user preferences
     */
    async updateUserPreferences(userId, preferences) {
        const existingUser = this.users.get(userId);
        const now = new Date();
        const userData = {
            userId,
            walletAddress: existingUser?.walletAddress,
            preferences: { ...existingUser?.preferences, ...preferences },
            createdAt: existingUser?.createdAt || now,
            updatedAt: now
        };
        this.users.set(userId, userData);
        logger.debug(`Updated preferences for user ${userId}`);
    }
    /**
     * Delete user data
     */
    async deleteUser(userId) {
        const deleted = this.users.delete(userId);
        if (deleted) {
            logger.info(`Deleted user data for user ${userId}`);
        }
        return deleted;
    }
    /**
     * Get all users (for admin purposes)
     */
    async getAllUsers() {
        return Array.from(this.users.values());
    }
    /**
     * Get user count
     */
    async getUserCount() {
        return this.users.size;
    }
}
export default UserService;
//# sourceMappingURL=userService.js.map