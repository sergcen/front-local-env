export const settings = {
    registry:
        window.localStorage.getItem('registry') || 'https://registry.npmjs.org',
    PORT: Number(window.localStorage.getItem('PORT')) || 3000,
};

export function getSettings() {
    return settings;
}

export function setSettings(key: 'PORT' | 'registry', value: string) {
    if (key === 'PORT') {
        settings[key] = value ? Number(value) : 0;
    }
    window.localStorage.setItem(key, value);
}
