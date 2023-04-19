import * as util from "util";
import * as hostile from "hostile";

const address = '127.0.0.1';

const addHost = util.promisify(hostile.set);
const removeHost = util.promisify(hostile.remove);
const getHost = util.promisify(hostile.get);

export function setHost(hostname: string) {
    return addHost(address, hostname);
}

export function unsetHost(hostname: string) {
    return removeHost(address, hostname);
}

export async function hasHost(hostname: string) {
    const lines = await getHost(false);

    return Boolean(lines.find(([_, host]) => host === hostname));
}