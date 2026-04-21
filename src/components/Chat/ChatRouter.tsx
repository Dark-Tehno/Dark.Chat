import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { ChatView } from './ChatView'; 

export function ChatRouter() {
    const { identifier } = useParams<{ identifier: string }>();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!identifier) {
            navigate('/');
        }
    }, [identifier, navigate]);

    if (identifier) {
        
        
        
        return <ChatView username={identifier} onBack={() => navigate('/')} />;
    }

    return null; 
}