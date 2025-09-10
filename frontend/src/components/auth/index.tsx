import { useState } from 'react';

function Authenticate(){
    const [signupForm, setSignupForm] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [token, setToken] = useState<string | null>(null);
    // const [token, setToken] = useState(() => {
    //     const storedToken = localStorage.getItem('token');
    //     if (storedToken) {
    //         try {
    //             return storedToken;
    //         } catch (error) {
    //             localStorage.removeItem('token');
    //             return null;
    //         }
    //     }
    //     return null;
    // });

    const login = () => {

    }

    const signup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const response = await fetch ("http://127.0.0.1:8000/api/auth/signup",{
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signupForm),
        });

        const data = await response.json();

        if (response.ok) {
            // localStorage.setItem('token', data.token);
            // setToken(data.token);
            console.log(signupForm)
            // console.log(data.token);
            alert("Account created");
            return data;
        } else {
            console.log('Signup failed');
        }
    }

    const handleSignupChange = (e: React.ChangeEvent<HTMLElement>) =>{
        setSignupForm({
            ...signupForm,
            [(e.target as HTMLInputElement).name]: (e.target as HTMLInputElement).value

        });
        console.log(signupForm);
    }

    return (
        <div>
            <div>
                Signup
                <form onSubmit={signup}>
                    <input type="text" name="name" value={signupForm.name} onChange={handleSignupChange} placeholder='name' required></input>
                    <input type="email" name="email" value={signupForm.email} onChange={handleSignupChange} placeholder='email' required></input>
                    <input type="password" name="password" onChange={handleSignupChange} placeholder='password' required></input>

                    <button type="submit" style={{border: '1px solid black'}}> Create Account </button>
                </form>
            </div>

            Login
            <form onSubmit={login}>
                <input type="email" required></input>
                <input type="password" required></input>
            </form>
        </div>
    );
}

export default Authenticate;