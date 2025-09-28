import Chat from '@/components/chat';
import Auth from '@/components/auth';
import Profile from '@/components/profile';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <Auth />
      <br/>
      <Profile />
      {user && <Chat />}
    </div>
  );
}
