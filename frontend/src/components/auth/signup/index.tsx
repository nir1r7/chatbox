import { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";

function Signup(){
    const { signup } = useAuth();
    const [formData, setFormData] = useState({name: "", email: "", password: ""})

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value})
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try{
            await signup(formData.name, formData.email, formData.password);
            alert("Signup Successfull. Check console for details");
            setFormData({ name: "", email: "", password: "" });
        } catch {
            alert("Signup failed");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input name="name" type="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
            <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="" required />
            <button type="submit">Submit</button>
        </form>
    )
}

export default Signup;