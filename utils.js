const crypto = require('crypto');
/**
 * Function to generate random tokens
 * @param {Integer} The length of the string it should generate
 * @returns {String} A string containing the token
 */
const generateRandomToken = (length) => {
    let alphaNum,randomString;
    alphaNum = 'ABCDEFGHIJKMNOPQRSTUVWXYZ1234567890abcdefghijkmnopqrstuvwxyz';
    for (let i = 0 ; i < length ; i++) {
        randomString += alphaNum.charAt(Math.random() * alphaNum.length);
    }
    return crypto.createHash('sha256').update(randomString).digest('base64');
}

/**
 * Function to get date time in Feature
 * @param {Integer} hours 
 * @returns 
 */
const featureTime = (hours) => {
    let currentTime = new Date().getTime();
    return new Date(currentTime + hours * 60 * 60 * 1000);
}

module.exports = {generateRandomToken,featureTime};