const tools = [
    {
        name: "JSON Formatter",
        description: "Zeigt JSON-Objekte lesbar an und erlaubt Browsing von diesen.",
        link: "/formatting/json",
        category: ["Formattierung"],
        tags: ["JSON"],
        tokens: 0,
    },
    {
        name: "Bilder zu Base64",
        description: "Wandelt Bilder so um, dass sie direkt eingebettet werden können.",
        link: "/formatting/image-base64",
        category: ["Bilder", "Formattierung"],
        tags: ["Base64", "Bilder"],
        tokens: 0,
    },
    {
        name: "CSV Konverter",
        description: "Wandelt verschiedene CSV-Arten zueinander um.",
        link: "/formatting/csv",
        category: ["Formattierung"],
        tags: ["CSV"],
        tokens: 0,
    },
    {
        name: "FRITZ!Box XML zu CSV",
        description: "Wandelt ein FRITZ!Box XML Adressbuch zu CSV um.",
        link: "/formatting/fritzbox-xml2csv",
        category: ["Formattierung"],
        tags: ["FRITZ!Box", "XML", "CSV"],
        tokens: 0,
    },
    {
        name: "DNS Scanner",
        description: "Suche so viele Records wie möglich von einer Domäne.",
        link: "/dns/scan",
        category: ["DNS"],
        tags: ["DNS"],
        tokens: 300,
    },
    {
        name: "MX Resolver",
        description: "Löst die E-Mail Server einer Domäne auf und versucht den Provider zu bestimmen.",
        link: "/dns/mx",
        category: ["DNS"],
        tags: ["DNS"],
        tokens: 100,
    },
    {
        name: "NS Resolver",
        description: "Löst die Nameserver einer Domäne auf und versucht den Provider zu bestimmen.",
        link: "/dns/ns",
        category: ["DNS"],
        tags: ["DNS"],
        tokens: 100,
    },
    {
        name: "Bcrypt Hash Generator",
        description: "Erstellt oder validiert einen Bcrypt Hash im Browser aus einem Passwort.",
        link: "/hash/bcrypt",
        category: ["Hashing"],
        tags: ["Cryptography", "Hashing"],
        tokens: 0,
    },
    {
        name: "MD5 Hash Generator",
        description: "Erstellt einen MD5 Hash aus einem Text oder einer Datei.",
        link: "/hash/md5",
        category: ["Hashing"],
        tags: ["Cryptography", "Hashing"],
        tokens: 0,
    },
    {
        name: "SHA1 Hash Generator",
        description: "Erstellt einen SHA1 Hash aus einem Text oder einer Datei.",
        link: "/hash/sha1",
        category: ["Hashing"],
        tags: ["Cryptography", "Hashing"],
        tokens: 0,
    },
    {
        name: "SHA256 Hash Generator",
        description: "Erstellt einen SHA256 Hash aus einem Text oder einer Datei.",
        link: "/hash/sha256",
        category: ["Hashing"],
        tags: ["Cryptography", "Hashing"],
        tokens: 0,
    },
    {
        name: "RSA Keygen + Ver-/Entschlüsselung",
        description: "Erstellt RSA 2048 Bit Keys im Browser und kann Daten ver- und entschlüsseln.",
        link: "/crypt/rsa",
        category: ["Kryptografie"],
        tags: ["Cryptography", "RSA"],
        tokens: 0,
    },
    {
        name: "AES Ver-/Entschlüsselung",
        description: "AES-256 Bit Ver- und Entschlüsselung mit AES-GCM im Browser.",
        link: "/crypt/rsa",
        category: ["Kryptografie"],
        tags: ["Cryptography", "RSA"],
        tokens: 0,
    },
    {
        name: "Fortschrittsbalken Generator",
        description: "Erstellt einen Fortschrittsbalken als Bild mit verschiedenen Parametern.",
        link: "/image/progress-bar",
        category: ["Bilder"],
        tags: ["Bilder", "Fortschrittsbalken"],
        tokens: 0,
    },
    {
        name: "Kennwort Generator",
        description: "Erstellt sichere Kennwörter basierend auf benutzerdefinierten Vorlagen.",
        link: "/security/password-generator",
        category: ["Sicherheit"],
        tags: ["Kennwort", "Sicherheit"],
        tokens: 0,
    },
    {
        name: "SPF Generator",
        description: "Erstellt SPF-DNS-Einträge im Browser.",
        link: "/security/spf",
        category: ["Sicherheit", "DNS"],
        tags: ["SPF", "DNS"],
        tokens: 0,
    },
    {
        name: "DKIM Generator",
        description: "Erstellt DKIM-Schlüssel im Browser und generiert den DNS-Eintrag.",
        link: "/security/dkim",
        category: ["Sicherheit", "DNS"],
        tags: ["DKIM", "DNS"],
        tokens: 0,
    },
    {
        name: "DMARC Generator",
        description: "Erstellt DMARC-DNS-Einträge im Browser.",
        link: "/security/dmarc",
        category: ["Sicherheit", "DNS"],
        tags: ["DMARC", "DNS"],
        tokens: 0,
    },
];

export const get_tools_categories = () => {
    const categories = new Set();
    tools.forEach((tool) => {
        tool.category.forEach((cat) => {
            categories.add(cat);
        });
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
}

export const get_tools_by_category = (category) => {
    const toolsList = [];
    tools.forEach((tool) => {
        if (!tool.category.includes(category)) return;
        if (toolsList.find((t) => t.name === tool.name)) return;
        toolsList.push(tool);
    });
    return toolsList;
}

export const get_tools = () => {
    const toolsList = [];
    tools.forEach((tool) => {
        if (toolsList.find((t) => t.name === tool.name)) return;
        toolsList.push(tool);
    });
    return toolsList;
}

export const get_tool_by_url = (url) => {
    const tool = tools.find((tool) => tool.link === url);
    if (!tool) return null;
    return tool;
}
