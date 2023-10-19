import React from 'react';
import { Badge, Descriptions } from 'antd';

import { useDNSServerStatus } from '@/collections/dnsServer';
import { ServerToggleActions } from '@/components/dnsServerStatus/ServerToggleActions';

export function DnsServerStatus() {
    const active = useDNSServerStatus();

    return (
        <Descriptions bordered>
            <Descriptions.Item label="DNS сервер">
                {active ? (
                    <Badge status="success" text="Сервер запущен" />
                ) : (
                    <Badge status="error" text="Сервер не запущен" />
                )}
            </Descriptions.Item>
            <Descriptions.Item>
                <ServerToggleActions active={active} />
            </Descriptions.Item>
        </Descriptions>
    );
}
