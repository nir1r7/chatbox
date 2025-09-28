
import { createContext, useContext, useState, useEffect, ReactNode} from "react";
import { AuthContext as AuthContextType } from "@/types";
import { User } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const storedToken = localStorage.getItem("token");
        if (storedToken){
            setToken(storedToken);
            fetchUser(storedToken);
        }
    }, []);

    const fetchUser = async (jwt: string) => {
        try{
            const res = await fetch("http://127.0.0.1:8000/api/auth/me", {
                headers: {
                    "Authorization": `Bearer ${jwt}`
                }
            });

            if (res.ok){
                const data = await res.json();
                setUser(data);
            }
            else{
                setUser(null)
            }
        } catch (err){
            console.error("Failed to fetch user:", err);
            setUser(null);
        }
    };

    const login = async (email: string, password: string) => {
        const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "Application/json",
            },
            body: JSON.stringify({email, password})
        });

        if (res.ok){
            const data = await res.json();

            setToken(data.access_token);
            if (typeof window !== "undefined") localStorage.setItem("token", data.access_token);

            await fetchUser(data.access_token);

            console.log("Login successfull, token: " + data.access_token);
        }
        else{
            const err = await res.json().catch(() => ({ detail: "Login failed" }));
            throw new Error(err.detail || "Login failed");
        }
    }

    // put in the time now and you won't regret it later
    // you will regret it later if you don't put in the time now
    // it's now or never
    // so make it now
    // 18/09/2025
    const signup = async (name: string, email: string, password: string) => {
        const res = await fetch("http://127.0.0.1:8000/api/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "Application/json"
            },
            body: JSON.stringify({name, email, password})
        });

        if (res.ok){
            const data = await res.json();
            setToken(data.access_token);
            if (typeof window !== "undefined") localStorage.setItem("token", data.access_token);
            await fetchUser(data.access_token);
            console.log("Signup successfull, token: " + data.access_token);
            logout();
        } else {
            const err = await res.json().catch(() => ({ detail: "Signup failed" }));
            throw new Error(err.detail || "Signup failed");
        };
    }

    const logout = () =>{
        if (typeof window !== "undefined") localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{token, user, signup, login, logout}}>
            { children }
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};