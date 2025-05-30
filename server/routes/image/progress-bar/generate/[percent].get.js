
function isValidColorCode(color) {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color);
}

export default defineEventHandler((event) => {
    var [percent, extension] = getRouterParam(event, 'percent').indexOf('.') >= 1 ? getRouterParam(event, 'percent').split('.') : [getRouterParam(event, 'percent'), 'svg'];
    if (!percent || isNaN(percent) || percent < 0 || percent > 100) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid percent value. Must be a number between 0 and 100.',
            fatal: true,
        });
    }

    extension = extension.toLocaleLowerCase();
    if (!['svg'].includes(extension)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid file extension. Must be one of: svg.',
            fatal: true,
        });
    }

    const parameters = {
        width: 200,
        height: 20,
        backgroundColor: '#333',
        barColorOk: '#0d6efd',
        barColorWarn: '#ffc107',
        barColorError: '#dc3545',
        thresholdWarn: 60,
        thresholdError: 20,
        textColor: '#ffffff',
        textSize: 14,
        borderWidth: 0,
    };
    const query = getQuery(event)

    if (query.width !== undefined) {
        const w = Number(query.width);
        if (!isNaN(w) && w >= 50 && w <= 1000) {
            parameters.width = w;
        }
    }
    if (query.height !== undefined) {
        const h = Number(query.height);
        if (!isNaN(h) && h >= 15 && h <= 50) {
            parameters.height = h;
        }
    }
    if (query.backgroundColor !== undefined && typeof query.backgroundColor === 'string' && isValidColorCode(query.backgroundColor)) {
        parameters.backgroundColor = query.backgroundColor;
    }
    if (query.barColorOk !== undefined && typeof query.barColorOk === 'string' && isValidColorCode(query.barColorOk)) {
        parameters.barColorOk = query.barColorOk;
    }
    if (query.barColorWarn !== undefined && typeof query.barColorWarn === 'string' && isValidColorCode(query.barColorWarn)) {
        parameters.barColorWarn = query.barColorWarn;
    }
    if (query.barColorError !== undefined && typeof query.barColorError === 'string' && isValidColorCode(query.barColorError)) {
        parameters.barColorError = query.barColorError;
    }
    if (query.thresholdWarn !== undefined) {
        const tw = Number(query.thresholdWarn);
        if (!isNaN(tw) && tw >= 0 && tw <= 100) {
            parameters.thresholdWarn = tw;
        }
    }
    if (query.thresholdError !== undefined) {
        const te = Number(query.thresholdError);
        if (!isNaN(te) && te >= 0 && te <= 100) {
            parameters.thresholdError = te;
        }
    }
    if (query.textColor !== undefined && typeof query.textColor === 'string' && isValidColorCode(query.textColor)) {
        parameters.textColor = query.textColor;
    }
    if (query.textSize !== undefined) {
        const ts = Number(query.textSize);
        if (!isNaN(ts) && ts >= 10 && ts <= 30) {
            parameters.textSize = ts;
        }
    }
    if (query.borderWidth !== undefined) {
        const bw = Number(query.borderWidth);
        if (!isNaN(bw) && bw >= 0 && bw <= query.height / 2) {
            parameters.borderWidth = bw;
        }
    }


    if (query.printParameters !== undefined && query.printParameters === 'true') {
        return {
            percent: percent * 1,
            extension,
            parameters,
        }
    }

    const barWidth = Math.round((parameters.width - (parameters.borderWidth * 2)) * (percent / 100));
    let barColor = parameters.barColorOk;
    if (percent < parameters.thresholdError) {
        barColor = parameters.barColorError;
    } else if (percent < parameters.thresholdWarn) {
        barColor = parameters.barColorWarn;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="${parameters.width}" height="${parameters.height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${parameters.width}" height="${parameters.height}" rx="${parameters.height / 2}" fill="${parameters.backgroundColor}" />
      <rect x="${parameters.borderWidth}" y="${parameters.borderWidth}" width="${barWidth}" height="${parameters.height - (parameters.borderWidth * 2)}" rx="${(parameters.height - (parameters.borderWidth * 2)) / 2}" fill="${barColor}" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${parameters.textColor}" font-size="${parameters.textSize}" font-family="Arial, sans-serif">${percent}%</text>
    </svg>
    `.toString();

    setResponseHeader(event, 'Content-Type', 'image/svg+xml');
    return svg.split('\n').map((s) => s.trim()).join('');
});
