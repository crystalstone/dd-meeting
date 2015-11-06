var mongoose = require('./db');
var Schema = mongoose.Schema;

var Bookings = new Schema({
    bookdate: {type: String},
    bgtime: {type: String},
    bgDate: {type: Date},
    endtime: {type: String},
    endDate: {type: Date},
    range: {type: Number},
    user: {type: String},
    meetId: {type: Number},
    isCancel: {type: Number}
});

var Book = mongoose.model('booking', Bookings);

var MeetingRoom = new Schema({
    id: {type: Number},
    name: {type: String}
});

var Meeting = mongoose.model('meenting', MeetingRoom);

module.exports = {
    cancel: function (bookId, callback) {
        Book.update({_id: bookId}, {isCancel: 1}, function (err, bookItem) {
            if (err) {
                console.log('更新失败-err');
                callback(err, {});
                return;
            }
            callback(null, bookItem);
        });
    },
    get: function (bookdate, callback) {
        var codition = bookdate ? {bookdate: bookdate} : {};
        codition.isCancel = 0;
        Meeting.find({}, function (err, meetings) {

            if (err) {
                console.log('查询预定信息失败');
                callback(err, {});
                return;
            }

            Book.find(codition, function (err, bookings) {
                if (err) {
                    console.log('查询预定信息失败');
                    callback(err, {});
                    return;
                }

                var mlen = meetings.length;
                var blen = bookings.length;

                console.log(bookings);

                for (var i = 0; i < mlen; i++) {
                    meetings[i].bookInfo = [];
                    for (var j = 0; j < blen; j++) {
                        if (meetings[i].id === bookings[j].meetId) {
                            meetings[i].bookInfo.push(bookings[j]);
                        }
                    }
                }

                console.log('查询预定信息成功');
                callback(null, meetings);
            });
        });
    },
    save: function (data, callback) {
        Book.findOne(
            {
                $or: [
                    {
                        bgDate: {
                            $gt: data.bgDate,
                            $lt: data.endDate
                        },
                        isCancel: 0,
                        meetId: data.meetId
                    },
                    {
                        endDate: {
                            $gt: data.bgDate,
                            $lt: data.endDate
                        },
                        isCancel: 0,
                        meetId: data.meetId
                    },
                    {
                        bgDate: {$gte: data.bgDate},
                        endDate: {$lte: data.endDate},
                        isCancel: 0,
                        meetId: data.meetId
                    },
                    {
                        bgDate: {$lte: data.bgDate},
                        endDate: {$gte: data.endDate},
                        isCancel: 0,
                        meetId: data.meetId
                    },
                ]
            },
            function (err, item) {
                if (err) {
                    console.log('book失败');
                    callback(err, {});
                    return;
                }

                if (item) {
                    console.log('查出来有重复的item');
                    console.log(item);
                    callback({hasBook: true}, {});
                }
                else {
                    Book.create(data, function (err, item) {
                        if (err) {
                            console.log('book失败');
                            callback(err, {});
                            return;
                        }
                        console.log('book成功');
                        callback(null, item);
                    });
                }
            }
        );
    }
};
