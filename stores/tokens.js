import { defineStore } from 'pinia';

import { raw_get } from '@/lib/api';

/** 
 *  Dieser Store speichert die Token-Informationen des Benutzers.
 *  Er enthält den aktuellen Token-Wert, die Anzahl der verwendeten Tokens,
 *  das Limit der Tokens und die verbleibenden Tokens.
 *  Er wird in `/plugins/tokenstorePopulate.js` bereits vom Server initialisiert.
 *  Bei jedem API-Call wird der Token-Store aktualisiert.
 */

export const useTokenStore = defineStore('tokenStore', {
    state: () => ({
        token: {
            ip: '',
            used: 1000,
            limit: 1000,
            remaining: 0,
        },
    }),
    getters: {
        usedTokens: (state) => state.token.used,
        limitTokens: (state) => state.token.limit,
        remainingTokens: (state) => state.token.remaining,
        ipAddress: (state) => state.token.ip,
    },
    actions: {
        setToken(token) {
            this.token = token;
        },
        async fetch(initial = false) {
            try {
                if (!initial)
                    return raw_get('/api/limit');
                const { data, error } = await useFetch('/api/limit');
                if (error.value) {
                    console.error('Error fetching token data:', error.value);
                    return;
                }
                this.setToken(data.value.usage);
            } catch (error) {
                console.error('Error fetching token data:', error);
            }
        }
    },
});
