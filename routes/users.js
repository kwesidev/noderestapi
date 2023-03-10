var express = require('express');
var router = express.Router();
const middleware = require('../middlewares');
const UserService = require('../services/UserService');
// Get current logged in User
router.get('/', middleware.checkAuth, async(req, res, next) => {
  let result = await UserService.get(req.userId);
  res.json({"message" : "Welcome  , " + result.userName, details: result});
});

router.get('/list',middleware.checkAuth , middleware.hasAdminAccess , async(req,res) =>{
  // List the first 10 users u can adjust this using query param
  let results  = await UserService.getList(0);
  res.json({"users" : results});
});

router.get('/ping', middleware.checkAuth, async (req, res) => {
  res.status(200).json({ success: true });
});

module.exports = router;
