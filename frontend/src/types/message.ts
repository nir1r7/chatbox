
export interface Message {
    id: number;
    content: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
};