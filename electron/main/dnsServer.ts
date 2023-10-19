import dns from 'dns2';
import EventEmitter from 'events';

const { TCPClient } = dns;

const resolve = TCPClient({
    dns: '8.8.8.8',
});

class DnsServer extends EventEmitter {
    domains: string[] = [];
    targetIP: string;
    server: typeof dns;
    createServer() {
        this.server = dns.createServer({
            udp: true,
            handle: async (request, send, rinfo) => {
                const response = dns.Packet.createResponseFromRequest(request);
                const [question] = request.questions;
                const { name } = question;

                if (this.domains.includes(name)) {
                    response.answers.push({
                        name,
                        type: dns.Packet.TYPE.A,
                        class: dns.Packet.CLASS.IN,
                        ttl: 300,
                        address: this.targetIP,
                        // data: this.targetIP,
                    });
                } else {
                    const result = await resolve(name);
                    response.answers.push(...result.answers);
                }
                send(response);
            },
        });

        this.server.on('requestError', (error) => {
            console.log('Client sent an invalid request', error);
        });

        this.server.on('listening', () => {
            this.emit('active', true);
            console.log('DNS-сервер запущен', this.server.addresses());
        });

        this.server.on('close', () => {
            this.emit('active', false);

            console.log('DNS-сервер остановлен');
        });
    }

    startServer(domains: string[], target: string) {
        this.createServer();

        this.domains = domains;
        this.targetIP = target;
        this.server.listen({
            udp: {
                port: 53,
                address: '0.0.0.0',
                type: 'udp4', // IPv4 or IPv6 (Must be either "udp4" or "udp6")
            },

            // Optionally specify port and/or address for tcp server:
            // tcp: {
            //     port: 53,
            //     address: '127.0.0.1',
            // },
        });
    }

    stopServer() {
        this.server.close(() => {
            console.log('DNS-сервер остановлен');
        });
    }
}

export const dnsServer = new DnsServer();
