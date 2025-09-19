import Chat from '@/components/chat'
import Auth from '@/components/auth';
import Profile from '@/components/profile'

export default function Home() {

  return (
    <div>
      <Auth />
      <br/>
      <Profile />
      <Chat />
    </div>
  );
}
