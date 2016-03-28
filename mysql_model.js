/**
 * Created by lenovo on 2016/3/28.
 */
var Conf=require('./Config.js');//引入配置文件
var config=new Conf();
var mysql=require('mysql');

function fun(){
    var flag=0;
    var connection = mysql.createConnection({
        host     : config.mysql_host,  //主机
        user     : config.mysql_user,       //MySQL认证用户名
        password : config.mysql_password,           //MySQL认证用户密码
        port: config.mysql_port,            //端口号
        database:config.mysql_database,         //数据库
    });
    //创建一个connection
    var conn=function(){connection.connect(function(err){
            if(err){
                console.log('[SqlConnection] '+err);
                setTimeout(function(){fun();},1000*10);
                return;
            }
            console.log('[Sqlconnection] succeed!');
        });}
    conn();
    connection.on("error", function () {
       console.log("数据库意外中断");
       setTimeout(function(){fun();},1000*10);
    });
    return connection;
}
exports.mysql=fun;
