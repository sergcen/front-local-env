export const settings = {
    registry:
        window.localStorage.getItem('registry') || 'https://registry.npmjs.org',
    PORT: Number(window.localStorage.getItem('PORT')) || 3000,
    DNSDomains: window.localStorage.getItem('DNSDomains') || '',
    localIP: window.localStorage.getItem('localIP') || '127.0.0.1',
};

export function getSettings() {
    return settings;
}

export function setSettings(key: keyof typeof settings, value: string) {
    if (key === 'PORT') {
        settings[key] = value ? Number(value) : 0;
    } else {
        settings[key] = value;
    }
    window.localStorage.setItem(key, value);
}
