import { useMutation, useQuery, useQueryClient } from 'react-query';
import { ipcRenderer } from 'electron';
import { useEffect } from 'react';
import IpcRendererEvent = Electron.IpcRendererEvent;
import { Package } from '../../types/types';

const startServer = async (port?: number, pkg?: Package) => {
    return await ipcRenderer.invoke('startServer', port, pkg);
};

const stopServer = async () => {
    return await ipcRenderer.invoke('stopServer');
};

const getServerStatus = () => {
    return ipcRenderer.invoke('getServerStatus');
};

export const useStartServerMutation = () => {
    return useMutation(
        ({
            port,
            pkg,
        }: {
            port?: number;
            pkg?: Package;
        } = {}) => startServer(port, pkg)
    );
};

export const useStopServerMutation = () => {
    return useMutation(() => stopServer());
};

export const useServerStatus = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const cb = () => {
            queryClient.invalidateQueries('serverStatus');
        };
        ipcRenderer.on('serverStatus', cb);

        return () => {
            ipcRenderer.removeListener('serverStatus', cb);
        };
    });

    return useQuery(['serverStatus'], () => getServerStatus());
};
