import { useAuth } from '@/context/AuthContext'

function Profile(){
    const {user, logout} = useAuth();

    if (!user){
        return <p>No user logged in.</p>;
    }

    return (
        <div>
            <h2>Profile</h2>
            <p>Id: {user.id}</p>
            <p>Name: {user.name}</p>
            <p>Email: {user.email}</p>

            <button onClick={logout}>
                Logout
            </button>
        </div>
    )
}

export default Profile;