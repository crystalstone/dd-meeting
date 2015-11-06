/**
 * use to register hbs helpers
 */

var fs = require('fs');
var hbs = require('hbs');
// use to store something defined from page
var blocks = {};

hbs.registerHelper('ifCond', function(v1, v2, options) {
    if(v1 === v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

// CSS Helper
hbs.registerHelper('css', function (context) {
    var isExternal = context.indexOf('http') >= 0;
    context = !isExternal ? '/' + context : context;

    return new hbs.SafeString('<link rel="stylesheet" href="' + context + '" />');
});

// JS Helper
hbs.registerHelper('js', function (context) {
    var isExternal = context.indexOf('http') >= 0;
    context = !isExternal ? '/' + context : context;

    return new hbs.SafeString('<script type="text/javascript" src="' + context + '"></script>');
});

// Extend Helper
hbs.registerHelper('extend', function (type, modules, context) {
    var block = blocks[type];
    if (!block) {
        block = blocks[type] = [];
    }

    // split into array
    modules = modules.split(',');
    // use to form css link, like "<link ... />"
    var tpl = '';

    modules.forEach(function (item) {
        item = item.trim();
        tpl = dispatchTypes(type, item);
        block.push(tpl);
    });
});

// Block Helper
hbs.registerHelper('block', function (type) {
    var val = (blocks[type] || []).join('\n');

    // reset the block
    blocks[type] = [];

    return new hbs.SafeString(val);
});

function dispatchTypes (type, item) {
    switch (type) {
        case 'css':
            return '<link rel="stylesheet" href="css/' + item + '.css" />';
        case 'js':
            return '<script type="text/javascript" src="js/' + item + '.js"></script>';
        default:
            return false;
    }
}