import React from 'react';
import { Button } from 'antd';

import { PauseOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Package } from '../../../types/types';
import { getSettings } from '@/settings';

import {
    useStartDNSServerMutation,
    useStopDNSServerMutation,
} from '@/collections/dnsServer';

export function ServerToggleActions({ active }: { active: boolean }) {
    const { mutateAsync: startServer, isLoading: isServerStarting } =
        useStartDNSServerMutation();
    const { mutateAsync: stopServer, isLoading: isServerStopping } =
        useStopDNSServerMutation();
    const startServerHandler = () => {
        startServer({
            domains: getSettings().DNSDomains.split('\n').filter(Boolean),
            target: getSettings().localIP,
        });
    };

    const stopServerHandler = () => {
        stopServer();
    };

    return active ? (
        <Button
            shape="circle"
            ghost
            type="primary"
            icon={<PauseOutlined />}
            loading={isServerStopping}
            onClick={stopServerHandler}
        ></Button>
    ) : (
        <Button
            shape="circle"
            icon={<PlayCircleOutlined />}
            loading={isServerStarting}
            onClick={startServerHandler}
        ></Button>
    );
}
