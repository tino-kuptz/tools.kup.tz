/**
 * Certificate Parser Utility
 * 
 * Parses X.509 certificates and extracts all relevant information.
 * Split into logical modules for maintainability.
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats a Distinguished Name (DN) as a readable string
 */
export function formatDN(dn) {
    const parts = [];
    const fields = ['CN', 'O', 'OU', 'L', 'ST', 'C', 'E', 'emailAddress'];
    fields.forEach(field => {
        const value = dn.getField(field)?.value;
        if (value) {
            parts.push(`${field}=${value}`);
        }
    });
    return parts.length > 0 ? parts.join(', ') : 'N/A';
}

/**
 * Gets all DN fields from a Distinguished Name object
 */
export function getAllDNFields(dn) {
    const fields = {};
    const knownFields = ['CN', 'O', 'OU', 'L', 'ST', 'C', 'E', 'emailAddress', 'STREET', 'DC', 'UID'];
    knownFields.forEach(field => {
        const value = dn.getField(field)?.value;
        if (value) {
            fields[field] = value;
        }
    });
    return fields;
}

/**
 * Converts Base64 string to Hex string
 */
function base64ToHex(base64) {
    try {
        const binary = atob(base64);
        let hex = '';
        for (let i = 0; i < binary.length; i++) {
            const char = binary.charCodeAt(i);
            hex += char.toString(16).padStart(2, '0');
        }
        return hex.toUpperCase();
    } catch (e) {
        return null;
    }
}

/**
 * CT Log List cache
 */
let ctLogListCache = null;
let ctLogMapCache = null;

/**
 * Loads and caches the CT Log List
 */
async function loadCTLogList() {
    if (ctLogListCache) {
        return ctLogListCache;
    }

    try {
        // Try to import the JSON file - try different import paths
        let ctLogListModule;
        try {
            ctLogListModule = await import('~/utils/ctLogList.json');
        } catch (e1) {
            try {
                ctLogListModule = await import('../utils/ctLogList.json');
            } catch (e2) {
                ctLogListModule = await import('./ctLogList.json');
            }
        }
        ctLogListCache = ctLogListModule.default || ctLogListModule;
        return ctLogListCache;
    } catch (error) {
        console.error('Failed to load CT Log List:', error);
        return null;
    }
}

/**
 * Creates a map of Log IDs (hex) to log information
 */
async function buildCTLogMap() {
    if (ctLogMapCache) {
        return ctLogMapCache;
    }

    const logList = await loadCTLogList();
    if (!logList || !logList.operators) {
        ctLogMapCache = {};
        return ctLogMapCache;
    }

    const map = {};

    logList.operators.forEach(operator => {
        const operatorName = operator.name || 'Unknown';

        // Process regular logs
        if (operator.logs && Array.isArray(operator.logs)) {
            operator.logs.forEach(log => {
                const logIdBase64 = log.log_id;
                if (logIdBase64) {
                    const logIdHex = base64ToHex(logIdBase64);
                    if (logIdHex) {
                        map[logIdHex] = {
                            operator: operatorName,
                            description: log.description || '',
                            url: log.url || '',
                            state: log.state || {},
                        };
                    }
                }
            });
        }

        // Process tiled logs
        if (operator.tiled_logs && Array.isArray(operator.tiled_logs)) {
            operator.tiled_logs.forEach(log => {
                const logIdBase64 = log.log_id;
                if (logIdBase64) {
                    const logIdHex = base64ToHex(logIdBase64);
                    if (logIdHex) {
                        map[logIdHex] = {
                            operator: operatorName,
                            description: log.description || '',
                            url: log.submission_url || log.url || '',
                            state: log.state || {},
                        };
                    }
                }
            });
        }
    });

    ctLogMapCache = map;
    return map;
}

/**
 * Resolves a CT Log ID (hex) to log information
 */
export async function resolveCTLogId(logIdHex) {
    if (!logIdHex) {
        return null;
    }

    // Normalize: remove spaces, convert to uppercase
    const normalizedLogId = logIdHex.replace(/\s/g, '').toUpperCase();

    const logMap = await buildCTLogMap();
    return logMap[normalizedLogId] || null;
}

/**
 * Converts Extended Key Usage OID to readable name
 */
export function extKeyUsageOidToName(oid) {
    const oidMap = {
        '1.3.6.1.5.5.7.3.1': 'serverAuth',
        '1.3.6.1.5.5.7.3.2': 'clientAuth',
        '1.3.6.1.5.5.7.3.3': 'codeSigning',
        '1.3.6.1.5.5.7.3.4': 'emailProtection',
        '1.3.6.1.5.5.7.3.8': 'timeStamping',
        '1.3.6.1.5.5.7.3.9': 'OCSPSigning',
        '2.5.29.37.0': 'anyExtendedKeyUsage',
        '1.3.6.1.5.5.7.3.5': 'ipsecEndSystem',
        '1.3.6.1.5.5.7.3.6': 'ipsecTunnel',
        '1.3.6.1.5.5.7.3.7': 'ipsecUser',
    };
    return oidMap[oid] || oid;
}

/**
 * Parses OID from ASN.1 bytes
 */
export function parseOidFromBytes(bytes, offset) {
    if (!bytes || offset >= bytes.length) return null;
    // OID encoding: first byte = 40 * first + second, rest are base-128
    let oid = [];
    let firstByte = bytes[offset];
    oid.push(Math.floor(firstByte / 40));
    oid.push(firstByte % 40);
    offset++;

    let value = 0;
    while (offset < bytes.length) {
        const byte = bytes[offset++];
        value = (value << 7) | (byte & 0x7f);
        if (!(byte & 0x80)) {
            oid.push(value);
            value = 0;
        }
    }
    return oid.join('.');
}

/**
 * Converts bytes to hex string
 */
export function bytesToHex(bytes) {
    if (!bytes) return 'Unknown';
    if (typeof bytes === 'string') return bytes;
    if (Array.isArray(bytes) || bytes instanceof Uint8Array) {
        return Array.from(bytes).map(b => {
            const hex = (b & 0xff).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    return String(bytes);
}

/**
 * Converts hash algorithm code to readable name
 */
export function hashAlgorithmToName(code) {
    const algorithms = {
        0: 'none',
        1: 'MD5',
        2: 'SHA1',
        3: 'SHA224',
        4: 'SHA256',
        5: 'SHA384',
        6: 'SHA512',
    };
    return algorithms[code] || `Unknown (${code})`;
}

/**
 * Converts signature algorithm code to readable name
 */
export function signatureAlgorithmToName(code) {
    const algorithms = {
        0: 'anonymous',
        1: 'RSA',
        2: 'DSA',
        3: 'ECDSA',
    };
    return algorithms[code] || `Unknown (${code})`;
}

/**
 * Parses timestamp from bytes (8 bytes, milliseconds since epoch)
 */
export function parseTimestamp(timestamp) {
    if (!timestamp) return null;
    if (typeof timestamp === 'number') {
        return timestamp > 1000000000000 ? timestamp : timestamp * 1000; // Convert seconds to ms if needed
    }
    if (Array.isArray(timestamp) && timestamp.length >= 8) {
        // Parse 8-byte timestamp (big-endian)
        let ms = 0;
        for (let i = 0; i < 8; i++) {
            ms = ms * 256 + (timestamp[i] & 0xff);
        }
        return ms;
    }
    return null;
}

/**
 * Converts string with escape sequences to bytes
 */
export function stringToBytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        // Handle Unicode escape sequences (char codes > 255)
        if (char > 255) {
            // Split into high and low byte
            bytes.push((char >> 8) & 0xff);
            bytes.push(char & 0xff);
        } else {
            bytes.push(char);
        }
    }
    return bytes;
}

// ============================================================================
// Key Usage Extraction
// ============================================================================

/**
 * Extracts Key Usage flags from certificate extension
 */
export function extractKeyUsage(cert) {
    let keyUsageFlags = null;

    // Find Key Usage extension in extensions array
    let keyUsageExt = null;
    if (cert.extensions) {
        keyUsageExt = cert.extensions.find(ext => {
            const id = ext.id || ext.oid || ext.name;
            return id === 'keyUsage' ||
                id === '2.5.29.15' ||
                (typeof id === 'string' && id.includes('keyUsage'));
        });
    }

    // Fallback to getExtension method
    if (!keyUsageExt) {
        keyUsageExt = cert.getExtension('keyUsage');
    }

    if (keyUsageExt) {
        console.log('Key Usage Extension Structure:', keyUsageExt);
        console.log('Key Usage Extension Keys:', Object.keys(keyUsageExt));

        // Method 1: Direct properties
        if (keyUsageExt.digitalSignature !== undefined) {
            keyUsageFlags = {
                digitalSignature: !!keyUsageExt.digitalSignature,
                nonRepudiation: !!keyUsageExt.nonRepudiation,
                keyEncipherment: !!keyUsageExt.keyEncipherment,
                dataEncipherment: !!keyUsageExt.dataEncipherment,
                keyAgreement: !!keyUsageExt.keyAgreement,
                keyCertSign: !!keyUsageExt.keyCertSign,
                cRLSign: !!keyUsageExt.cRLSign,
                encipherOnly: !!keyUsageExt.encipherOnly,
                decipherOnly: !!keyUsageExt.decipherOnly,
            };
        }
        // Method 2: Check if it's a BitString and parse it
        else if (keyUsageExt.value) {
            try {
                const bitString = keyUsageExt.value;
                if (typeof bitString === 'string') {
                    const bits = bitString.split('').map(b => b === '1' || b === 'true');
                    keyUsageFlags = {
                        digitalSignature: bits[0] || false,
                        nonRepudiation: bits[1] || false,
                        keyEncipherment: bits[2] || false,
                        dataEncipherment: bits[3] || false,
                        keyAgreement: bits[4] || false,
                        keyCertSign: bits[5] || false,
                        cRLSign: bits[6] || false,
                        encipherOnly: bits[7] || false,
                        decipherOnly: bits[8] || false,
                    };
                } else if (Array.isArray(bitString) || typeof bitString === 'object') {
                    const bits = Array.isArray(bitString) ? bitString : Object.values(bitString);
                    keyUsageFlags = {
                        digitalSignature: !!(bits[0] || bitString[0] || bitString.digitalSignature),
                        nonRepudiation: !!(bits[1] || bitString[1] || bitString.nonRepudiation),
                        keyEncipherment: !!(bits[2] || bitString[2] || bitString.keyEncipherment),
                        dataEncipherment: !!(bits[3] || bitString[3] || bitString.dataEncipherment),
                        keyAgreement: !!(bits[4] || bitString[4] || bitString.keyAgreement),
                        keyCertSign: !!(bits[5] || bitString[5] || bitString.keyCertSign),
                        cRLSign: !!(bits[6] || bitString[6] || bitString.cRLSign),
                        encipherOnly: !!(bits[7] || bitString[7] || bitString.encipherOnly),
                        decipherOnly: !!(bits[8] || bitString[8] || bitString.decipherOnly),
                    };
                }
            } catch (e) {
                console.error('Error parsing Key Usage bit string:', e);
            }
        }

        // Method 3: Try to parse from ASN.1 structure if available
        if (!keyUsageFlags && keyUsageExt.value) {
            try {
                const bytes = keyUsageExt.value;
                if (bytes && bytes.length > 0) {
                    const firstByte = typeof bytes[0] === 'number' ? bytes[0] : parseInt(bytes[0], 16);
                    const secondByte = bytes.length > 1 ? (typeof bytes[1] === 'number' ? bytes[1] : parseInt(bytes[1], 16)) : 0;

                    keyUsageFlags = {
                        digitalSignature: !!(firstByte & 0x80),
                        nonRepudiation: !!(firstByte & 0x40),
                        keyEncipherment: !!(firstByte & 0x20),
                        dataEncipherment: !!(firstByte & 0x10),
                        keyAgreement: !!(firstByte & 0x08),
                        keyCertSign: !!(firstByte & 0x04),
                        cRLSign: !!(firstByte & 0x02),
                        encipherOnly: !!(firstByte & 0x01),
                        decipherOnly: !!(secondByte & 0x80),
                    };
                }
            } catch (e) {
                console.error('Error parsing Key Usage from bytes:', e);
            }
        }

        // If still null, initialize with all false
        if (!keyUsageFlags) {
            keyUsageFlags = {
                digitalSignature: false,
                nonRepudiation: false,
                keyEncipherment: false,
                dataEncipherment: false,
                keyAgreement: false,
                keyCertSign: false,
                cRLSign: false,
                encipherOnly: false,
                decipherOnly: false,
            };
        }
    }

    return keyUsageFlags;
}

// ============================================================================
// Extended Key Usage Extraction
// ============================================================================

/**
 * Extracts Extended Key Usage from certificate extension
 */
export function extractExtendedKeyUsage(cert) {
    let extKeyUsageList = [];

    // Find Extended Key Usage extension in extensions array
    let extKeyUsageExt = null;
    if (cert.extensions) {
        extKeyUsageExt = cert.extensions.find(ext => {
            const id = ext.id || ext.oid || ext.name;
            return id === 'extKeyUsage' ||
                id === '2.5.29.37' ||
                (typeof id === 'string' && id.includes('extKeyUsage'));
        });
    }

    // Fallback to getExtension method
    if (!extKeyUsageExt) {
        extKeyUsageExt = cert.getExtension('extKeyUsage');
    }

    if (extKeyUsageExt) {
        console.log('Extended Key Usage Extension Structure:', extKeyUsageExt);
        console.log('Extended Key Usage Extension Keys:', Object.keys(extKeyUsageExt));

        // Method 1: Check for direct boolean properties
        const extKeyUsagePropertyNames = [
            'serverAuth', 'clientAuth', 'codeSigning', 'emailProtection',
            'timeStamping', 'OCSPSigning', 'anyExtendedKeyUsage',
            'ipsecEndSystem', 'ipsecTunnel', 'ipsecUser'
        ];

        const foundUsages = [];
        extKeyUsagePropertyNames.forEach(propName => {
            if (extKeyUsageExt[propName] === true) {
                foundUsages.push(propName);
            }
        });

        if (foundUsages.length > 0) {
            extKeyUsageList = foundUsages;
        }
        // Method 2: Direct usages property
        else if (extKeyUsageExt.usages && Array.isArray(extKeyUsageExt.usages)) {
            extKeyUsageList = extKeyUsageExt.usages.map(usage => {
                if (typeof usage === 'string') {
                    return extKeyUsageOidToName(usage);
                } else if (usage && usage.id) {
                    return extKeyUsageOidToName(usage.id);
                } else if (usage && usage.oid) {
                    return extKeyUsageOidToName(usage.oid);
                } else if (usage && usage.value) {
                    const oidValue = usage.value;
                    if (typeof oidValue === 'string') {
                        return extKeyUsageOidToName(oidValue);
                    }
                }
                return usage;
            });
        }
        // Method 3: Check if it's an array directly
        else if (Array.isArray(extKeyUsageExt)) {
            extKeyUsageList = extKeyUsageExt.map(usage => {
                if (typeof usage === 'string') {
                    return extKeyUsageOidToName(usage);
                } else if (usage && usage.id) {
                    return extKeyUsageOidToName(usage.id);
                } else if (usage && usage.oid) {
                    return extKeyUsageOidToName(usage.oid);
                } else if (usage && usage.value) {
                    const oidValue = usage.value;
                    if (typeof oidValue === 'string') {
                        return extKeyUsageOidToName(oidValue);
                    }
                }
                return usage;
            });
        }
        // Method 4: Check value property
        else if (extKeyUsageExt.value) {
            let usages = null;
            if (Array.isArray(extKeyUsageExt.value)) {
                usages = extKeyUsageExt.value;
            } else if (extKeyUsageExt.value.usages && Array.isArray(extKeyUsageExt.value.usages)) {
                usages = extKeyUsageExt.value.usages;
            } else if (typeof extKeyUsageExt.value === 'object') {
                const nestedUsages = extKeyUsageExt.value.value || extKeyUsageExt.value.list || extKeyUsageExt.value.array;
                if (Array.isArray(nestedUsages)) {
                    usages = nestedUsages;
                }
            }
            if (usages) {
                extKeyUsageList = usages.map(usage => {
                    if (typeof usage === 'string') {
                        return extKeyUsageOidToName(usage);
                    } else if (usage && usage.id) {
                        return extKeyUsageOidToName(usage.id);
                    } else if (usage && usage.oid) {
                        return extKeyUsageOidToName(usage.oid);
                    } else if (usage && usage.value) {
                        const oidValue = usage.value;
                        if (typeof oidValue === 'string') {
                            return extKeyUsageOidToName(oidValue);
                        }
                    }
                    return usage;
                });
            }
        }
        // Method 5: Try to parse from ASN.1 structure
        else if (extKeyUsageExt.asn1) {
            try {
                const asn1Value = extKeyUsageExt.asn1.value;
                if (asn1Value && Array.isArray(asn1Value)) {
                    extKeyUsageList = asn1Value.map(item => {
                        const oid = item && item.value ? item.value : item;
                        if (typeof oid === 'string') {
                            return extKeyUsageOidToName(oid);
                        }
                        return oid;
                    });
                }
            } catch (e) {
                console.warn('Error parsing extKeyUsage from ASN.1:', e);
            }
        }
    }

    return extKeyUsageList;
}

/**
 * Tries to extract Extended Key Usage from extensions array (fallback)
 */
export function extractExtendedKeyUsageFromExtensions(cert, extKeyUsageList) {
    if (extKeyUsageList.length > 0) return extKeyUsageList;

    if (cert.extensions) {
        cert.extensions.forEach(ext => {
            const extId = ext.name || ext.id || ext.oid;
            if (extId === 'extKeyUsage' || extId === '2.5.29.37') {
                console.log('Found extKeyUsage in extensions array:', ext);

                const extKeyUsagePropertyNames = [
                    'serverAuth', 'clientAuth', 'codeSigning', 'emailProtection',
                    'timeStamping', 'OCSPSigning', 'anyExtendedKeyUsage',
                    'ipsecEndSystem', 'ipsecTunnel', 'ipsecUser'
                ];

                const foundUsages = [];
                extKeyUsagePropertyNames.forEach(propName => {
                    if (ext[propName] === true) {
                        foundUsages.push(propName);
                    }
                });

                if (foundUsages.length > 0) {
                    extKeyUsageList.push(...foundUsages);
                } else {
                    // Try other methods
                    let usages = null;
                    if (ext.usages && Array.isArray(ext.usages)) {
                        usages = ext.usages;
                    } else if (Array.isArray(ext)) {
                        usages = ext;
                    } else if (ext.value) {
                        if (Array.isArray(ext.value)) {
                            usages = ext.value;
                        } else if (ext.value.usages && Array.isArray(ext.value.usages)) {
                            usages = ext.value.usages;
                        } else if (typeof ext.value === 'object') {
                            const nestedUsages = ext.value.value || ext.value.list || ext.value.array;
                            if (Array.isArray(nestedUsages)) {
                                usages = nestedUsages;
                            }
                        }
                    }

                    if (usages && Array.isArray(usages) && usages.length > 0) {
                        extKeyUsageList.push(...usages.map(usage => {
                            if (typeof usage === 'string') {
                                return extKeyUsageOidToName(usage);
                            } else if (usage && usage.id) {
                                return extKeyUsageOidToName(usage.id);
                            } else if (usage && usage.oid) {
                                return extKeyUsageOidToName(usage.oid);
                            } else if (usage && usage.value) {
                                const oidValue = usage.value;
                                if (typeof oidValue === 'string') {
                                    return extKeyUsageOidToName(oidValue);
                                }
                            }
                            return usage;
                        }));
                    }
                }
            }
        });
    }

    return extKeyUsageList;
}

// ============================================================================
// CRL Distribution Points Extraction
// ============================================================================

/**
 * Extracts CRL Distribution Points URLs from certificate
 */
export function extractCRLDistributionPoints(cert) {
    const crlUrls = [];
    let crlDistPoints = cert.getExtension('cRLDistributionPoints');

    // Also try to find it in extensions array directly
    if (!crlDistPoints && cert.extensions) {
        crlDistPoints = cert.extensions.find(ext => {
            const id = ext.id || ext.oid || ext.name;
            return id === 'cRLDistributionPoints' ||
                id === '2.5.29.31' ||
                (typeof id === 'string' && id.includes('cRLDistributionPoints'));
        });
    }

    if (crlDistPoints) {
        try {
            if (crlDistPoints.crls) {
                crlDistPoints.crls.forEach(crl => {
                    if (crl.uri) {
                        crlUrls.push(...(Array.isArray(crl.uri) ? crl.uri : [crl.uri]));
                    }
                });
            } else if (crlDistPoints.uri) {
                crlUrls.push(...(Array.isArray(crlDistPoints.uri) ? crlDistPoints.uri : [crlDistPoints.uri]));
            } else if (crlDistPoints.value) {
                const value = crlDistPoints.value;
                if (typeof value === 'string') {
                    const urlRegex = /https?:\/\/[^\s]+/g;
                    const matches = value.match(urlRegex);
                    if (matches) {
                        crlUrls.push(...matches);
                    }
                } else if (Array.isArray(value)) {
                    value.forEach(item => {
                        if (typeof item === 'string' && item.startsWith('http')) {
                            crlUrls.push(item);
                        } else if (item && item.uri) {
                            crlUrls.push(...(Array.isArray(item.uri) ? item.uri : [item.uri]));
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('Error parsing CRL Distribution Points:', e, crlDistPoints);
        }
    }

    return crlUrls;
}

// ============================================================================
// Certificate Transparency Parsing
// ============================================================================

/**
 * Parses Certificate Transparency (SCT) information from certificate
 */
export function parseCertificateTransparency(cert) {
    const ctInfo = {
        present: false,
        scts: [],
    };

    let sct = cert.getExtension('1.3.6.1.4.1.11129.2.4.2'); // SignedCertificateTimestampList

    // Also try to find it in extensions array
    if (!sct && cert.extensions) {
        sct = cert.extensions.find(ext => {
            const id = ext.id || ext.oid || ext.name;
            return id === '1.3.6.1.4.1.11129.2.4.2' ||
                (typeof id === 'string' && id.includes('11129.2.4.2'));
        });
    }

    if (sct) {
        ctInfo.present = true;

        try {
            console.log('SCT Extension Structure:', sct);
            console.log('SCT Extension Keys:', Object.keys(sct));

            const sctList = sct.value || sct.list || sct;

            // Try to parse SCTs
            if (sctList && typeof sctList === 'object') {
                // If it's an array of SCTs
                if (Array.isArray(sctList)) {
                    sctList.forEach((sctItem, idx) => {
                        try {
                            const logId = sctItem.logId || sctItem.log_id || sctItem.logID || sctItem.id;
                            const timestamp = sctItem.timestamp || sctItem.timestamp_ms || sctItem.timestampMs;

                            const logIdHex = bytesToHex(logId);
                            const timestampMs = parseTimestamp(timestamp);

                            // Extract additional SCT fields if available
                            const version = sctItem.version !== undefined ? sctItem.version : null;
                            const extensions = sctItem.extensions || sctItem.exts || null;
                            const hashAlgorithm = sctItem.hashAlgorithm || sctItem.hash_algorithm || null;
                            const signatureAlgorithm = sctItem.signatureAlgorithm || sctItem.signature_algorithm || null;
                            const signature = sctItem.signature || sctItem.sig || null;

                            ctInfo.scts.push({
                                index: idx + 1,
                                version: version,
                                logId: logIdHex,
                                timestamp: timestampMs ? new Date(timestampMs).toISOString() : null,
                                timestampMs: timestampMs,
                                extensions: extensions ? (typeof extensions === 'string' ? extensions : bytesToHex(extensions)) : null,
                                hashAlgorithm: hashAlgorithm,
                                signatureAlgorithm: signatureAlgorithm,
                                signature: signature ? bytesToHex(signature) : null,
                            });
                        } catch (e) {
                            console.warn('Error parsing SCT:', e, sctItem);
                        }
                    });
                } else if (sctList.scts || sctList.timestamps || sctList.list) {
                    const scts = sctList.scts || sctList.list || [];
                    scts.forEach((sctItem, idx) => {
                        try {
                            const logId = sctItem.logId || sctItem.log_id || sctItem.logID || sctItem.id;
                            const timestamp = sctItem.timestamp || sctItem.timestamp_ms || sctItem.timestampMs;

                            const logIdHex = bytesToHex(logId);
                            const timestampMs = parseTimestamp(timestamp);

                            // Extract additional SCT fields if available
                            const version = sctItem.version !== undefined ? sctItem.version : null;
                            const extensions = sctItem.extensions || sctItem.exts || null;
                            const hashAlgorithm = sctItem.hashAlgorithm || sctItem.hash_algorithm || null;
                            const signatureAlgorithm = sctItem.signatureAlgorithm || sctItem.signature_algorithm || null;
                            const signature = sctItem.signature || sctItem.sig || null;

                            ctInfo.scts.push({
                                index: idx + 1,
                                version: version,
                                logId: logIdHex,
                                timestamp: timestampMs ? new Date(timestampMs).toISOString() : null,
                                timestampMs: timestampMs,
                                extensions: extensions ? (typeof extensions === 'string' ? extensions : bytesToHex(extensions)) : null,
                                hashAlgorithm: hashAlgorithm,
                                signatureAlgorithm: signatureAlgorithm,
                                signature: signature ? bytesToHex(signature) : null,
                            });
                        } catch (e) {
                            console.warn('Error parsing SCT from list:', e);
                        }
                    });
                }
            }

            // If no SCTs parsed but extension exists, try to parse from raw ASN.1
            if (ctInfo.scts.length === 0) {
                try {
                    let sctListBytes = null;

                    if (sct.value) {
                        if (typeof sct.value === 'string') {
                            if (/^[0-9a-fA-F]+$/.test(sct.value.replace(/\s/g, ''))) {
                                sctListBytes = sct.value.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
                            } else {
                                sctListBytes = stringToBytes(sct.value);

                                if (sctListBytes.length > 0 && sctListBytes[0] === 0x04) {
                                    let lengthOffset = 1;
                                    let length = 0;

                                    if (sctListBytes[lengthOffset] & 0x80) {
                                        const lengthBytes = sctListBytes[lengthOffset] & 0x7f;
                                        lengthOffset++;
                                        for (let i = 0; i < lengthBytes && lengthOffset < sctListBytes.length; i++) {
                                            length = (length << 8) | sctListBytes[lengthOffset++];
                                        }
                                    } else {
                                        length = sctListBytes[lengthOffset++];
                                    }

                                    if (lengthOffset + length <= sctListBytes.length) {
                                        sctListBytes = sctListBytes.slice(lengthOffset, lengthOffset + length);
                                    }
                                }
                            }
                        } else if (Array.isArray(sct.value) || sct.value instanceof Uint8Array) {
                            sctListBytes = Array.from(sct.value);
                        } else if (sct.value.value) {
                            const nested = sct.value.value;
                            if (Array.isArray(nested) || nested instanceof Uint8Array) {
                                sctListBytes = Array.from(nested);
                            } else if (typeof nested === 'string') {
                                sctListBytes = stringToBytes(nested);
                            }
                        }
                    }

                    // Parse SCT list from bytes
                    if (sctListBytes && sctListBytes.length > 0) {
                        let offset = 0;
                        let sctIndex = 0;

                        if (sctListBytes.length >= 2) {
                            const listLength = (sctListBytes[0] << 8) | sctListBytes[1];
                            offset = 2;

                            const expectedEnd = offset + listLength;
                            if (expectedEnd <= sctListBytes.length) {
                                while (offset < expectedEnd - 43) {
                                    try {
                                        if (offset + 2 > sctListBytes.length) break;
                                        const sctLength = (sctListBytes[offset] << 8) | sctListBytes[offset + 1];
                                        offset += 2;

                                        if (sctLength > 0 && offset + sctLength <= sctListBytes.length && offset + sctLength <= expectedEnd) {
                                            const sctStartOffset = offset; // Remember start of SCT for version

                                            if (offset + 1 > sctListBytes.length) break;
                                            const version = sctListBytes[offset];
                                            offset += 1; // version

                                            if (offset + 32 > sctListBytes.length) break;
                                            const logIdBytes = sctListBytes.slice(offset, offset + 32);
                                            offset += 32;

                                            if (offset + 8 > sctListBytes.length) break;
                                            const timestampBytes = sctListBytes.slice(offset, offset + 8);
                                            offset += 8;

                                            const logIdHex = bytesToHex(logIdBytes);
                                            const timestampMs = parseTimestamp(timestampBytes);

                                            // Parse remaining SCT fields
                                            let extensions = null;
                                            let hashAlgorithm = null;
                                            let signatureAlgorithm = null;
                                            let signature = null;

                                            // After timestamp, there are extensions (if any), then hash/signature algorithms and signature
                                            // Extensions: 2 bytes length + data (if length > 0)
                                            if (offset + 2 <= sctListBytes.length && offset < expectedEnd) {
                                                const extLength = (sctListBytes[offset] << 8) | sctListBytes[offset + 1];
                                                offset += 2;

                                                if (extLength > 0 && offset + extLength <= sctListBytes.length && offset + extLength <= expectedEnd) {
                                                    extensions = sctListBytes.slice(offset, offset + extLength);
                                                    offset += extLength;
                                                }
                                            }

                                            // Hash Algorithm (1 byte)
                                            if (offset + 1 <= sctListBytes.length && offset < expectedEnd) {
                                                hashAlgorithm = sctListBytes[offset];
                                                offset += 1;
                                            }

                                            // Signature Algorithm (1 byte)
                                            if (offset + 1 <= sctListBytes.length && offset < expectedEnd) {
                                                signatureAlgorithm = sctListBytes[offset];
                                                offset += 1;
                                            }

                                            // Signature: 2 bytes length + data
                                            if (offset + 2 <= sctListBytes.length && offset < expectedEnd) {
                                                const sigLength = (sctListBytes[offset] << 8) | sctListBytes[offset + 1];
                                                offset += 2;

                                                if (sigLength > 0 && offset + sigLength <= sctListBytes.length && offset + sigLength <= expectedEnd) {
                                                    signature = sctListBytes.slice(offset, offset + sigLength);
                                                    offset += sigLength;
                                                }
                                            }

                                            ctInfo.scts.push({
                                                index: ++sctIndex,
                                                version: version,
                                                logId: logIdHex,
                                                timestamp: timestampMs ? new Date(timestampMs).toISOString() : null,
                                                timestampMs: timestampMs,
                                                extensions: extensions ? bytesToHex(extensions) : null,
                                                hashAlgorithm: hashAlgorithm,
                                                signatureAlgorithm: signatureAlgorithm,
                                                signature: signature ? bytesToHex(signature) : null,
                                            });
                                        } else {
                                            break;
                                        }
                                    } catch (e) {
                                        console.warn('Error parsing SCT at offset', offset, e);
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    // If still no SCTs, store raw data
                    if (ctInfo.scts.length === 0) {
                        try {
                            const seen = new WeakSet();
                            ctInfo.raw = JSON.stringify(sct, (key, value) => {
                                if (value && typeof value === 'object') {
                                    if (seen.has(value)) {
                                        return '[Circular]';
                                    }
                                    seen.add(value);
                                    if (value instanceof Uint8Array || Array.isArray(value)) {
                                        return Array.from(value).map(b => (b & 0xff).toString(16).padStart(2, '0')).join('');
                                    }
                                }
                                return value;
                            }, 2);
                        } catch (e) {
                            ctInfo.raw = 'SCT Extension vorhanden, aber Struktur konnte nicht serialisiert werden: ' + e.message;
                        }
                    }
                } catch (e) {
                    console.warn('Error parsing SCT from bytes:', e);
                }
            }
        } catch (e) {
            console.error('Error parsing Certificate Transparency:', e);
            try {
                ctInfo.raw = JSON.stringify(sct, (key, value) => {
                    if (value && typeof value === 'object') {
                        if (value instanceof Uint8Array || Array.isArray(value)) {
                            return Array.from(value).map(b => (b & 0xff).toString(16).padStart(2, '0')).join('');
                        }
                    }
                    return value;
                }, 2);
            } catch (e2) {
                ctInfo.raw = 'Fehler beim Serialisieren der SCT-Daten';
            }
        }
    }

    return ctInfo;
}

// ============================================================================
// Self-Signed Detection
// ============================================================================

/**
 * Checks if a certificate is self-signed by comparing issuer and subject DN fields
 */
export function isSelfSignedCertificate(issuer, subject) {
    const issuerFields = getAllDNFields(issuer);
    const subjectFields = getAllDNFields(subject);
    const allKeys = new Set([...Object.keys(issuerFields), ...Object.keys(subjectFields)]);

    if (allKeys.size === 0) return false;

    // Check if all fields match
    for (const key of allKeys) {
        if (issuerFields[key] !== subjectFields[key]) {
            return false;
        }
    }

    return true;
}

// ============================================================================
// Issuer Certificate Finding
// ============================================================================

/**
 * Finds issuer certificates for each certificate in the chain
 */
export function findIssuerCertificates(parsedCertificates) {
    parsedCertificates.forEach(cert => {
        if (cert.issuerDNFields && !cert.isSelfSigned) {
            for (let j = 0; j < parsedCertificates.length; j++) {
                const otherCert = parsedCertificates[j];
                if (otherCert.subjectDNFields && cert.index !== otherCert.index) {
                    const issuerKeys = Object.keys(cert.issuerDNFields);
                    const subjectKeys = Object.keys(otherCert.subjectDNFields);

                    if (issuerKeys.length > 0 && subjectKeys.length > 0) {
                        let allMatch = true;
                        let hasMatch = false;

                        for (const key of issuerKeys) {
                            if (otherCert.subjectDNFields.hasOwnProperty(key)) {
                                hasMatch = true;
                                if (cert.issuerDNFields[key] !== otherCert.subjectDNFields[key]) {
                                    allMatch = false;
                                    break;
                                }
                            } else {
                                allMatch = false;
                                break;
                            }
                        }

                        if (allMatch && hasMatch) {
                            cert.issuerCertificateIndex = otherCert.index;
                            break;
                        }
                    }
                }
            }
        }
    });

    return parsedCertificates;
}

// ============================================================================
// Main Parsing Function
// ============================================================================

/**
 * Parses a single certificate and extracts all information
 */
export function parseSingleCertificate(certPem, index, forge) {
    const cert = forge.default.pki.certificateFromPem(certPem);

    // Extract basic information
    const subject = cert.subject;
    const issuer = cert.issuer;
    const publicKey = cert.publicKey;

    // Public Key Info
    const modulus = publicKey.n ? publicKey.n.toString(16) : null;
    const exponent = publicKey.e ? publicKey.e.toString(16) : null;
    const keySize = publicKey.n ? publicKey.n.bitLength() : null;
    const keyType = publicKey.n ? 'RSA' : 'Unknown';

    // Validity
    const notBefore = cert.validity.notBefore;
    const notAfter = cert.validity.notAfter;
    const now = new Date();
    const isValid = now >= notBefore && now <= notAfter;

    // Basic Constraints
    const basicConstraints = cert.getExtension('basicConstraints');
    const isCA = basicConstraints ? (basicConstraints.cA || false) : false;

    // Extract extensions
    const keyUsageFlags = extractKeyUsage(cert);
    let extKeyUsageList = extractExtendedKeyUsage(cert);
    const crlUrls = extractCRLDistributionPoints(cert);
    const ctInfo = parseCertificateTransparency(cert);

    // Subject Alternative Names
    const san = cert.getExtension('subjectAltName');
    const altNames = san ? (san.altNames || []) : [];

    // DN formatting
    const issuerDN = formatDN(issuer);
    const subjectDN = formatDN(subject);
    const issuerFields = getAllDNFields(issuer);
    const subjectFields = getAllDNFields(subject);

    // Self-signed check
    const isSelfSigned = isSelfSignedCertificate(issuer, subject);

    // Serial Number
    const serialNumber = cert.serialNumber;

    // Signature Algorithm
    const signatureOid = cert.signatureOid;
    const signatureAlgorithm = cert.signature ? cert.signature.algorithm || signatureOid : signatureOid;

    // All extensions
    const allExtensions = {};
    if (cert.extensions) {
        cert.extensions.forEach(ext => {
            const extId = ext.name || ext.id || ext.oid;
            allExtensions[extId] = {
                id: ext.id,
                name: ext.name,
                oid: ext.oid,
                critical: ext.critical || false,
                value: ext.value || ext.toString(),
                raw: ext,
            };

            // Try to extract keyUsage from extensions array if not found
            if ((extId === 'keyUsage' || extId === '2.5.29.15') && !keyUsageFlags) {
                if (ext.digitalSignature !== undefined) {
                    // This will be handled by extractKeyUsage, but we can set it here as fallback
                }
            }

            // Try to extract extKeyUsage from extensions array if not found
            extKeyUsageList = extractExtendedKeyUsageFromExtensions(cert, extKeyUsageList);
        });
    }

    return {
        index: index,
        pem: certPem,
        subject: {
            CN: subject.getField('CN')?.value || '',
            O: subject.getField('O')?.value || '',
            OU: subject.getField('OU')?.value || '',
            L: subject.getField('L')?.value || '',
            ST: subject.getField('ST')?.value || '',
            C: subject.getField('C')?.value || '',
            emailAddress: subject.getField('E')?.value || subject.getField('emailAddress')?.value || '',
            fullDN: subjectDN,
        },
        issuer: {
            CN: issuer.getField('CN')?.value || '',
            O: issuer.getField('O')?.value || '',
            OU: issuer.getField('OU')?.value || '',
            L: issuer.getField('L')?.value || '',
            ST: issuer.getField('ST')?.value || '',
            C: issuer.getField('C')?.value || '',
            fullDN: issuerDN,
        },
        issuerDNFields: issuerFields,
        subjectDNFields: subjectFields,
        publicKey: {
            type: keyType,
            keySize: keySize,
            keySizeBits: keySize,
            keySizeBytes: keySize ? Math.ceil(keySize / 8) : null,
            modulus: modulus ? {
                hex: modulus,
                length: modulus.length,
            } : null,
            exponent: exponent ? {
                hex: exponent,
                decimal: publicKey.e ? publicKey.e.toString(10) : null,
            } : null,
        },
        validity: {
            notBefore: notBefore.toISOString(),
            notAfter: notAfter.toISOString(),
            isValid: isValid,
            daysRemaining: Math.floor((notAfter - now) / (1000 * 60 * 60 * 24)),
        },
        basicConstraints: {
            isCA: isCA,
            pathLength: basicConstraints ? (basicConstraints.pathLenConstraint || null) : null,
        },
        crlDistributionPoints: crlUrls,
        keyUsage: keyUsageFlags,
        extKeyUsage: extKeyUsageList,
        subjectAltNames: altNames,
        certificateTransparency: ctInfo,
        serialNumber: serialNumber,
        signatureAlgorithm: signatureAlgorithm,
        isSelfSigned: isSelfSigned,
        version: cert.version || 0,
        extensions: allExtensions,
    };
}

/**
 * Parses multiple certificates from PEM text
 */
export async function parseCertificates(certText) {
    const forge = await import('node-forge');

    // Split multiple certificates
    const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
    const matches = certText.trim().match(certRegex);

    if (!matches || matches.length === 0) {
        throw new Error('Kein gültiges Zertifikat im PEM-Format gefunden');
    }

    const parsedCertificates = [];

    for (let i = 0; i < matches.length; i++) {
        try {
            const certPem = matches[i];
            const parsedCert = parseSingleCertificate(certPem, i + 1, forge);
            parsedCertificates.push(parsedCert);
        } catch (error) {
            console.error(`Fehler beim Parsen von Zertifikat ${i + 1}:`, error);
            parsedCertificates.push({
                index: i + 1,
                error: error.message,
                pem: matches[i],
            });
        }
    }

    // Find issuer certificates
    findIssuerCertificates(parsedCertificates);

    return parsedCertificates;
}

/**
 * Checks if the certificate chain is complete
 */
export function checkChainCompleteness(parsedCertificates) {
    if (parsedCertificates.length === 0) {
        return null;
    }

    const lastCert = parsedCertificates[parsedCertificates.length - 1];
    if (lastCert.isSelfSigned) {
        return {
            complete: true,
            message: 'Die Zertifikatskette scheint vollständig (letztes Zertifikat ist self-signed)',
        };
    } else {
        return {
            complete: false,
            message: 'Die Zertifikatskette ist möglicherweise unvollständig oder in der falschen Reihenfolge (letztes Zertifikat ist nicht self-signed)',
        };
    }
}

