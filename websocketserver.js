/**
 * Created by Frank on 2016/3/2.
 */
var Conf=require('./Config.js');//引入配置文件
var config=new Conf();

var express=require('express');//引入express包，映射文件夹
var app=express();
app.use('/', express.static(config.dirname));
var bodyParser=require('body-parser');//引入bodyparse包以便于后面接收web请求体
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
var mysql=require('mysql');//引入mysql包，用于串行数据插入mysql
var net=require('net');//引入net包
var EventEmitter = require('events').EventEmitter;//引入事件机制
var query=require("./mysql.js");//引入mysql地址池访问方法，用于web访问数据库
var event = new EventEmitter();//定义一个事件用来作为socket和websocket数据转发的桥梁

var socketServer=net.createServer();//开启socket服务，并监听端口
socketServer.listen(config.socket_port);
var server=require('http').createServer(app);//开启http服务，运行express框架，附着websocket服务，并监听端口
var io=require('socket.io').listen(server);
server.listen(config.websocket_port);
console.log('[socket_http_websocket_server] start!');//至此服务器全部开启

var connection;
function fun(){
    connection= mysql.createConnection({
        host     : config.mysql_host,  //主机
        user     : config.mysql_user,       //MySQL认证用户名
        password : config.mysql_password,           //MySQL认证用户密码
        port: config.mysql_port,            //端口号
        database:config.mysql_database,         //数据库
    });
    //创建一个connection
    var conn=function(){
            connection.connect(function(err){
                if(err){//如果连接出错：可能是mysql没打开，或者是连接数太多。进行超时重连3s
                    console.log('[SqlConnection] '+err);
                    setTimeout(function(){fun();},1000*3);
                    return;
            }
            console.log('[Sqlconnection] succeed!');
        });
    }
    conn();
    connection.on("error", function () {//如果出现其他错误：可能是数据库忽然崩溃，或者超时（8小时未操作）。进行超时重连3s
        console.log("数据库意外中断或超时未操作，正在重新连接...");
        setTimeout(function(){fun();},1000*3);
    });
}


//这个函数用来封装数据库串行写入，以及超时重连，断开重连
fun();

//socket接收来自网关的数据并转发给websocket，同时存入mysql
socketServer.on('connection', function (socket) {
    socket.on('data', function (data) {
        var data_array=data.toString().split(',');
        event.emit('transfer_event',data_array[0],data_array[1]);
        var sql="insert into users (name,pwd) values ('"+data_array[0]+"','"+data_array[1]+"');";
        console.log(sql);
        connection.query(sql, function (err,rows) {
            if (err) {
                console.log('[SqlCommand] - :'+err);
                return;
            }
            console.log( rows);
        });
    });
});

//websocket将socket转发过来的数据广播出去
io.on('connection',function(socket){
    event.on('transfer_event', function(x,y) {
        socket.emit('back',x,y);
    });
});

//这个函数用来处理客户端的历史记录请求(还不知道历史记录的形式所以还没写)
app.post("/history", function (req,res) {
    console.log(req.body);
    //query()
    //res.json();
});

//可能还有页面用户登陆的东西涉及到cookie、session

//还有刷卡用户登陆的,需要访问数据库查看对应表。