$(document).ready(function() {

    $('#login').click(function(e) {
        $('#loginModal').modal('show');
    });

    $('#login-confirm').click(function(e) {
        var email = $('#login-field-email').val().trim();
        var name = $('#login-field-name').val().trim();

        if (email && name) {
            $.ajax({
                type: "POST",
                url: '/login',
                data: {
                    email: email,
                    name: name
                },
                success: function (res) {
                    if (res && res.tpl) {
                        $('#main .list-container').html(res.tpl);
                        $('#login-info').html(res.name).removeClass('hide');
                        $('#login').addClass('hide');
                        $('#loginModal').modal('hide');
                    }
                },
                dataType: 'json'
            });
        }
        else {
            alert('必须要输入姓名和邮箱，邮箱格式没有校验，请您输入正确的工作邮箱');
        }
    });

    $('#datetimepicker input').val(moment(new Date()).format('YYYY-MM-DD'));

    $('#datetimepicker').datetimepicker({
        format: "yyyy-mm-dd",
        startDate: '-0d',
        autoclose: true,
        minView: 2
    });

    $('#datetimepicker-book-bgtime').datetimepicker({
        weekStart: 1,
        todayBtn:  1,
        autoclose: 1,
        todayHighlight: 1,
        startView: 1,
        minView: 0,
        maxView: 1,
        forceParse: 0,
        todayBtn: false,
        keyboardNavigation: false,
        startDate: moment(new Date()).format('YYYY-MM-DD'),
        endDate: moment(new Date()).add(1, 'day').format('YYYY-MM-DD')
    });

    $('#datetimepicker').datetimepicker().on('changeDate', function (ev) {
        $('#datetimepicker-book-bgtime').datetimepicker('setStartDate', moment(ev.date).format('YYYY-MM-DD'));
        $('#datetimepicker-book-bgtime').datetimepicker('setEndDate', moment(ev.date).add(1, 'day').format('YYYY-MM-DD'));

        $.ajax({
            type: "POST",
            url: '/search',
            data: {
                bookdate: moment(ev.date).format('YYYY-MM-DD')
            },
            success: function (res) {
                if (res && res.tpl) {
                    $('#main .list-container').html(res.tpl);
                }
            },
            dataType: 'json'
        });
    });

    $('.list-container').on('click', '.book-meeting-btn', function(e) {
        var target = $(e.target);
        $('#bookModal .meeting-name').html(target.attr('meetingname'));
        $('#bookModal .meeting-name').attr('meetId', target.attr('meetingid'));
    });

    $('#bookModal').modal('hide');

    $('.list-container').on('click', '.cancel-meeting-btn', function (e) {
        var target = $(e.target);
        var id = target.attr('bookId');
        var bookdate = target.attr('bookdate');
        if (id) {
            $.ajax({
                type: "POST",
                url: '/cancelBook',
                data: {
                    bookId: id,
                    bookdate: bookdate
                },
                success: function (res) {
                    if (res && res.tpl) {
                        $('#main .list-container').html(res.tpl);
                        $('#confirm-cancel-btn').trigger('click');
                    }

                    if (res && res.error) {
                        alert(res.error);
                    }
                },
                dataType: 'json'
            });
        }
        else {
            alert('取消失败，请重试！');
        }
    });

    $('#confirm-book-btn').click(function(e) {
        var time = $('#book-time').val().trim();
        var range = $('#book-range').val().trim();
        if (time && range && +range > 0 && +range <= 2 && $.isNumeric(range)) {
            $.ajax({
                type: "POST",
                url: '/addBook',
                data: {
                    bookdate: time.split(' ')[0],
                    bgtime: time.split(' ')[1],
                    endtime: moment(time).add(range, 'hours').format('HH:mm'),
                    range: range,
                    meetId: +$('#bookModal .meeting-name').attr('meetId')
                },
                success: function (res) {
                    if (res && res.tpl) {
                        $('#main .list-container').html(res.tpl);
                        $('#confirm-cancel-btn').trigger('click');
                    }

                    if (res && res.error) {
                        alert(res.error);
                    }
                },
                dataType: 'json'
            });
        }
        else {
            alert('开始时间和会议时长必填，会议时长为小于2的正整数！');
        }
    });
});