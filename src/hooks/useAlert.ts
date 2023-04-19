import { AlertProps } from 'antd';
import { useCallback, useRef, useState } from 'react';

interface AlertParams {
    message: string;
    timeout?: number;
    type: AlertProps['type'];
}
export function useAlert() {
    const [message, setMessage] = useState('');
    const [type, setType] = useState('');
    const timeout = useRef(-1);

    const closeAlert = useCallback(() => {
        setMessage('');
        clearTimeout(timeout.current);
    }, []);

    return {
        alert: {
            message,
            type: type as AlertProps['type'],
        },
        setAlert: (params: AlertParams) => {
            setMessage(params.message);
            setType(params.type || 'info');
            if (params.timeout) {
                // @ts-expect-error
                timeout.current = setTimeout(closeAlert, params.timeout);
            }
        },
        closeAlert,
    };
}
