(function(window) {
    "use strict";
    var $ = function(callback) {
        registerOrRunCallback(callback);
        bindReady();
    },
    document = window.document,
    readyBound = false,
    callbackQueue = [],
    registerOrRunCallback = function(callback) {
        if (typeof callback === "function") {
            callbackQueue.push(callback);
        }
    },
    DOMReadyCallback = function() {
        while (callbackQueue.length) {
            (callbackQueue.shift())();
        }
        registerOrRunCallback = function(callback) {
            callback();
        };
    },
    DOMContentLoaded = function() {
        if (document.addEventListener) {
            document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
        } else {
            document.detachEvent("onreadystatechange", DOMContentLoaded);
        }
        DOMReady();
    },
    DOMReady = function() {
        if (!$.isReady) {
            if (!document.body) {
                return setTimeout(DOMReady, 1);
            }
            $.isReady = true;
            DOMReadyCallback();
        }
    },
    bindReady = function() {
        var toplevel = false;

        if (readyBound) {
            return;
        }
        readyBound = true;
        if (document.readyState !== "loading") {
            DOMReady();
        }
        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
            window.addEventListener("load", DOMContentLoaded, false);
        } else if (document.attachEvent) {
            document.attachEvent("onreadystatechange", DOMContentLoaded);
            window.attachEvent("onload", DOMContentLoaded);
            try {
                toplevel = window.frameElement == null;
            } catch (e) {
            }
            if (document.documentElement.doScroll && toplevel) {
                doScrollCheck();
            }
        }
    },
    doScrollCheck = function() {
        if ($.isReady) {
            return;
        }
        try {
            document.documentElement.doScroll("left");
        } catch (error) {
            setTimeout(doScrollCheck, 1);
            return;
        }
        DOMReady();
    };
    $.isReady = false;
    window.TB_Ready = $;
})(window);
(function(window) {
    "use strict";
    var TB_Cookie = {
        read: function(cookieName) {
            var res = null;
            var pairs = document.cookie.split(';');            
            var pairs_length = pairs.length;
            for (var i = 0; i < pairs_length; i++) {
                var pair = pairs[i].strip().split('=');
                if (cookieName == unescape(pair[0])) {
                    res = unescape(pair[1]);
                    break;
                }
            }                        
            return res;
        },
        write: function(cookieName, cookieValue, cookieLifeTime) {
            var expires = '';
            if (cookieLifeTime) {
                var date = new Date();
                date.setTime(date.getTime() + (cookieLifeTime * 1000));
                expires = '; expires=' + date.toGMTString();
            }
            document.cookie = escape(cookieName) + "=" + escape(cookieValue) + expires + "; path=/";
        }
    };
    window.TB_Cookie = TB_Cookie;
})(window);
function TB_RemoveClassName(element, name) {
    var classess = element.className;
    var pattern = new RegExp('(^| )' + name + '( |$)');
    classess = classess.replace(pattern, '$1');
    classess = classess.replace(/ $/, '');
    element.className = classess;
}
function TB_Tab(section, num) {
    var tabs = document.querySelectorAll('.tabs_' + section + '_menu')[0].children;
    var tabs_length = tabs.length;
    for (var i = 0; i < tabs_length; i++) {
        TB_RemoveClassName(tabs[i], 'toolbar_menu_current');
    }
    document.getElementById('toolbar_link_' + section + '_' + num).parentNode.className += " toolbar_menu_current";
    var sections = document.querySelectorAll('div.tab_' + section + '_content');
    var sections_length = sections.length;
    for (var i = 0; i < sections_length; i++) {
        sections[i].style.display = 'none';
    }
    document.getElementById('tab_' + section + '_' + num).style.display = 'block';
    TB_Cookie.write('tb_dev_toolbar', section + '_' + num, 30 * 24 * 60 * 60);
}
function TB_Menu(section) {
    var sections = document.querySelectorAll('a.toolbar_menu_item');
    var sections_length = sections.length;
    for (var i = 0; i < sections_length; i++) {
        TB_RemoveClassName(sections[i], 'toolbar_active');
    }
    document.getElementById('toolbar_menu_' + section).className += " toolbar_active";
    var blocks = document.querySelectorAll('div.toolbar_content_section');
    var blocks_length = blocks.length;
    for (var i = 0; i < blocks_length; i++) {
        blocks[i].style.display = 'none';
    }
    document.getElementById(section).style.display = 'block';
    TB_Tab(section.replace('toolbar_', ''), 1);
}
function TB_SlideToggle(id) {
    var element = document.getElementById(id),
        display = element.style.display;

    if (display == 'block') {
        element.style.display = 'none';
    } else{
        element.style.display = 'block';
    }
}
TB_Ready(function() {
    document.getElementById('develop_toolbar_btn').addEventListener('click', function(e) {				
        e.preventDefault();
        TB_SlideToggle('develop_toolbar');
    });
    document.getElementById('toolbar_label_link').addEventListener('click', function(e) {				
        e.preventDefault();
        TB_SlideToggle('develop_toolbar');
    });
    var hl_blocks = document.querySelectorAll('.toolbar_table_syntax');
    var hl_blocks_length = hl_blocks.length;
    for (var i = 0; i < hl_blocks_length; i++) {
        hljs.highlightBlock(hl_blocks[i]);
    }
    var active_section = TB_Cookie.read('tb_dev_toolbar');
    if (active_section === null) {
        active_section = 'dashboard_1';
        TB_Cookie.write('tb_dev_toolbar', active_section, 30 * 24 * 60 * 60);
    }
    var section_parts = active_section.split('_');
    TB_Menu('toolbar_' + section_parts[0]);
    TB_Tab(section_parts[0], section_parts[1]);        
});