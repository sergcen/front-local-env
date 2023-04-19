import path from 'node:path';

import { Readable } from 'stream';

import NpmRegistryClient from 'npm-registry-client';
import * as tar from 'tar';
import * as fs from 'fs';
import { Package } from '../../types/types';
import { groupBy } from 'lodash';
import { DEST_DIR } from './constants';

const registryUrl = 'https://registry.npmjs.org';
const client = new NpmRegistryClient({ registry: registryUrl });


const getFullURI = (
    pkgName: string,
    registryUrl = 'https://registry.npmjs.org'
) => `${registryUrl}/${pkgName}`;
// Функция для поиска версий и тегов пакета
export async function searchPackage(packageName, registry) {
    return new Promise((resolve, reject) => {
        client.get(getFullURI(packageName, registry), {}, (error, data) => {
            if (error) {
                reject(error);
            } else {
                const versions = Object.keys(data.versions);
                const tags = data['dist-tags'];
                resolve({ versions, tags });
            }
        });
    });
}

export async function getVersionData(packageName, version, registry) {
    const preparedVersion = version.replace(/[\/\\]/g, '-');

    return new Promise((resolve, reject) => {
        client.get(
            getFullURI(`${packageName}/${preparedVersion}`, registry),
            { follow: 20 },
            (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            }
        );
    });
}

async function extractPackage(fileStream: Readable, destDir: string) {
    await fs.promises.mkdir(destDir, { recursive: true });

    return new Promise<void>((resolve, reject) => {
        const extractOpts = {
            cwd: destDir,
            strip: 1,
        };
        const extractStream = tar.extract(extractOpts);

        extractStream.on('error', (err) => reject(err));
        extractStream.on('end', async () => {
            console.log('Распаковка завершена');
            resolve();
        });

        fileStream.pipe(extractStream);
    });
}

export async function installPackageLocal(filePath: string) {
    const fileStream = fs.createReadStream(filePath);
    const destDir = path.join(DEST_DIR, path.parse(filePath).name);

    return extractPackage(fileStream, destDir);
}

// Функция для скачивания и распаковки архива
export async function installPackage(packageName, version, registry) {
    const data = await getVersionData(packageName, version, registry);

    // @ts-expect-error
    const tarballUrl = data.dist.tarball;
    // @ts-expect-error
    const destDir = path.join(DEST_DIR, `${packageName}-${data.version}`);
    const res = await fetch(tarballUrl as string);

    // @ts-expect-error
    const body = Readable.fromWeb(res.body as ReadableStream<Uint8Array>);

    await extractPackage(body, destDir);

    await fs.promises.writeFile(
        path.join(destDir, 'meta.json'),
        JSON.stringify(data)
    );

    return data as Package;
}

function groupAndSortPackages(packages: Package[]): Package[] {
    const sorted = packages.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const grouped = groupBy(sorted, ({ name, branch }) => `${name}@${branch}`);

    const added = new Set();

    return sorted.reduce<Package[]>((res, pkg) => {
        const key = `${pkg.name}@${pkg.branch}`;
        if (added.has(key)) return res;

        added.add(key);
        res.push({
            ...pkg,
            versions: grouped[key],
        });

        return res;
    }, []);
}

// Функция для показа списка скаченных версий
export async function listVersions() {
    const folders = await fs.promises.readdir(DEST_DIR, {
        withFileTypes: true,
    });

    const packages = await Promise.all(
        folders
            .filter((dirent) => dirent.isDirectory())
            .map(async (dirent) => {
                const pkgJson = await fs.promises
                    .readFile(
                        path.join(DEST_DIR, dirent.name, 'package.json'),
                        'utf-8'
                    )
                    .then((data) => JSON.parse(data) as Package);
                try {
                    const metaJson = await fs.promises
                        .readFile(
                            path.join(DEST_DIR, dirent.name, 'meta.json'),
                            'utf-8'
                        )
                        .then((data) => JSON.parse(data));

                    pkgJson.versionFromMeta = metaJson.version;
                } catch (e) {
                    pkgJson.versionFromMeta = pkgJson.version;
                }

                pkgJson.localDir = path.join(
                    DEST_DIR,
                    dirent.name,
                    pkgJson.buildDir
                );
                pkgJson.cert = path.join(DEST_DIR, dirent.name, pkgJson.cert);
                pkgJson.certKey = path.join(
                    DEST_DIR,
                    dirent.name,
                    pkgJson.certKey
                );

                return pkgJson;
            })
    );
    return groupAndSortPackages(packages);
}
