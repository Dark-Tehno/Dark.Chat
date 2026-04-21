import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GroupChatView } from './GroupChatView';

export function GroupChatWrapper() {
    const { groupUrl } = useParams<{ groupUrl: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        if (!groupUrl) {
            
            navigate('/');
        }
    }, [groupUrl, navigate]);

    if (groupUrl) {
        
        
        
        return <GroupChatView groupUrl={groupUrl} onBack={() => navigate('/')} />;
    }

    return null; 
}