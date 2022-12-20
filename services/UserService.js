const database = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utility = require('../utils');

const SALTROUNDS = 10;

class UserService {
    /**
     * Function to list in batches of 50
     * @param {Integer} offset where it should start from 
     * @returns {Object}
     */
    static async getList(offset) {
        return await database.postgresPool.query('SELECT * FROM users OFFSET $1 LIMIT 50', [offset]);
    }
    /**
     * Function to login and generate a jwt token
     * @param {String} username 
     * @param {String} password 
     * @returns {Object} 
     */
    static async login(username, password) {
        let queryResult, comparePassword, response, token, userDetails, refreshToken;
        queryResult = await database.postgresPool.query('SELECT id, username,password FROM users WHERE username=$1', [username]);
        // if user exists check if password is valid then generate a token
        if (queryResult.rowCount == 1) {
            userDetails = queryResult.rows[0];
            comparePassword = await bcrypt.compare(password, userDetails.password);
            if (comparePassword) {
                // Generate JWT token
                token = jwt.sign({
                    userId: userDetails.id,
                }, process.env.JWT_SECRET, {
                    expiresIn: '1h',
                });
                refreshToken = Utility.generateRandomToken(45);
                console.log(Utility.featureTime(48));
                await database.postgresPool.query('INSERT INTO user_refresh_tokens(user_id,token,created,expiry_time) VALUES($1, $2, NOW(), $3) '
                    , [userDetails.id, refreshToken, Utility.featureTime(48)]);
                response = {
                    success: true,
                    token: token,
                    refreshToken: refreshToken,
                }
                return response;
            }
        }
        response = {
            success: false,
            errorMessage: 'Invalid Username or Password '
        }
        return response;
    }
    /**
     * Function to register users
     * @param {Object} An object describing the user to be registered
     * @returns {Object}
     */
    static async register() {


    }
    /**
     * Function to generate refresh token
     * @param {String} A string containing the refresh token
     * @returns {Object} 
     */
    static async refreshToken(oldRefreshToken) {
        let queryResults, token, results, userDetails, newRefreshToken;
        queryResults = await database.postgresPool.query('SELECT user_id, token FROM user_refresh_tokens WHERE token = $1 AND expiry_time > NOW() ', [oldRefreshToken]);
        // If token exists then generate new jwt and refresh token for the current loggin in user
        if (queryResults.rowCount == 1) {
            try {
                userDetails = queryResults.rows[0];
                await database.postgresPool.query('BEGIN');
                // Remove refresh token and generate new jwt token
                await database.postgresPool.query('DELETE FROM user_refresh_tokens WHERE token = $1', [oldRefreshToken]);
                token = jwt.sign({
                    userId: userDetails.user_id,
                }, process.env.JWT_SECRET, {
                    expiresIn: '1h',
                });
                newRefreshToken = Utility.generateRandomToken(45);
                await database.postgresPool.query('INSERT INTO user_refresh_tokens(user_id,token,created,expiry_time) VALUES($1, $2, NOW(), $3) '
                    , [userDetails.user_id, newRefreshToken, Utility.featureTime(48)]);
                await database.postgresPool.query('COMMIT');
            }
            catch (error) {
                console.log(error);
                await database.postgresPool.query('ROLLBACK');
            }
            results = {
                success: true,
                token: token,
                refreshToken: newRefreshToken
            }
            return results;
        }

        results = {
            success: false,
        }
        return results;
    }

    /**
     * Function to get user
     * @param {Integer} userId The user Id
     * @return {Object} Return user info
     */
    static async get(userId) {
        let queryResults = await database.postgresPool.query('SELECT * FROM users WHERE id = $1', [userId]);
        return {
            userName: queryResults.rows[0].username,
            fullName: queryResults.rows[0].first_name + " " + queryResults.rows[0].last_name,
            email: queryResults.rows[0].email_address,
            phoneNumber: queryResults.rows[0].phone_number
        };
    }
}
module.exports = UserService;