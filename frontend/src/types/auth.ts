
import { User } from '@/types'

export interface AuthContext {
    token: string | null;
    user: User | null;
    signup: (name: string, email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
};