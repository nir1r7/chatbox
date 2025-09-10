import Chat from '@/components/chat'
import Authenticate from '@/components/auth';

export default function Home() {

  return (
    <div>
      <Authenticate />
      <br/>
      <Chat />
    </div>
  );
}
