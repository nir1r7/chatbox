
import { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";

function Login(){
    const { login } = useAuth();
    const [formData, setFormData] = useState({email: "", password: ""});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value})
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try{
            await login(formData.email, formData.password);
            alert("Logged in succesfully. Check console for details.");
            setFormData({ email: "", password: "" });
        } catch {
            alert("Login failed");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required/>
            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="" required/>
            <button type="submit">Submit</button>
        </form>
    );
}

export default Login;