import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ipcRenderer } from 'electron';
import { Package } from '../../types/types';

const getPackageVersions = async (packageName: string, registry: string) => {
    const versions = await ipcRenderer.invoke(
        'getPackageVersions',
        packageName,
        registry
    );
    return versions;
};

export const usePackageVersions = (packageName: string, registry: string) => {
    return useQuery(['packageVersions', packageName], () =>
        getPackageVersions(packageName, registry)
    );
};

export const getPackageVersion = async (
    packageName: string,
    version: string,
    registry: string
) => {
    return ipcRenderer.invoke(
        'getPackageVersion',
        packageName,
        version,
        registry
    );
};

// Функция скачивания пакета
const downloadPackageVersion = async (
    packageName: string,
    version: string,
    registry: string
) => {
    return ipcRenderer.invoke(
        'downloadPackageVersion',
        packageName,
        version,
        registry
    );
};

export const installLocalPackage = (filePath: string) => {
    return ipcRenderer.invoke('installLocalPackage', filePath);
};

export const useGetPackageVersion = (registry: string) => {
    return useMutation(
        ({ packageName, version }: { packageName: string; version: string }) =>
            getPackageVersion(packageName, version, registry)
    );
};

export const useDownloadPackageVersion = (registry: string) => {
    const queryClient = useQueryClient();

    return useMutation(
        ({ packageName, version }: { packageName: string; version: string }) =>
            downloadPackageVersion(packageName, version, registry),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('installedVersions');
                queryClient.invalidateQueries('packageVersions');
            },
        }
    );
};

export const useInstallLocalPackage = () => {
    const queryClient = useQueryClient();

    return useMutation(
        ({ filePath }: { filePath: string }) => installLocalPackage(filePath),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('installedVersions');
                queryClient.invalidateQueries('packageVersions');
            },
        }
    );
};

// Функция получения списка установленных версий пакета
const getInstalledVersions = async (): Promise<Package[]> => {
    const versions = await ipcRenderer.invoke('getInstalledVersions');
    return versions;
};

export const useInstalledVersions = () => {
    return useQuery(['installedVersions'], () => getInstalledVersions());
};
