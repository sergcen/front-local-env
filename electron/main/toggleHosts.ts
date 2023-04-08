import * as util from "util";
import * as hostile from "hostile";

const address = '127.0.0.1';

const addHost = util.promisify(hostile.set);
const removeHost = util.promisify(hostile.remove);
const getHost = util.promisify(hostile.get);

export function setHost(hostname: string) {
    return addHost(hostname, address)
        .then(() => {
            console.log(`Hosts file for ${hostname} is set to ${address}`);
        })
        .catch((error) => {
            console.error(`error: ${error}`);
        });
}

export function unsetHost(hostname: string) {
    return removeHost(hostname, address)
        .then(() => {
            console.log(`Hosts file for ${hostname} is unset`);
        })
        .catch((error) => {
            console.error(`error: ${error}`);
        });
}

export function hasHost(hostname: string) {
    return getHost(false, function (err, lines) {
        if (err) {
            console.error(err.message)
        }

        return Boolean(lines.find(([_, host]) => host === hostname));
    })
}