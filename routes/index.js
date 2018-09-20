var express = require('express');
var router = express.Router();
const util = require('../util/readFile')
const path = require('path')

var mongoClient = require('mongodb').MongoClient
var dbUrl = 'mongodb://localhost:27017'
var dbName = 'item'


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
  	// console.log(userInfo)
  	// console.log(req.locals)
  	console.log(req.session.user)

});

// 评论区渲染操作
router.get('/say',function(req,res){
	__connectDB((err,db,client)=>{
		if(err){
			console.log(err)
			return
		}
		let collection = db.collection('talk')
		// num=>skip,limit  如果是第二页=》num-1*2
		collection.find({}).toArray(function(err,TalkArr){
			if(err){
				console.log(err)
				res.send('查询失败')
				client.close()
				return
			}
			var count = Math.ceil(TalkArr.length/5)
			res.render('say',{title:'发飙留言',TalkArr:TalkArr,count:count})
			client.close()
		})
	})
	
})

router.get('/getallPost',function(req,res){
	let page = req.query.page
	let limitNumber = req.query.limitNumber;
	console.log(page)
	console.log(limitNumber)

	__connectDB((err,db,client)=>{
		if(err){
			console.log(err)
			return
		}
		let collection = db.collection('talk')
		// console.log(collection)
		collection.count({},(err,count)=>{
			if(err){
				console.log(err)
				client.close()
				return
			}
			collection.find({}).limit(Number(limitNumber)).skip(page*limitNumber).sort({time:1}).toArray(function(err,docArr){
			if(err){
				res.json({type:-1,msg:'数据查询失败',data:{}})
				client.close()
				return
			}
			// console.log(docArr)
			res.json({type:1,msg:'数据查询成功',data:{docArr,count}})
			
				// res.json({type:1,msg:'数据查询成功',data:{docArr,count}})
			
		})})
		})
		
	})

// 实现上传功能
router.post('/dohandle',function(req,res){
	var userName = req.session.user;
	var text = req.body.talk;
	var time = new Date()
	console.log(userName)
	console.log(time)
	console.log(text)

	__connectDB((err,db,client)=>{
		if(err){
			console.log(err)
			return
		}
		var collection = db.collection('talk')
		collection.insertMany([{userName:userName,text:text,time:time}],(err,r)=>{
			if(err){
				res.send('留言失败')
				console.log(err)
				client.close()
				return
			}
			client.close()
			res.redirect('/say')
		})
	})
})



//相册操作
router.get('/album',(req,res)=>{
	let basePath = path.normalize(path.join(__dirname,'../public','upload'))
	util.walkDir(basePath,(dirArr)=>{
		res.render('album/index',{title:'相册',dirArr:dirArr})
	})
	

})


router.get('/album/:name',(req,res)=>{
	let userName = req.params.name;
	// console.log(userName)
	let basePath = path.normalize(path.join(__dirname,'../public','upload',userName))
	let fileArr = []
	util.walk(basePath,(fileArr)=>{
		res.render('album/album',{title:userName+'的相册',fileArr:fileArr})
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