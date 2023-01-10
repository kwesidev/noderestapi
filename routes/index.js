const express = require('express');
const router = express.Router();
const database = require('../db');
const UserService = require('../services/UserService');
const Utility = require('../utils');
/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.post('/login', async (req, res, next) => {
  const userIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
  const userAgent = req.get('user-agent');
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ success: false, error: "Username and Password is required" });
  }
  let results = await UserService.login(req.body.username, req.body.password, userIp, userAgent);
  if (results.success) {
    res.status(200).json(results);
  }
  else {
    res.status(401).json(results);
  }
});

router.post('/register', async (req, res, next) => {
  let results, userDetails;
  userDetails = req.body;
  userDetails.roleType = 'USER';
  results = await UserService.register(userDetails);
  if (results.success) {
    res.status(200).json(results);
  }
  else {
    res.status(400).json(results);
  }
});
router.post('/refreshToken', async (req, res, next) => {
  const userIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
  const userAgent = req.get('user-agent');
  let results, refreshToken;
  refreshToken = req.body.refreshToken || null;
  if (refreshToken == null) {
    return res.status(400).json({ success: false, error: "Refresh token is required" });
  }
  results = await UserService.refreshToken(refreshToken, userIp, userAgent);
  if (results.success) {
    res.status(200).json(results);
  }
  else {
    res.status(401).json(results);
  }
});

router.post('/logout', async (req, res, next) => {
  let results, refreshToken;
  refreshToken = req.body.refreshToken || null;
  if (refreshToken == null) {
    return res.status(400).json({ success: false, error: "Refresh token is required" });
  }
  results = await UserService.deleteToken(refreshToken);
  if (results.success) {
    res.status(200).json(results);
  }
  else {
    res.status(500).json(results);
  }

});

router.post('/password-request', async (req, res, next) => {
  let results, username
  username = req.body.username || null;
  if (username == null) {
    return res.status(400).json({ success: false, error: "Username or Email is required" });
  }
  results = await UserService.resetPasswordRequest(username);
  if (results.success) {
    res.status(200).json(results);
  }
  else {
    res.status(500).json(results);
  }
});

router.post('/verify-reset-update-password', async (req, res, next) => {
  let result, code, password
  code = req.body.code ;
  password = req.body.password ; 
  if (code == null || password == null) {
    return res.status(400).json({ success: false, error: "Code and Password is required" });
  }
  result = await UserService.verifyRessetPasswordAndResetPassword(code, password);
  if (result.success) {
    res.status(200).json(result);
  }
  else {
    res.status(500).json(result);
  }
});

module.exports = router;
