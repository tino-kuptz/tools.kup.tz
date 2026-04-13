const emailProviders = [
    {
        // Exakt "smtpin.rzone.de"
        pattern: "^smtpin\\.rzone\\.de$",
        name: "Strato",
    },
    {
        pattern: ".*mail\\.protection\\.outlook\\.com$",
        name: "Microsoft 365",
    },
    {
        pattern: ".\\.*ionos\\.de$",
        name: "1&1 IONOS",
    },
];

export { emailProviders };
