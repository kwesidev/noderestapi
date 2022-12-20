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
router.post('/refreshToken', async (req, res, next) => {
  let results = await UserService.refreshToken(req.body.refreshToken);
  if (results.success) {
    res.status(200).json(results);
  }
  else {
    res.status(401).json(results);
  }
});
module.exports = router;
