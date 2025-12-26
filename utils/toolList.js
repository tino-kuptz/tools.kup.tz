// Helper function to get translated value
const getCurrentLocale = () => {
    const locale = typeof useI18n !== 'undefined' ? useI18n().locale.value : 'de';
    return locale;
}

const getTranslated = (obj, locale = null) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (obj.de !== undefined || obj.en !== undefined) {
        const loc = locale || getCurrentLocale();
        return obj[loc] || obj.de || obj.en || obj;
    }
    return obj;
}

const tools = [
    {
        name: { de: "JSON Formatter", en: "JSON Formatter" },
        description: { de: "Zeigt JSON-Objekte lesbar an und erlaubt Browsing von diesen.", en: "Displays JSON objects in a readable format and allows browsing them." },
        link: "/formatting/json",
        category: [{ de: "Formattierung", en: "Formatting" }],
        tags: ["JSON"],
        tokens: 0,
    },
    {
        name: { de: "Bilder zu Base64", en: "Images to Base64" },
        description: { de: "Wandelt Bilder so um, dass sie direkt eingebettet werden können.", en: "Converts images so they can be directly embedded." },
        link: "/formatting/image-base64",
        category: [{ de: "Bilder", en: "Images" }, { de: "Formattierung", en: "Formatting" }],
        tags: ["Base64", "Bilder"],
        tokens: 0,
    },
    {
        name: { de: "CSV Konverter", en: "CSV Converter" },
        description: { de: "Wandelt verschiedene CSV-Arten zueinander um.", en: "Converts different CSV formats to each other." },
        link: "/formatting/csv",
        category: [{ de: "Formattierung", en: "Formatting" }],
        tags: ["CSV"],
        tokens: 0,
    },
    {
        name: { de: "HTML zu Markdown", en: "HTML to Markdown" },
        description: { de: "Wandelt HTML-Code in Markdown-Format um.", en: "Converts HTML code to Markdown format." },
        link: "/formatting/html2markdown",
        category: [{ de: "Formattierung", en: "Formatting" }],
        tags: ["HTML", "Markdown"],
        tokens: 0,
    },
    {
        name: { de: "FRITZ!Box XML zu CSV", en: "FRITZ!Box XML to CSV" },
        description: { de: "Wandelt ein FRITZ!Box XML Adressbuch zu CSV um.", en: "Converts a FRITZ!Box XML address book to CSV." },
        link: "/formatting/fritzbox-xml2csv",
        category: [{ de: "Formattierung", en: "Formatting" }],
        tags: ["FRITZ!Box", "XML", "CSV"],
        tokens: 0,
    },
    {
        name: { de: "DNS Scanner", en: "DNS Scanner" },
        description: { de: "Suche so viele Records wie möglich von einer Domäne.", en: "Search for as many records as possible from a domain." },
        link: "/dns/scan",
        category: [{ de: "DNS", en: "DNS" }],
        tags: ["DNS"],
        tokens: 300,
    },
    {
        name: { de: "MX Resolver", en: "MX Resolver" },
        description: { de: "Löst die E-Mail Server einer Domäne auf und versucht den Provider zu bestimmen.", en: "Resolves the email servers of a domain and attempts to determine the provider." },
        link: "/dns/mx",
        category: [{ de: "DNS", en: "DNS" }],
        tags: ["DNS"],
        tokens: 100,
    },
    {
        name: { de: "NS Resolver", en: "NS Resolver" },
        description: { de: "Löst die Nameserver einer Domäne auf und versucht den Provider zu bestimmen.", en: "Resolves the nameservers of a domain and attempts to determine the provider." },
        link: "/dns/ns",
        category: [{ de: "DNS", en: "DNS" }],
        tags: ["DNS"],
        tokens: 100,
    },
    {
        name: { de: "Bcrypt Hash Generator", en: "Bcrypt Hash Generator" },
        description: { de: "Erstellt oder validiert einen Bcrypt Hash im Browser aus einem Passwort.", en: "Creates or validates a Bcrypt hash in the browser from a password." },
        link: "/hash/bcrypt",
        category: [{ de: "Hashing", en: "Hashing" }],
        tags: ["Cryptography", "Hashing"],
        tokens: 0,
    },
    {
        name: { de: "MD5 Hash Generator", en: "MD5 Hash Generator" },
        description: { de: "Erstellt einen MD5 Hash aus einem Text oder einer Datei.", en: "Creates an MD5 hash from text or a file." },
        link: "/hash/md5",
        category: [{ de: "Hashing", en: "Hashing" }],
        tags: ["Cryptography", "Hashing"],
        tokens: 0,
    },
    {
        name: { de: "SHA1 Hash Generator", en: "SHA1 Hash Generator" },
        description: { de: "Erstellt einen SHA1 Hash aus einem Text oder einer Datei.", en: "Creates a SHA1 hash from text or a file." },
        link: "/hash/sha1",
        category: [{ de: "Hashing", en: "Hashing" }],
        tags: ["Cryptography", "Hashing"],
        tokens: 0,
    },
    {
        name: { de: "SHA256 Hash Generator", en: "SHA256 Hash Generator" },
        description: { de: "Erstellt einen SHA256 Hash aus einem Text oder einer Datei.", en: "Creates a SHA256 hash from text or a file." },
        link: "/hash/sha256",
        category: [{ de: "Hashing", en: "Hashing" }],
        tags: ["Cryptography", "Hashing"],
        tokens: 0,
    },
    {
        name: { de: "RSA Keygen + Ver-/Entschlüsselung", en: "RSA Keygen + Encryption/Decryption" },
        description: { de: "Erstellt RSA 2048 Bit Keys im Browser und kann Daten ver- und entschlüsseln.", en: "Creates RSA 2048-bit keys in the browser and can encrypt and decrypt data." },
        link: "/crypt/rsa",
        category: [{ de: "Kryptografie", en: "Cryptography" }],
        tags: ["Cryptography", "RSA"],
        tokens: 0,
    },
    {
        name: { de: "AES Ver-/Entschlüsselung", en: "AES Encryption/Decryption" },
        description: { de: "AES-256 Bit Ver- und Entschlüsselung mit AES-GCM im Browser.", en: "AES-256-bit encryption and decryption with AES-GCM in the browser." },
        link: "/crypt/aes",
        category: [{ de: "Kryptografie", en: "Cryptography" }],
        tags: ["Cryptography", "AES"],
        tokens: 0,
    },
    {
        name: { de: "PFX/PKCS#12 Generator", en: "PFX/PKCS#12 Generator" },
        description: { de: "Erstellt ein PFX/PKCS#12 Zertifikat aus Private Key, Certificate und optionaler CA-Chain.", en: "Creates a PFX/PKCS#12 certificate from Private Key, Certificate and optional CA chain." },
        link: "/crypt/pfx",
        category: [{ de: "Kryptografie", en: "Cryptography" }],
        tags: ["Cryptography", "PFX", "PKCS#12", "Certificate"],
        tokens: 0,
    },
    {
        name: { de: "CSR Generator & Parser", en: "CSR Generator & Parser" },
        description: { de: "Erstellt oder parst Certificate Signing Requests (CSR) im Browser.", en: "Creates or parses Certificate Signing Requests (CSR) in the browser." },
        link: "/crypt/csr",
        category: [{ de: "Kryptografie", en: "Cryptography" }],
        tags: ["Cryptography", "CSR", "Certificate", "SSL"],
        tokens: 0,
    },
    {
        name: { de: "Zertifikat Parser", en: "Certificate Parser" },
        description: { de: "Parst und analysiert X.509 Zertifikate im PEM-Format, einschließlich Zertifikatsketten.", en: "Parses and analyzes X.509 certificates in PEM format, including certificate chains." },
        link: "/crypt/certificate",
        category: [{ de: "Kryptografie", en: "Cryptography" }],
        tags: ["Cryptography", "Certificate", "X.509", "SSL", "TLS"],
        tokens: 0,
    },
    {
        name: { de: "Fortschrittsbalken Generator", en: "Progress Bar Generator" },
        description: { de: "Erstellt einen Fortschrittsbalken als Bild mit verschiedenen Parametern.", en: "Creates a progress bar as an image with various parameters." },
        link: "/image/progress-bar",
        category: [{ de: "Bilder", en: "Images" }],
        tags: ["Bilder", "Fortschrittsbalken"],
        tokens: 0,
    },
    {
        name: { de: "PNG zu ICO", en: "PNG to ICO" },
        description: { de: "Konvertiert PNG-Bilder zu ICO-Format. Ermöglicht die Auswahl der Auflösung.", en: "Converts PNG images to ICO format. Allows selection of resolution." },
        link: "/image/png2ico",
        category: [{ de: "Bilder", en: "Images" }],
        tags: ["Bilder", "ICO", "PNG", "Icon"],
        tokens: 0,
    },
    {
        name: { de: "Kennwort Generator", en: "Password Generator" },
        description: { de: "Erstellt sichere Kennwörter basierend auf benutzerdefinierten Vorlagen.", en: "Creates secure passwords based on custom templates." },
        link: "/security/password-generator",
        category: [{ de: "Sicherheit", en: "Security" }],
        tags: ["Kennwort", "Sicherheit"],
        tokens: 0,
    },
    {
        name: { de: "SPF Generator", en: "SPF Generator" },
        description: { de: "Erstellt SPF-DNS-Einträge im Browser.", en: "Creates SPF DNS entries in the browser." },
        link: "/security/spf",
        category: [{ de: "Sicherheit", en: "Security" }, { de: "DNS", en: "DNS" }],
        tags: ["SPF", "DNS"],
        tokens: 0,
    },
    {
        name: { de: "DKIM Generator", en: "DKIM Generator" },
        description: { de: "Erstellt DKIM-Schlüssel im Browser und generiert den DNS-Eintrag.", en: "Creates DKIM keys in the browser and generates the DNS entry." },
        link: "/security/dkim",
        category: [{ de: "Sicherheit", en: "Security" }, { de: "DNS", en: "DNS" }],
        tags: ["DKIM", "DNS"],
        tokens: 0,
    },
    {
        name: { de: "DMARC Generator", en: "DMARC Generator" },
        description: { de: "Erstellt DMARC-DNS-Einträge im Browser.", en: "Creates DMARC DNS entries in the browser." },
        link: "/security/dmarc",
        category: [{ de: "Sicherheit", en: "Security" }, { de: "DNS", en: "DNS" }],
        tags: ["DMARC", "DNS"],
        tokens: 0,
    },
    {
        name: { de: "HTTP Request Tracker", en: "HTTP Request Tracker" },
        description: { de: "Erlaubt es HTTP-Requests zu protokollieren.", en: "Allows logging of HTTP requests." },
        link: "/track/http",
        category: [{ de: "Troubleshooting", en: "Troubleshooting" }],
        tags: ["HTTP", "Logs", "Tracking"],
        tokens: 100,
    },
    {
        name: { de: "TOTP Generator", en: "TOTP Generator" },
        description: { de: "Erzeugt zeitbasierte Einmalpasswörter (TOTP) nur im Browser.", en: "Generates time-based one-time passwords (TOTP) in the browser only." },
        link: "/security/totp",
        category: [{ de: "Sicherheit", en: "Security" }],
        tags: ["TOTP", "2FA", "OTP"],
        tokens: 0,
    },
];

// Helper to get translated tool
const getTranslatedTool = (tool, locale = null) => {
    if (!tool) return null;
    const loc = locale || getCurrentLocale();
    return {
        ...tool,
        name: getTranslated(tool.name, loc),
        description: getTranslated(tool.description, loc),
        category: tool.category.map(cat => getTranslated(cat, loc)),
    };
}

export const get_tools_categories = (locale = null) => {
    const loc = locale || getCurrentLocale();
    const categories = new Set();
    tools.forEach((tool) => {
        tool.category.forEach((cat) => {
            const translatedCat = getTranslated(cat, loc);
            categories.add(translatedCat);
        });
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
}

export const get_tools_by_category = (category, locale = null) => {
    const loc = locale || getCurrentLocale();
    const toolsList = [];
    tools.forEach((tool) => {
        const translatedCategories = tool.category.map(cat => getTranslated(cat, loc));
        if (!translatedCategories.includes(category)) return;
        const translatedTool = getTranslatedTool(tool, loc);
        if (toolsList.find((t) => t.name === translatedTool.name)) return;
        toolsList.push(translatedTool);
    });
    return toolsList;
}

export const get_tools = (locale = null) => {
    const loc = locale || getCurrentLocale();
    const toolsList = [];
    tools.forEach((tool) => {
        const translatedTool = getTranslatedTool(tool, loc);
        if (toolsList.find((t) => t.name === translatedTool.name)) return;
        toolsList.push(translatedTool);
    });
    return toolsList;
}

export const get_tool_by_url = (url, locale = null) => {
    const tool = tools.find((tool) => tool.link === url);
    if (!tool) return null;
    return getTranslatedTool(tool, locale);
}
