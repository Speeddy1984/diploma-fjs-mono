import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '../api/api';

interface UseSupportChatOptions {
  chatId: string;
  onNewMessage: (message: Message) => void;
}

export const useSupportChat = ({ chatId, onNewMessage }: UseSupportChatOptions) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('/support', {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.emit('subscribeToChat', { chatId });

    socket.on('newMessage', (message) => {
      onNewMessage(message);
    });

    return () => {
      socket.emit('unsubscribeFromChat', { chatId });
      socket.disconnect();
    };
  }, [chatId, onNewMessage]);
};
