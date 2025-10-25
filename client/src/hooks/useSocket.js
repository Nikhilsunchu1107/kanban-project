import { useEffect, useState } from 'react';
import io from 'socket.io-client';

// The URL of your backend server
const SOCKET_URL = 'http://localhost:5001';

const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Create the socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Cleanup: disconnect when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []); // This effect runs only once

  return socket;
};

export default useSocket;