/**
 * Created by Frank on 2016/3/28.
 */
var Conf=require('./Config.js');//引入配置文件
var config=new Conf();
var mysql=require("mysql");
var pool = mysql.createPool({
    host     : config.mysql_host,  //主机
    user     : config.mysql_user,       //MySQL认证用户名
    password : config.mysql_password,           //MySQL认证用户密码
    port: config.mysql_port,            //端口号
    database:config.mysql_database,         //数据库
});

var query=function(sql,callback){
    pool.getConnection(function(err,conn){
        if(err){
            callback(err,null,null);
        }else{
            conn.query(sql,function(qerr,vals,fields){
                //释放连接
                conn.release();
                //事件驱动回调
                callback(qerr,vals,fields);
            });
        }
    });
};

module.exports=query;