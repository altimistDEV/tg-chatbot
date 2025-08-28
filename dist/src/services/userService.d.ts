import { UserData } from '../types/index.js';
export declare class UserService {
    private users;
    private readonly TEST_WALLET;
    /**
     * Link a wallet address to a user
     */
    linkUserWallet(userId: number, walletAddress: string): Promise<void>;
    /**
     * Get user's wallet address
     */
    getUserWallet(userId: number): Promise<string | null>;
    /**
     * Check if user has a linked wallet
     */
    hasLinkedWallet(userId: number): Promise<boolean>;
    /**
     * Unlink wallet from user
     */
    unlinkUserWallet(userId: number): Promise<void>;
    /**
     * Get user data
     */
    getUserData(userId: number): Promise<UserData | null>;
    /**
     * Create or update user preferences
     */
    updateUserPreferences(userId: number, preferences: Record<string, any>): Promise<void>;
    /**
     * Delete user data
     */
    deleteUser(userId: number): Promise<boolean>;
    /**
     * Get all users (for admin purposes)
     */
    getAllUsers(): Promise<UserData[]>;
    /**
     * Get user count
     */
    getUserCount(): Promise<number>;
}
export default UserService;
//# sourceMappingURL=userService.d.ts.map