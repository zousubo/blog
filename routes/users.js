var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient
var dbUrl = 'mongodb://localhost:27017'
var dbName = 'item'
const path = require('path')
const formidable = require('formidable')
const fs = require('fs')


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// 进入登录页面
router.get('/login',function(req,res){
	res.render('login',{title:'欢迎登录'});
})

// 注册操作
router.post('/doregister',function(req,res){
	let userName = req.body.rusername
	let psw = req.body.rpsw
	let headPic = "/images/head.jpg"
		// 引用定义的连接数据库方法
	__connectDB(function(err,db,client){
		var collection = db.collection('user')
		collection.find({userName:userName}).toArray(function(err,result){
			if(err){
				console.log(err)
				return
			}
			//result是否为一个数组？数组存在长度=》数据库中存在该数据=》不能实现注册
			if(result.length>0){
				console.log(result)
				client.close()
				res.send('用户名已被注册，请重新输入')
			}else{
			//如果result长度为0，则说明数据库中没有重复用户名，可以实现注册
				collection.insertMany([{userName:userName,psw:psw,headPic}],function(err,result,client){

			if(err){
				console.log(err)
				//数据库关闭
				client.close()
				res.send('注册失败')
				return
			}

			res.redirect('/')
		})
			}
		})
		
	})
})

// 登录操作
router.post('/dologin',function(req,res){
	var userName = req.body.userName;
	var psw = req.body.psw
	console.log(userName)
	// console.log(req.session.user)
	__connectDB((err,db,client)=>{
		if(err){
			console.log(err);
			return;
		}
		let collection = db.collection('user');
		collection.find({userName:userName,psw:psw}).toArray((err,docs)=>{
			if(err){
				console.log(err);
				res.json({type:-2,msg:'登录失败'});
			}
			if(docs.length<=0){
				res.json({type:-1,msg:'用户名或密码错误',userName:userName});
				return;
			}else{
				let obj = {};
				obj.userName = docs[0].userName;
				obj.headPic = docs[0].headPic;
				//给req.session设置一个use的属性
				req.session.user = obj;
				console.log(docs[0].headPic);
				// console.log(req.session.user)
				res.json({type:1,msg:'登陆成功'});

			}
		})
	})
})

// 退出登录
router.get('/loginout',function(req,res){
	req.session.user =''
	res.redirect('/')
})

// 渲染修改头像
router.get('/changeHead',(req,res)=>{
	console.log(req.session.user)
	res.render('changeHead',{title:'改变用户信息'})
})

router.post('/dochange',(req,res)=>{
	var form = new formidable.IncomingForm();
	let basepath = path.normalize(path.join(__dirname,'../public','handle'))
	form.uploadDir = basepath
	form.parse(req,(err,fields,files)=>{
		if(err){
			console.log(err)
			return
		}
		// console.log(files)

		let extname = path.extname(files.Head.name)
		// console.log(extname)
		let userName = req.session.user.userName
		let oldpath = files.Head.path;
		let newPath = path.normalize(path.join(basepath,userName+extname))
		fs.rename(oldpath,newPath,(err)=>{
			if(err)
				console.log(err)
			return
		})
		var newHeadPath = '/handle/'+userName+extname
		// console.log(newHeadPath)
		__connectDB((err,db,client)=>{
			if(err){
				console.log(err)
				return
			}
			var collection = db.collection('user')
			collection.update({userName:userName},{$set:{headPic:newHeadPath}},(err,r)=>{
				if(err){
					console.log(err)
					return
				}
				req.session.user.headPic = newHeadPath
				console.log(r)
				res.redirect('/')
			})
			

		})

	})
})


module.exports = router;
function __connectDB(callback){
	// 连接到27017端口数据库
	mongoClient.connect(dbUrl,function(err,client){
		if(err){
			console.log(err)
			callback('连接失败',null,client)
			return
		}
		// 连接到db
		var db = client.db(dbName)
		callback(null,db,client)
	})
}