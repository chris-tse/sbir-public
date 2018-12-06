module.exports = function(pagination, options) {
    let type = options.hash.type || 'middle';
    let ret = '';
    const pageCount = Number(pagination.pageCount);
    const page = Number(pagination.page);
    let str = pagination.str;
    let limit;
    if (options.hash.limit) limit = +options.hash.limit;

    //page pageCount
    let newContext = {};
    switch (type) {
    case 'middle':
        if (typeof limit === 'number') {
            let i = 0;
            let leftCount = Math.ceil(limit / 2) - 1;
            let rightCount = limit - leftCount - 1;
            if (page + rightCount > pageCount)
                leftCount = limit - (pageCount - page) - 1;
            if (page - leftCount < 1)
                leftCount = page - 1;
            let start = page - leftCount;

            while (i < limit && i < pageCount) {
                newContext = { n: start, str };
                if (start === page) newContext.active = true;
                ret = ret + options.fn(newContext);
                start++;
                i++;
            }
        }
        else {
            for (let i = 1; i <= pageCount; i++) {
                newContext = { n: i, str };
                if (i === page) newContext.active = true;
                ret = ret + options.fn(newContext);
            }
        }
        break;
    case 'previous':
        if (page === 1) {
            newContext = { disabled: true, n: 1, str };
        }
        else {
            newContext = { n: page - 1, str };
        }
        ret = ret + options.fn(newContext);
        break;
    case 'next':
        newContext = {};
        if (page === pageCount) {
            newContext = { disabled: true, n: pageCount, str };
        }
        else {
            newContext = { n: page + 1, str };
        }
        ret = ret + options.fn(newContext);
        break;
    case 'first':
        if (page === 1) {
            newContext = { disabled: true, n: 1, str };
        }
        else {
            newContext = { n: 1, str };
        }
        ret = ret + options.fn(newContext);
        break;
    case 'last':
        if (page === pageCount) {
            newContext = { disabled: true, n: pageCount, str };
        }
        else {
            newContext = { n: pageCount, str };
        }
        ret = ret + options.fn(newContext);
        break;
    }

    return ret;
};