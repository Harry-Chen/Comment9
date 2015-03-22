var settings = require('../settings');

module.exports = {};

module.exports.filter = function (activity, messgaeContent) {
    var filters = activity.getEnabledFilters(
        contentLengthFilter,
        keywordFilter
        );
    for (var i = 0; i < filters.length; i++) {
        if(!(filters[i])(messgaeContent))
            return -1;
    }
    return 0;
}

function contentLengthFilter (content, length) {
    return content.length <= length;
}

function keywordFilter (content, keywordList) {
    for (var i = keywordList.length - 1; i >= 0; i--) {
        if(content.indexOf(keywordList[i])!=-1)
            return false;
    };
    return true;
}
