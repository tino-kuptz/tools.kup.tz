const dnsProviders = [
    {
        pattern: "^.*\\.rzone\\.de$",
        name: "Strato",
    },
    {
        pattern: ".*\\.ui-dns\\.(de|biz|org|com)$",
        name: "1&1 IONOS",
    },
    {
        pattern: ".*\\.ns\\.cloudflare\\.com$",
        name: "Cloudflare",
    },
    {
        pattern: ".*\\.vps\\.voicetech-gmbh\\.com\\.$",
        name: "Voicetech GmbH",
    },
];

export { dnsProviders };
