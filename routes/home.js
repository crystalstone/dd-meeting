var Booking = require('../models/bookSchema.js');
var hbs = require('hbs');
var fs = require('fs');
var moment = require('moment');

function renderContent(fileName, data) {
    var content = fs.readFileSync('./views/' + fileName, 'utf-8');
    var template_func = hbs.handlebars.compile(content);
    return template_func(data);
}

function route (app) {
    app.get('/', function(req, res, next) {
        console.log('cookise');
        console.log(req.cookies.username);

        Booking.get(moment().format('YYYY-MM-DD'), function (err, bookings) {
            console.log('cookise');
            console.log(req.cookies.username);

            if (err) {
                bookings = [];
            }
            res.locals = {
                data: bookings,
                name: req.cookies.username
            };
            res.render('home');
        });
    });

    /*app.post('/login', function(req, res, next) {
        var email = req.body.email;
        var name = req.body.name;
        if (!req.session.email || !req.session.name) {
            req.session.email = email;
            req.session.name = name;
            Booking.get(moment().format('YYYY-MM-DD'), function (err, bookings) {
                if (err) {
                    bookings = [];
                }

                res.locals = {
                    data: bookings,
                    name: req.cookies.username
                };

                var tpl = renderContent('partials/list.hbs', {
                    data: bookings,
                    name: req.cookies.username
                });

                res.send({name: name, tpl: tpl});
            });
        }
    });*/

    app.post('/search', function(req, res, next) {
        var bookdate = req.body.bookdate;
        Booking.get(bookdate, function (err, bookings) {
            if (err) {
                bookings = [];
                res.send({error: '获取列表失败'});
            }

            res.locals = {
                data: bookings,
                // name: req.session.name
                name: req.cookies.username
            };

            var tpl = renderContent('partials/list.hbs', {
                data: bookings,
                // name: req.session.name
                name: req.cookies.username
            });
            res.send({tpl: tpl});
        });
    });

    app.post('/addBook', function(req, res, next) {
        var bookdate = req.body.bookdate;
        var bgtime = req.body.bgtime;
        var endtime = req.body.endtime;
        var range = req.body.range;
        var meetId = req.body.meetId;

        // if (req.session.name) {
        if (req.cookies.username) {
            Booking.save(
                {
                    bookdate: bookdate,
                    bgtime: bgtime,
                    bgDate: new Date(bookdate + ' ' + bgtime),
                    endtime: endtime,
                    endDate: new Date(bookdate + ' ' + endtime),
                    range: range,
                    // user: req.session.name,
                    user: req.cookies.username,
                    meetId: +meetId,
                    isCancel: 0
                },
                function (err, bookings) {
                    if (err) {
                        res.send({error: err.hasBook ? '该时段已经预定':'预定失败！'});
                    }
                    else {
                        Booking.get(bookdate, function (err, bookings) {
                            if (err) {
                                bookings = [];
                                res.send({error: '获取列表失败！'});
                            }

                            res.locals = {
                                data: bookings,
                                // name: req.session.name
                                name: req.cookies.username
                            };

                            var tpl = renderContent('partials/list.hbs', {
                                data: bookings,
                                // name: req.session.name
                                name: req.cookies.username
                            });
                            res.send({tpl: tpl});
                        });
                    }
                }
            );
        }
        else {
            res.send({error: '请先登陆'});
        }

    });


    app.post('/cancelBook', function(req, res, next) {
        var bookId = req.body.bookId;
        var bookdate = req.body.bookdate;

        Booking.cancel(
            bookId,
            function (err, bookings) {
                if (err) {
                    res.send({error: '取消失败！'});
                }
                else {
                    Booking.get(bookdate, function (err, bookings) {
                        if (err) {
                            bookings = [];
                            res.send({error: '获取列表失败！'});
                        }

                        res.locals = {
                            data: bookings,
                            // name: req.session.name
                            name: req.cookies.username
                        };

                        var tpl = renderContent('partials/list.hbs', {
                            data: bookings,
                            // name: req.session.name
                            name: req.cookies.username
                        });
                        res.send({tpl: tpl});
                    });
                }
            }
        );
    });


}

module.exports = route;
