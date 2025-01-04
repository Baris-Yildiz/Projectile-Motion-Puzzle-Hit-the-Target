function RGBAToHSLA(rgba) {
    let r = rgba.r / 255;
    let g = rgba.g / 255;
    let b = rgba.b / 255;

    let min_channel = Math.min(r,g,b);
    let max_channel = Math.max(r,g,b);
    let delta = max_channel - min_channel;
    let h;

    if (delta === 0) {
        h = 0;
    } else {
        switch (max_channel) {
            case r:
                h = ((g - b) / delta) % 6;
                break;
            case g:
                h = ((b - r) / delta) + 2;
                break;
            case b:
                h = ((r - g) / delta) + 4;
                break;
        }
        h = Math.round(h * 60);

        if (h < 0) {
            h += 360;
        }
    }

    let l = (max_channel + min_channel) / 2.0;
    let s = delta === 0 ? 0 : delta/ (1 - Math.abs(2 * l - 1));

    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return {h:h, s:s, l:l, a:rgba.a};
}

function HSLAToRGBA(hsla) {
    let s = hsla.s / 100;
    let l = hsla.l / 100;
    let h = hsla.h;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (60 <= h && h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (120 <= h && h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (180 <= h && h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (240 <= h && h < 300) {
        r = x;
        g = 0;
        b = c;
    } else if (300 <= h && h < 360) {
        r = c;
        g = 0;
        b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return {r:r, g:g, b:b, a:hsla.a};
}

function invertRGBA(rgba) {
    rgba.r = 255-rgba.r;
    rgba.g = 255-rgba.g;
    rgba.b = 255-rgba.b;
}

function adjustSaturationRGBA(rgba, s) {
    let hsla = RGBAToHSLA(rgba);
    hsla.s += s/100 * hsla.s;
    //hsla.s = 0;
    return HSLAToRGBA(hsla);
}

function adjustBrightnessRGBA(rgba, l) {
    rgba.r += l;
    rgba.g += l;
    rgba.b += l;
    /*
    let hsla = RGBAToHSLA(rgba);
    hsla.l += l/100 * hsla.l;
    return HSLAToRGBA(hsla);*/
}

function adjustBrightnessAndContrast(rgba, b, c) {
    rgba.r = rgba.r * c + b
    rgba.g = rgba.g * c + b
    rgba.b = rgba.b * c + b
}