var tokenStore = null;
const trackTokenUsage = (usage) => {
    if (!tokenStore) {
        tokenStore = useTokenStore();
    }
    if (usage) {
        tokenStore.setToken(usage);
    }
}

export const raw_get = async (url, getParams = {}) => {
    var queryString = new URLSearchParams(getParams).toString();
    if (queryString) {
        queryString = '?' + queryString;
    }
    const response = await fetch(`${url}${queryString}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    trackTokenUsage(data.usage);
    return data.data;
}
