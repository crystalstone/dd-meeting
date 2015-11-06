module.exports = route;

var uuapConfig = {
    "protocol": "https",
    "hostname": "cas.zufangzi.com",
    "port": "8443",
    "validateMethod": "/cas/serviceValidate",
    "loginPath": "/cas/login",
};

console.log(uuapConfig);
var http = require('http');
var https = require('https');
var url = require('url');
var express = require('express');
var xml2js = require('xml2js');
var router = express.Router();
var service;

function route (app) {
    app.use('*', function (req, res, next) {
        // 当前路径 full path
        service = req.protocol + '://' + req.hostname + ':'+ app.settings.port;

        var query = req.query,
            views = req.session.views,
            ticket = query.ticket;
        console.log('ss00')
        console.log(req.cookies.username)
        console.log(req.cookies.ticket)

        // 如果cookie中带有有用信息，则先从cookie带的信息判断是否已经登录
        if (req.cookies.username && req.cookies.ticket) {
            var _usrname = req.cookies.username,
                _ticket = req.cookies.ticket,
                _vUrl = getFormatUrl(uuapConfig.validateMethod, service, _ticket);
                console.log('asdasdasdasdasdasdsad');
                console.log(_vUrl);
                console.log(_vUrl);

            https.get(_vUrl, function (uuapRes) {
                var responseText = '';
                uuapRes.on('error', function (e) {
                    console.log('seeeeeeeee')
                    res.send(e.message);
                });

                uuapRes.on('data', function (chunk) {
                    responseText += chunk;
                });

                uuapRes.on('end', function () {
                    var parser = new xml2js.Parser();
                    var statusCode = res.statusCode;
                    var userName;
                    if (statusCode === 200) {
                        parser.parseString(responseText, function (error, data) {
                            if (error) {
                                res.send(error.message);
                            } else {
                                var successLogin = data['cas:serviceResponse']['cas:authenticationSuccess'];
                                if (successLogin) {
                                    next();
                                } else if (ticket) { // 如果url中携带ticket，则用url中判断ticket
                                    handleTicketLogin(req, res, next, views, ticket);
                                } else { // 否则直接跳转到登录页面
                                    handleUUAPLogin(req, res);
                                }
                            }
                        });
                    } else {
                        res.send('UUAP验证失败状态吗：' + statusCode);
                    }
                });
            });
        } else if (ticket) { // 如果url中携带ticket，则用url中判断ticket
            handleTicketLogin(req, res, next, views, ticket);
        } else { // 否则跳转到登录页
            handleUUAPLogin(req, res);
        }
    });
}

/**
 * @desc 跳转到登陆页
 */
function handleUUAPLogin (req, res) {
    var redirecturl = getFormatUrl(uuapConfig.loginPath, service);
    res.redirect(redirecturl)
}

/**
 * @desc 使用url 中携带的ticket 判断是否已经登录
 */
function handleTicketLogin (req, res, next, views, ticket) {
    // ticket 验证
    !views && (req.session.views = {});

    var urlOps = {
        protocol: uuapConfig.protocol,
        hostname: uuapConfig.hostname,
        port: uuapConfig.port,
        pathname: uuapConfig.validateMethod,
        query: {
            ticket: ticket,
            service: service
        }
    };
    console.log('sstick')

    if (uuapConfig.protocol === 'http') {
        validateByHttp(req, res, next, urlOps, validateTicket)
    } else {
        validateByHttps(req, res, next, urlOps, validateTicket)
    }
}

/**
 * HTTP验证
 * @param req   当前请求request
 * @param res   当前请求response
 * @param ops   uuap验证请求链接参数
 * @param callback  uuap验证请求回调
 */
function validateByHttp(req, res, next, ops, callback) {
    var vUrl = url.format(ops);
    http.get(vUrl, function (uuapRes) {
        callback(req, res, next, uuapRes);
    });
}

/**
 * HTTPS验证
 * @param req   当前请求request
 * @param res   当前请求response
 * @param ops   uuap验证请求链接参数
 * @param callback  uuap验证请求回调
 */
function validateByHttps(req, res, next, ops, callback) {
    var vUrl = url.format(ops);
    console.log(vUrl);
    https.get(vUrl, function (uuapRes) {
        callback(req, res, next, uuapRes, ops);
    });
}

/**
 * 验证ticket回调
 * @param req   当前请求request
 */
function validateTicket(req, res, next, uuapRes, ops) {
    var responseText = '';
    uuapRes.on('error', function (e) {
        res.send(e.message);
    });
    uuapRes.on('data', function (chunk) {
        responseText += chunk;
    });

    uuapRes.on('end', function () {
        var parser = new xml2js.Parser();
        var statusCode = res.statusCode;
        var userName;

        if (statusCode === 200) {
            parser.parseString(responseText, function (error, data) {
                if (error) {
                    res.send(error.message);
                } else {
                    console.log(JSON.stringify(data));
                    var successLogin = data['cas:serviceResponse']['cas:authenticationSuccess'];
                    if (successLogin) {
                        userName = successLogin[0]['cas:attributes'][0]['cas:username'][0];
                        req.session.views.userName = userName;
                        res.cookie('username', userName);
                        res.cookie('ticket', ops.query.ticket);
                        res.redirect('/');
                    } else {
                        var redirecturl = getFormatUrl(uuapConfig.loginPath, service);
                        res.redirect(redirecturl)
                    }
                }
            });
        } else {
            res.send('UUAP验证失败状态吗：' + statusCode);
        }
    });
}

/**
 * @desc 获取格式化url
 */
function getFormatUrl (path, service, ticket) {
    var _urlOps = {
        protocol: uuapConfig.protocol,
        hostname: uuapConfig.hostname,
        port: uuapConfig.port,
        pathname: path,
        query: {
            service: service
        }
    };

    if (ticket) {
        _urlOps.query.ticket = ticket;
    }

    return url.format(_urlOps);
}
