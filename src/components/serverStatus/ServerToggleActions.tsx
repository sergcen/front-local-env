import React from 'react';
import { Button } from 'antd';
import {
    useServerStatus,
    useStartServerMutation,
    useStopServerMutation,
} from '@/collections/localServer';
import { PauseOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Package } from '../../../types/types';
import { getSettings } from '@/settings';
import { createGlobalState } from 'react-use';
import {
    useSetCurrentPkgRunning,
    useSetLastPkgRunning,
} from '@/components/serverStatus/ServerState';

export function ServerToggleActions({
    pkg,
    active,
}: {
    pkg?: Package;
    active: boolean;
}) {
    const { mutateAsync: startServer, isLoading: isServerStarting } =
        useStartServerMutation();
    const { mutateAsync: stopServer, isLoading: isServerStopping } =
        useStopServerMutation();
    const [_c, setCurrentPkg] = useSetCurrentPkgRunning();
    const [_l, setLastPkg] = useSetLastPkgRunning();
    const startServerHandler = () => {
        setCurrentPkg(pkg);
        setLastPkg(pkg);
        startServer({ port: getSettings().PORT, pkg });
    };

    const stopServerHandler = async () => {
        await stopServer();
        setCurrentPkg(undefined);
    };

    if (!pkg) return null;

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
