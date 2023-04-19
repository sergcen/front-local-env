import React from 'react';
import { Badge, Descriptions } from 'antd';
import { useServerStatus } from '@/collections/localServer';
import { ServerToggleActions } from '@/components/serverStatus/ServerToggleActions';
import {
    useSetCurrentPkgRunning,
    useSetLastPkgRunning,
} from '@/components/serverStatus/ServerState';

export function ServerStatus() {
    const { data: { active, dir, pkgVersion, port } = {} } = useServerStatus();
    const [currentPkg] = useSetCurrentPkgRunning();
    const [lastPkg] = useSetLastPkgRunning();

    const pkg = currentPkg || lastPkg;

    return (
        <Descriptions bordered>
            <Descriptions.Item label="Локальный сервер">
                {active ? (
                    <Badge
                        status="success"
                        text={`Сервер запущен на порту: ${port}`}
                    />
                ) : (
                    <Badge status="error" text="Сервер не запущен" />
                )}
                <br />
                <b>
                    {pkg?.name}@{pkg?.branch}
                </b>
                <br />
                {pkgVersion}
                <br />
                {dir}
            </Descriptions.Item>
            {pkgVersion ? (
                <Descriptions.Item>
                    <ServerToggleActions pkg={lastPkg} active={active} />
                </Descriptions.Item>
            ) : null}
        </Descriptions>
    );
}
