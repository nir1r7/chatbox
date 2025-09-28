
import { Message } from '@/types'

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    messages?: Message[];
};