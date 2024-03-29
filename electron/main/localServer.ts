import handler from 'serve-handler';
import https, { Server } from 'https';
import EventEmitter from 'events';
import * as fs from 'fs';

class LocalServer extends EventEmitter {
    server: null | Server;
    currentDir: string = '';
    port: number = null;
    pkgVersion: string = '';
    started: boolean = false;
    cert: Buffer = null;
    certKey: Buffer = null;
    constructor() {
        super();
        this.init();
    }

    init() {
        this.server = https.createServer(
            {
                cert: this.cert,
                key: this.certKey,
            },
            async (request, response) => {
                if (!this.currentDir) return;

                return handler(request, response, {
                    rewrites: [
                        {
                            source: '!(*.+)',
                            destination: '/index.html',
                        },
                    ],
                    headers: [
                        {
                            source: '*',
                            headers: [
                                {
                                    key: 'Access-Control-Allow-Headers',
                                    value: '*',
                                },
                                {
                                    key: 'Access-Control-Allow-Methods',
                                    value: '*',
                                },
                                {
                                    key: 'Access-Control-Allow-Origin',
                                    value: '*',
                                },
                            ],
                        },
                    ],

                    public: this.currentDir,

                    cleanUrls: false,
                });
            }
        );

        this.server.on('listening', (err) => {
            console.log(err);
            this.started = true;
            this.emit('active', true);
        });

        this.server.on('close', () => {
            this.started = false;
            this.emit('active', false);
        });
    }

    setCurrentDir(port: number, pkgVersion: string, dir: string) {
        this.port = port ?? this.port;
        this.pkgVersion = pkgVersion ?? this.pkgVersion;
        this.currentDir = dir ?? this.currentDir;
    }

    async start({
        port,
        pkgVersion,
        dir,
        certKey,
        cert,
    }: {
        port?: number;
        pkgVersion?: string;
        dir?: string;
        certKey: string;
        cert: string;
    }) {
        this.setCurrentDir(port, pkgVersion, dir);
        if (certKey) {
            this.cert = await fs.promises.readFile(cert);
            this.certKey = await fs.promises.readFile(certKey);
        }

        return new Promise<void>((resolve) => {
            if (!this.started) {
                if (!this.server) {
                    this.init();
                } else {
                    this.server.setSecureContext({
                        key: this.certKey,
                        cert: this.cert,
                    });
                }
                this.server.listen(port, () => {
                    console.log('Running at http://localhost:' + port);
                    resolve();
                });
            } else {
                this.emit('active', true);
                resolve();
            }
        });
    }

    async stop() {
        return new Promise<void>((resolve) => {
            if (this.started) {
                this.server.close(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

export const localServer = new LocalServer();
