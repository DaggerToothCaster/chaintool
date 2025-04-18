export const Fixed = (
    total,
    length = 4
) => {
    if (total.toString().indexOf("e-") != -1) {
        return 0
    }
    if (!total.toString()) {
        return 0;
    }
    let point = total.toString();
    if (point.indexOf(".") != -1) {
        point = point.split(".");

        if (point[1].length >= length) {
            total = point[0] + "." + point[1].substring(0, length);
            return total.toString();
        } else {
            return total.toString();
        }
    } else {
        return total.toString();
    }
}


/**
 * @dev 钱包用户名保留前6后4位，中间mask
 * @param {*} address 
 * @returns 
 */
export function maskAddress(address) {
    if (!address || address.length < 11) return address
    return address.slice(0, 6) + '...' + address.slice(address.length - 4)
}