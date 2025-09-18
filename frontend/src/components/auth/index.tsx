import { useState } from 'react';

function Authenticate(){
    const [signupForm, setSignupForm] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [loginForm, setLoginForm] = useState({
        email: '',
        password: ''
    })

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

const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(loginForm),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        setToken(data.access_token);
        console.log(data.access_token);

        alert('Successfully logged in');
        setLoginForm({ email: '', password: '' });

        return data;
    } catch (error) {
        alert('Login failed. Please try again.');
    }
}

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginForm({
            ...loginForm,
            [(e.target as HTMLInputElement).name]: (e.target as HTMLInputElement).value
        });
        console.log(loginForm)
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
            // localStorage.setItem('token', data.access_token);
            setToken(data.access_token);
            console.log(data.access_token);
            alert("Account created");
            setSignupForm({
                name: '',
                email: '',
                password: '',
            });
            return data;
        } else {
            console.log('Signup failed');
        }
    }

    const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) =>{
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
                    <input type="password" name="password" value={signupForm.password} onChange={handleSignupChange} placeholder='password' required></input>

                    <button type="submit" style={{border: '1px solid black'}}> Create Account </button>
                </form>
            </div>

            Login
            <form onSubmit={login}>
                <input type="email" name="email" value={loginForm.email} onChange={handleLoginChange} placeholder='email' required></input>
                <input type="password" name="password" value={loginForm.password} onChange={handleLoginChange} placeholder='password' required></input>

                <button type="submit" style={{border: '1px solid black'}}> Log in </button>
            </form>

            {token}
        </div>
    );
}

export default Authenticate;