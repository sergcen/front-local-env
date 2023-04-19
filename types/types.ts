export interface Package {
    name: string;
    branch?: string;
    version: string;
    versionFromMeta: string;
    date: string;
    versions: Package[];
    localDir: string;
    buildDir: string;
    cert: string;
    certKey: string;
}
