import { useMutation } from 'react-query';
import { ipcRenderer } from 'electron';
import { useEffect, useState } from 'react';
import IpcRendererEvent = Electron.IpcRendererEvent;

const startServer = async (domains: string[], target: string) => {
    return await ipcRenderer.invoke('startDNSServer', domains, target);
};

const stopServer = async () => {
    return await ipcRenderer.invoke('stopDNSServer');
};

export const useStartDNSServerMutation = () => {
    return useMutation(
        ({ domains, target }: { domains: string[]; target: string }) =>
            startServer(domains, target)
    );
};

export const useStopDNSServerMutation = () => {
    return useMutation(() => stopServer());
};

export const useDNSServerStatus = () => {
    const [active, setActive] = useState(false);

    useEffect(() => {
        const cb = (e: IpcRendererEvent, value: boolean) => {
            setActive(value);
        };
        ipcRenderer.on('DNSServerStatus', cb);

        return () => {
            ipcRenderer.removeListener('DNSServerStatus', cb);
        };
    });

    return active;
};
