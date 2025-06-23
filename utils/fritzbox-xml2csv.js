import parsePhoneNumber from 'libphonenumber-js';
import xml2js from 'xml2js';

export async function fritzbox_xml2csv(xmlString, seperator = ';', formatNumbers = { do: false, doAdvanced: false, countryPrefix: 'DE', areaCode: '04321' }) {
    const csv_head = [
        'Name', 'Number type', 'Number'
    ];

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlString);

    const phonebook = result.phonebooks?.phonebook?.[0] || result.phonebook;
    if (!phonebook || !phonebook.contact) {
        throw new Error('No contacts found in the XML string.');
    }

    const records = [];
    for (const contact of phonebook.contact) {
        const person = contact.person?.[0];
        const name = person?.realName?.[0] || '';
        const telephony = contact.telephony || [];
        for (const t of telephony) {
            for (const n of t.number || []) {
                var number = n._ || '';
                if (!number) continue;
                if (formatNumbers.do) {
                    try {
                        var formattedNumber = number;

                        if (formatNumbers.doAdvanced && number.trim().substring(0, 1) !== "0") {
                            formattedNumber = formatNumbers.areaCode + " " + number;
                        }

                        var phoneNumber = parsePhoneNumber(formattedNumber, formatNumbers.countryPrefix);

                        if (phoneNumber) {
                            number = phoneNumber.formatInternational();
                        } else {
                            console.warn(`Could not parse phone number: ${formattedNumber}`);
                        }
                    } catch (error) { }
                }
                const type = n.$?.type || '';
                const csvRow = Array(csv_head.length).fill('');
                csvRow[0] = name;
                csvRow[1] = type;
                csvRow[2] = number;
                records.push(csvRow);
            }
        }
    }

    const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;
    const csvRows = [
        csv_head.map(escape).join(seperator),
        ...records.map(row => row.map(escape).join(seperator))
    ];
    return csvRows.join('\n');
}
