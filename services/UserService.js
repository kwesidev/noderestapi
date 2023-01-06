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
        let results, queryString;
        queryString = `
            SELECT 
                id,
                first_name,
                last_name,
                email_address,
                phone_number
            FROM 
               users
            OFFSET $1 LIMIT 10
        `
        results = await database.postgresPool.query(queryString, [offset]);
        return results.rows;
    }
    /**
     * Function to login and generate a jwt token
     * @param {String} username 
     * @param {String} password 
     * @returns {Object} 
     */
    static async login(username, password, userIp, userAgent) {
        let queryResult, comparePassword, response, token, userDetails, refreshToken;
        try {
            await database.postgresPool.query('BEGIN');
            queryResult = await database.postgresPool.query('SELECT id, username, password FROM users WHERE username=$1 ', [username]);
            // if user exists check if password is valid then generate a token
            if (queryResult.rowCount == 1) {
                comparePassword = await bcrypt.compare(password, queryResult.rows[0].password);
                userDetails = await UserService.get(queryResult.rows[0].id);
                if (comparePassword) {
                    // Generate JWT token
                    token = jwt.sign({
                        userId: userDetails.userId,
                    }, process.env.JWT_SECRET, {
                        expiresIn: '30m',
                    });
                    refreshToken = Utility.generateRandomToken(45);
                    await database.postgresPool.query('INSERT INTO user_refresh_tokens(user_id,token,created,expiry_time,ip_address,user_agent) VALUES($1, $2, NOW(), $3, $4, $5) '
                        , [userDetails.userId, refreshToken, Utility.featureTime(1), userIp, userAgent]);
                    response = {
                        success: true,
                        token: token,
                        refreshToken: refreshToken,
                        role: userDetails.roleType
                    }
                    await database.postgresPool.query('COMMIT');
                    return response;
                }
            }
            response = {
                success: false,
                errorMessage: 'Invalid Username or Password '
            }
        }
        catch (error) {
            response = {
                success : false,
                errorMessage: 'Error processing request'
            }
            await database.postgresPool.query('ROLLBACK');
            console.log(error);
        }
        return response;
    }
    /**
     * Function to register users
     * @param {Object} An object describing the user to be registered
     * @returns {Object}
     */
    static async register(userDetails) {
        let results, queryString, passwordHash, queryResult, userId;
        try {
            database.postgresPool.query('BEGIN');
            queryString = `
                INSERT INTO users
                    (username, password, first_name,last_name, email_address, phone_number, active)
                VALUES
                    ($1, $2, $3, $4, $5, $6, true) 
                    
                RETURNING id ;
            `
            passwordHash = await bcrypt.hash(userDetails.password, SALTROUNDS);
            queryResult = await database.postgresPool.query(queryString,
                [
                    userDetails.userName,
                    passwordHash,
                    userDetails.firstName,
                    userDetails.lastName,
                    userDetails.emailAddress,
                    userDetails.phoneNumber,
                ]);
            userId = queryResult.rows[0].id;
            queryString = `
            INSERT INTO 
                user_roles(user_id, role_id) 
            VALUES
                ($1, (SELECT id FROM roles WHERE type = $2))
            `
            await database.postgresPool.query(queryString, [userId, userDetails.roleType]);
            await database.postgresPool.query('COMMIT');
            results = {
                success: true,
            }
            return results;
        }
        catch (error) {
            console.log(error);
            database.postgresPool.query('ROLLBACK');
        }
        results = {
            success : false
        }
        return results;
    }
    /**
     * Function to generate refresh token
     * @param {String} A string containing the refresh token
     * @returns {Object} 
     */
    static async refreshToken(oldRefreshToken, userIp, userAgent) {
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
                    expiresIn: '30m',
                });
                newRefreshToken = Utility.generateRandomToken(45);
                await database.postgresPool.query('INSERT INTO user_refresh_tokens(user_id,token,created,expiry_time, ip_address, user_agent) VALUES($1, $2, NOW(), $3, $4, $5) '
                    , [userDetails.user_id, newRefreshToken, Utility.featureTime(1), userIp, userAgent]);
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
        let queryResult, queryString;
        queryString =
            `SELECT 
                users.id,
                users.username,
                users.first_name,
                users.last_name,
                users.email_address,
                users.phone_number,
                users.email_address,
                users.active,
                roles.type as role_type
            FROM 
                users 
            LEFT JOIN 
                user_roles ON user_roles.user_id = users.id 
            LEFT JOIN 
               roles ON user_roles.role_id = roles.id 
            WHERE 
                users.id = $1      
            LIMIT 1
            `
        queryResult = await database.postgresPool.query(queryString, [userId]);
        if (queryResult.rows.length == 1) {
            return {
                userId: queryResult.rows[0].id,
                userName: queryResult.rows[0].username,
                fullName: queryResult.rows[0].first_name + " " + queryResult.rows[0].last_name,
                email: queryResult.rows[0].email_address,
                phoneNumber: queryResult.rows[0].phone_number,
                roleType: queryResult.rows[0].role_type,
                active: queryResult.rows[0].active
            };
        } else {
            throw new Error('User Not Found');
        }
    }

    /**
     * Function to delete Token
     * @param {String} refreshToken
     * @return {Object}
     */
    static async deleteToken(refreshToken) {
        let queryResult ;
        queryResult = await database.postgresPool.query('DELETE FROM user_refresh_tokens WHERE token = $1', [refreshToken]);
        if (queryResult.rowCount > 0) {
            return {
                success : true,
            }
        }
        else {
            return {
                success : false
            }
        }

    }
}
module.exports = UserService;