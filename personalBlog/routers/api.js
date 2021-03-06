//API管理模块
let express = require("express");
let router = express.Router();
let User = require('../models/User');
let Content = require('../models/Content');
//统一返回格式
let reponseData;
router.use( (req,res,next) => {
    //初始化
    responseData = {
        code: 0,
        message: ''
    }
    //这里的next指的是执行下一个路由匹配的绑定函数
    next();
});

/* 用户注册 
*   注册逻辑
*   1.用户名不能为空
*   2.密码不能为空
*   3.两次输入密码必须一致
*   
*   1.用户是否已经被注册了
*   数据库查询    
*/
router.post('/user/register',(req,res,next) => {
    let username = req.body.username;
    let password = req.body.password;
    let repassword = req.body.repassword;

    console.log(username);
    console.log(password);
    console.log(repassword);

    //用户名是否为空
    if(username == ''){
        //用户名为空则状态码code为1
        responseData.code = 1;
        responseData.message = '用户名不能为空';
        res.json(responseData);
        return;
    }
    //密码不能为空
    if(password == ''){
        //密码为空则状态码code为2
        responseData.code = 2;
        responseData.message = '密码不能为空';
        res.json(responseData);
        return;
    }
    //两次输入的密码必须一致
    if(password != repassword){
        responseData.code = 3;
        responseData.message = '两次输入的密码不一致';
        res.json(responseData);
        return;
    }
    //用户名是否已经被注册了,如果数据库中已经存在和我们要注册的用户名同名的数据，表示该用户已经被注册了
    User.findOne({
        username: encodeURI(username)
    }).then( function(userInfo){
        if(userInfo){
            //表示数据库中有该记录
            responseData.code = 4;
            responseData.message = '用户名已经被注册了';
            res.json(responseData);
            return;
        }
        //保存用户注册的信息到数据库中
        let user = new User({
            username: encodeURI(username),
            password: password
        });
        return user.save();
    }).then(function(newUserInfo){
        console.log(newUserInfo);
        responseData.message = '注册成功';
        res.json(responseData);
    })
});

/* 用户登录*/
router.post('/user/login',(req,res) => {
    let username = req.body.username;
    let password = req.body.password;
    if(username == '' || password == ''){
        responseData.code = 1;
        responseData.message = '用户名密码不能为空';
        res.json(responseData);
        return;
    }
    //查询数据库中相同用户名和密码的记录是存在，如果存在则登录成功
    User.findOne({
        username: encodeURI(username),
        password: password
    }).then( (userInfo) => {
        if(!userInfo){
            responseData.code = 2;
            responseData.message = '用户名或密码错误';
            res.json(responseData);
            return;
        }
        //用户名和密码是正确的
        responseData.message = "登陆成功";
        responseData.userInfo = {
            _id: userInfo._id,
            username: userInfo.username
        }
        //发送cookies信息
        req.cookies.set('userInfo',JSON.stringify({
            _id: userInfo._id,
            username: userInfo.username
        }));
        //返回json对象至前端
        res.json(responseData);
        return;
    });
});
//退出
router.get('/user/logout',(req,res) => {
    req.cookies.set('userInfo',null);
    res.json(responseData);
});
//获取文章的所有评论
router.get('/comment',(req,res) => {
    let contentId = req.query.contentid || '';
    Content.findOne({
        _id: contentId
    }).then( (content) => {
        responseData.data = content.comments;
        res.json(responseData);
    });
});
//评论提交
router.post('/comment/post',(req,res) => {
    //内容的id
    let contentId = req.body.contentid || '';
    let postData = {
        username: req.userInfo.username,
        postTime: new Date(),
        content: req.body.content
    }
    //查询这篇内容的信息
    Content.findOne({
        _id: contentId
    }).then( (content) => {
        content.comments.push(postData);
        return content.save();
    }).then( (newContent) => {
        responseData.message = '评论成功';
        responseData.data = newContent;
        res.json(responseData);
    });
});
module.exports = router;