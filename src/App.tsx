import React, { useCallback, useEffect, useState } from 'react';
import './App.scss';
import {
    useDownloadPackageVersion,
    useGetPackageVersion,
    useInstalledVersions,
    useInstallLocalPackage,
} from '@/collections/packages';
import Search from 'antd/es/input/Search';
import {
    Button,
    Collapse,
    Form,
    Input,
    notification,
    Space,
    Table,
    TableColumnsType,
    Tag,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { ServerStatus } from '@/components/serverStatus/ServerStatus';
import { ServerToggleActions } from '@/components/serverStatus/ServerToggleActions';
import {
    setSettings as setSavedSettings,
    settings as savedSettings,
} from '@/settings';
import { useSetCurrentPkgRunning } from '@/components/serverStatus/ServerState';
import { Package } from '../types/types';
import { DnsServerStatus } from '@/components/dnsServerStatus/DnsServerStatus';
import TextArea from 'antd/es/input/TextArea';

const { Panel } = Collapse;

const isInstalled = (intalled: Package[], pkg: Package) => {
    return Boolean(intalled.find((p) => p.versionFromMeta === pkg.version));
};

function App() {
    const [search, setSearch] = useState('');
    const [messageApi, contextHolder] = notification.useNotification();
    const [settings, setSettings] = useState(savedSettings);

    const setCurrentSettings = (
        key: keyof typeof savedSettings,
        value: string
    ) => {
        setSavedSettings(key, value);
        setSettings((curSettings) => {
            return { ...curSettings, [key]: value };
        });
    };

    const { mutateAsync: downloadPackage, isLoading: isDownloadingPkgData } =
        useDownloadPackageVersion(settings.registry);
    const {
        mutateAsync: installLocalPackage,
        isLoading: isInstallingLocalPkg,
    } = useInstallLocalPackage();

    const { mutateAsync: getPkgVersion, isLoading: isDownloadingPkgVersion } =
        useGetPackageVersion(settings.registry);

    const { isLoading: isFetchingInstalledVersions, data: installedVersions } =
        useInstalledVersions();
    const isDownloading =
        isDownloadingPkgVersion || isDownloadingPkgData || isInstallingLocalPkg;

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const filePath = acceptedFiles[0]?.path;

        if (filePath) {
            installLocalPackage({ filePath });
        }
    }, []);

    useEffect(() => {
        const handlerDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };
        const handlerDrop = (event: DragEvent) => {
            event.preventDefault();
            event.stopPropagation();

            for (const f of event?.dataTransfer?.files || []) {
                installLocalPackage({ filePath: f.path });
                return;
            }
        };

        document.addEventListener('dragover', handlerDragOver);
        document.addEventListener('drop', handlerDrop);

        return () => {
            document.removeEventListener('dragover', handlerDragOver);
            document.removeEventListener('drop', handlerDrop);
        };
    });

    const checkAndDownload = async (
        packageName: string,
        version: string = 'latest'
    ) => {
        try {
            const pkg = await getPkgVersion({ packageName, version });

            if (installedVersions && isInstalled(installedVersions, pkg)) {
                messageApi.success({
                    message: 'Последняя версия уже установлена',
                    duration: 2,
                });
                return;
            }

            const metaData = await downloadPackage({ packageName, version });
            messageApi.success({
                message: `${metaData.version} успешно установлена`,
                duration: 2,
            });
        } catch (e) {
            // @ts-expect-error
            messageApi.error({ message: e?.message as string });
        }
    };
    const [currentServerPackage] = useSetCurrentPkgRunning();
    const isPackageRunning = (
        pkg: Package,
        ranPkg: Package | undefined = currentServerPackage
    ) => {
        if (!ranPkg) return false;

        if (ranPkg.name === pkg.name && ranPkg.version === pkg.version) {
            return true;
        }
        if (
            pkg.versions &&
            pkg.versions.some((p: Package) => isPackageRunning(p, ranPkg))
        ) {
            return true;
        }

        return false;
    };

    const onSearchHandler = useCallback(async () => {
        const [pkgName, version = 'latest'] = search.split('@');
        await checkAndDownload(pkgName, version);
        setSearch('');
    }, [search, checkAndDownload]);

    const expandedRowRender = (data: Package) => {
        const columns: TableColumnsType<Package> = [
            {
                title: 'Версия',
                key: 'version',
                render: (pkg: Package) => {
                    return isPackageRunning(pkg) ? (
                        <b>{pkg.version}</b>
                    ) : (
                        pkg.version
                    );
                },
            },
            { title: 'Время публикации', dataIndex: 'date', key: 'date' },
            {
                title: 'Запуск',
                align: 'right',
                render: (pkg) => (
                    <Space size="middle">
                        <ServerToggleActions
                            pkg={pkg}
                            active={isPackageRunning(pkg)}
                        />
                    </Space>
                ),
            },
        ];

        return (
            <Table
                columns={columns}
                dataSource={data.versions}
                pagination={false}
            />
        );
    };

    const columns: TableColumnsType<Package> = [
        {
            title: 'Имя',
            key: 'name',
            dataIndex: 'name',
        },
        { title: 'Ветка', dataIndex: 'branch', key: 'branch' },
        {
            title: 'Статус',
            render: (pkg: Package) => {
                const active = isPackageRunning(pkg);
                return (
                    <Tag color={active ? 'green' : 'default'}>
                        {active ? 'Запущен' : 'Установлен'}
                    </Tag>
                );
            },
        },
        {
            title: 'Действия',
            align: 'right',
            render: function (data) {
                return (
                    <Space>
                        <Button
                            shape="circle"
                            icon={<ReloadOutlined />}
                            loading={isDownloading}
                            onClick={() => checkAndDownload(data.name)}
                        ></Button>
                        {/*<Button*/}
                        {/*    shape="circle"*/}
                        {/*    danger*/}
                        {/*    icon={<DeleteOutlined />}*/}
                        {/*    loading={isDownloading}*/}
                        {/*></Button>*/}
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="App">
            <Space style={{ display: 'flex' }} direction="vertical">
                {contextHolder}
                <Collapse>
                    <Panel header="Настройки" key="1">
                        <Space style={{ width: 400 }} direction="vertical">
                            <Form labelCol={{ span: 8 }}>
                                <Form.Item label="Port">
                                    <Input
                                        placeholder="PORT default(3000)"
                                        defaultValue={settings.PORT}
                                        onChange={(e) =>
                                            setCurrentSettings(
                                                'PORT',
                                                e.target.value
                                            )
                                        }
                                    />
                                </Form.Item>
                                <Form.Item label="NPM registry">
                                    <Input
                                        placeholder="NPM registry"
                                        defaultValue={settings.registry}
                                        onChange={(e) =>
                                            setCurrentSettings(
                                                'registry',
                                                e.target.value
                                            )
                                        }
                                    />
                                </Form.Item>
                                <Form.Item label="DNS Domains">
                                    <TextArea
                                        placeholder="DNS Domains"
                                        defaultValue={settings.DNSDomains}
                                        onChange={(e) =>
                                            setCurrentSettings(
                                                'DNSDomains',
                                                e.target.value
                                            )
                                        }
                                    />
                                </Form.Item>
                                <Form.Item label="Local IP">
                                    <Input
                                        placeholder="Local IP"
                                        defaultValue={'192.168.x.x'}
                                        onChange={(e) =>
                                            setCurrentSettings(
                                                'localIP',
                                                e.target.value
                                            )
                                        }
                                    />
                                </Form.Item>
                            </Form>
                        </Space>
                    </Panel>
                </Collapse>
                <Search
                    placeholder="Название ветки"
                    enterButton="Добавить"
                    size="large"
                    loading={isDownloading}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onSearch={() => search && onSearchHandler()}
                />
                <ServerStatus />
                <DnsServerStatus />
                <Table
                    rowKey={(pkg) => `${pkg.name}@${pkg.branch}`}
                    columns={columns}
                    expandable={{
                        expandedRowRender,
                        defaultExpandedRowKeys: ['0'],
                    }}
                    pagination={false}
                    loading={isFetchingInstalledVersions}
                    dataSource={installedVersions}
                />
            </Space>
        </div>
    );
}

export default App;
