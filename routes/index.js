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
  if (!req.body.username || !req.body.password) {
    res.status(400).json({success: false, error: "Username and Password is required"});
  }
  let results = await UserService.login(req.body.username, req.body.password);
  if (results.success) {
    res.status(200).json(results);
  }
  else {
    res.status(401).json(results);
  }
});

router.post('/register', async (req, res, next) => {
  let results,userDetails;
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
  let results,refreshToken;
  refreshToken = req.body.refreshToken || null;
  if (refreshToken == null) {
    res.status(400).json({success: false,error : "Refresh token is required"});
  }
  results = await UserService.refreshToken(refreshToken);
  if (results.success) {
    res.status(200).json(results);
  }
  else {
    res.status(401).json(results);
  }
});

router.post('/logout',async(req,res, next) => {
  let results,refreshToken;
  refreshToken = req.body.refreshToken || null;
  if (refreshToken == null) {
    res.status(400).json({success: false,error : "Refresh token is required"});
  }
  results = await UserService.deleteToken(refreshToken);
  if (results.success) {
    res.status(200).json(results);
  }
  else {
    res.status(500).json(results);
  }

});
module.exports = router;
