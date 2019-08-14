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
(function(window) {
    "use strict";
    var TB_Sortable = {
        idx : 0,
	    tables : {},
	    getIdx : function() {return TB_Sortable.idx += 1;},	
	    load : function() {
	    	var table, i, j;
	    	var tableList = document.getElementsByClassName('toolbar_table_sortable');
	    	for (i=0; i<tableList.length; i++) {
                table = tableList[i];
	    	    if (table.tagName === "TABLE") {		        			        
                        if (!table.id) {
                            table.id = "tb_sortable_" + TB_Sortable.getIdx();
                        }
                        var id = table.id;
                        TB_Sortable.tables[id] = TB_Sortable.tables[id] ? TB_Sortable.tables[id] : {dom : {head:null,rows:null,cells:{}}};
                        var cells = TB_Sortable.getHeaderCells(table);
                        for (j=0; j<cells.length; j++) {
                            cells[j].addEventListener("mousedown", function(event) {
                                    event = event || windows.event;
                                    event.preventDefault();
                                TB_Sortable.sort(null, this);
                            }, false);		
	    	        }
	    	    }
	    	}	
	    },
	    getHeaderCells : function(table, cell) {
	    	if (!table) { table = TB_Sortable.getParent(cell, 'table'); }
	    	var id = table.id;
	    	if (!TB_Sortable.tables[id].dom.head) {
	    		TB_Sortable.tables[id].dom.head = (table.tHead && table.tHead.rows.length > 0) ? table.tHead.rows[table.tHead.rows.length-1].cells : table.rows[0].cells;
	    	}
	    	return TB_Sortable.tables[id].dom.head;
	    },
	    getCellText : function(cell) {
	    	if (!cell) { return ""; }
            var t = null;
	    	if (!cell.id) {
	    		t = TB_Sortable.getParent(cell, 'table');
	    		cell.id = t.id + "_cell_" + TB_Sortable.getIdx();
	    	}
	    	var tblid = t ? t.id : cell.id.match(/(.*)_cell.*/)[1];
	    	if (!TB_Sortable.tables[tblid].dom.cells[cell.id]) {
	    		TB_Sortable.tables[tblid].dom.cells[cell.id] = {textContent : '', htmlContent : '', active : false};
	    	}
	    	var data = TB_Sortable.tables[tblid].dom.cells[cell.id];
	    	if (data.refresh || !data.textContent) {
	    		data.textContent = cell.textContent ? cell.textContent : cell.innerText;
	    		data.refresh = false;
	    	}
	    	return data.textContent;
	    },
	    getParent : function (element, parent) {
            while (element) {
                element = element.parentNode;
                if (element.tagName.toLowerCase() === parent) {
                    return element;
                }
            }
            return undefined;
        },
	    prepare : function(data) {
            var tz = new Array();
            var x = 0, y = -1, n = 0, i, j;    
            while (i = (j = data.charAt(x++)).charCodeAt(0)) {
              var m = (i == 46 || (i >=48 && i <= 57));
              if (m !== n) {
                tz[++y] = "";
                n = m;
              }
              tz[y] += j;
            }
            return tz;
	    },
	    sort : function(table, index, order) {
	    	var cell, tableRows, i;
	    	if (typeof index === 'number') {
	    		if (!table || (table.tagName && table.tagName !== "TABLE")) {
	    			return;
	    		}
	    		index = Math.min(table.rows[0].cells.length, index);
	    		index = Math.max(1, index);
	    		index -= 1;
	    		cell = (table.tHead && table.tHead.rows.length > 0) ? table.tHead.rows[table.tHead.rows.length-1].cells[index] : table.rows[0].cells[index];
	    	} else {
	    		cell = index;
	    		table = table ? table : TB_Sortable.getParent(cell, 'table');
	    		index = cell.cellIndex;
	    	}		
	    	order = order ? order : 1;
                tableRows = table;
	    	var id = tableRows.id;
	    	if (!TB_Sortable.tables[id].dom.rows) {
	    		if (tableRows.tHead && tableRows.tHead.rows.length > 0) {
	    			TB_Sortable.tables[id].dom.rows = [].slice.call(tableRows.tBodies[0].rows);
	    		} else {
	    			TB_Sortable.tables[id].dom.rows = [].slice.call(tableRows.rows);
                    TB_Sortable.tables[id].dom.rows.shift();
	    		} 
	    	}
	    	var rows = TB_Sortable.tables[id].dom.rows;
	    	if (cell.className.match(/\btoolbar_table_sort_asc\b/) || cell.className.match(/\btoolbar_table_sort_desc\b/)) {	
	    		rows.reverse();
	    		order = cell.className.match(/\btoolbar_table_sort_desc\b/) ? 1 : -1;
	    	} else {
	    		var x, compared;
	    		rows.sort(function(a,b) {
	    			a = TB_Sortable.prepare(TB_Sortable.getCellText(a.cells[index]));
	    			b = TB_Sortable.prepare(TB_Sortable.getCellText(b.cells[index]));
	    			for (x = 0; a[x] && b[x]; x++) {
                        if (a[x] !== b[x]) {
                            var c = Number(a[x]), d = Number(b[x]);
                            if (c == a[x] && d == b[x]) {
                                return order * (c - d);
                            } else {
                            	return order * ((a[x] > b[x]) ? 1 : -1);
                            }
                        }
                    }
                    return order * (a.length - b.length);
	    		});
	    	}
                var oldClass;
	    	var tb = table.tBodies[0];
                var currentClass = 'toolbar_table_odd';
	    	for (i=0; i<rows.length; i++) {
                    oldClass = rows[i].className.replace("toolbar_table_odd", "").replace("toolbar_table_even", "").trim();
                    rows[i].className = oldClass + ((oldClass.length > 0) ? ' ' : '') + currentClass;
                    currentClass = (currentClass == 'toolbar_table_odd') ? 'toolbar_table_even':'toolbar_table_odd';
                    tb.appendChild(rows[i]);
	    	}
	    	var hcells = TB_Sortable.getHeaderCells(null, cell);
	    	for (i=0; i<hcells.length; i++) {
	    		cell = hcells[i];
	    		cell.className = cell.className.replace(/\btoolbar_table_sort_asc\b/,'');
	    		cell.className = cell.className.replace(/\btoolbar_table_sort_desc\b/,'');
	    		if (index === i) {
	    			if (order === 1) {
	    				cell.className += (cell.className ? ' ' : '') + 'toolbar_table_sort_asc';
	    			} else {
	    				cell.className += (cell.className ? ' ' : '') + 'toolbar_table_sort_desc';
	    			}
	    		}
	    	}
	    }
    };
    window.TB_Sortable = TB_Sortable;
})(window);
/* TB_Highlight function based on Highlight JS Library (https://highlightjs.org), Copyright (c) 2006, Ivan Sagalaev. */
(function(window) {
  "use strict";
  var TB_Highlight = {
    escape: function(value) {
      return value.replace(/&/gm, '&amp;').replace(/</gm, '&lt;').replace(/>/gm, '&gt;');
    },
    tag: function(node) {
      return node.nodeName.toLowerCase();
    },
    testRe: function(re, lexeme) {
      var match = re && re.exec(lexeme);
      return match && match.index == 0;
    },
    blockLanguage: function(block) {
      var i, match, length,
        classes = block.className + ' ';
      classes += block.parentNode ? block.parentNode.className : '';
      match = /\blang(?:uage)?-([\w-]+)\b/.exec(classes);
      if (match) {
        return TB_Highlight.getLanguage(match[1]) ? match[1] : 'no-highlight';
      }
      classes = classes.split(/\s+/);
      for (i = 0, length = classes.length; i < length; i++) {
        if (TB_Highlight.getLanguage(classes[i])) {
          return classes[i];
        }
      }
    },
    inherit: function(parent, obj) {
      var result = {},
        key;
      for (key in parent)
        result[key] = parent[key];
      if (obj)
        for (key in obj)
          result[key] = obj[key];
      return result;
    },
    compileLanguage: function(language) {
      function reStr(re) {
        return (re && re.source) || re;
      }
      function langRe(value, global) {
        return new RegExp(
          reStr(value),
          'm' + (language.case_insensitive ? 'i' : '') + (global ? 'g' : '')
        );
      }
      function compileMode(mode, parent) {
        if (mode.compiled)
          return;
        mode.compiled = true;
        mode.keywords = mode.keywords || mode.beginKeywords;
        if (mode.keywords) {
          var compiled_keywords = {};

          var flatten = function(className, str) {
            if (language.case_insensitive) {
              str = str.toLowerCase();
            }
            str.split(' ').forEach(function(kw) {
              var pair = kw.split('|');
              compiled_keywords[pair[0]] = [className, pair[1] ? Number(pair[1]) : 1];
            });
          };
          if (typeof mode.keywords == 'string') { // string
            flatten('keyword', mode.keywords);
          } else {
            Object.keys(mode.keywords).forEach(function(className) {
              flatten(className, mode.keywords[className]);
            });
          }
          mode.keywords = compiled_keywords;
        }
        mode.lexemesRe = langRe(mode.lexemes || /\b\w+\b/, true);
        if (parent) {
          if (mode.beginKeywords) {
            mode.begin = '\\b(' + mode.beginKeywords.split(' ').join('|') + ')\\b';
          }
          if (!mode.begin)
            mode.begin = /\B|\b/;
          mode.beginRe = langRe(mode.begin);
          if (!mode.end && !mode.endsWithParent)
            mode.end = /\B|\b/;
          if (mode.end)
            mode.endRe = langRe(mode.end);
          mode.terminator_end = reStr(mode.end) || '';
          if (mode.endsWithParent && parent.terminator_end)
            mode.terminator_end += (mode.end ? '|' : '') + parent.terminator_end;
        }
        if (mode.illegal)
          mode.illegalRe = langRe(mode.illegal);
        if (mode.relevance === undefined)
          mode.relevance = 1;
        if (!mode.contains) {
          mode.contains = [];
        }
        var expanded_contains = [];
        mode.contains.forEach(function(c) {
          if (c != undefined) {
            if (c.variants != undefined) {
              c.variants.forEach(function(v) {
                expanded_contains.push(TB_Highlight.inherit(c, v));
              });
            } else {
              expanded_contains.push(c == 'self' ? mode : c);
            }
          }
        });
        mode.contains = expanded_contains;
        mode.contains.forEach(function(c) {
          compileMode(c, mode);
        });
        if (mode.starts) {
          compileMode(mode.starts, parent);
        }
        var terminators =
          mode.contains.map(function(c) {
            return c.beginKeywords ? '\\.?(' + c.begin + ')\\.?' : c.begin;
          })
          .concat([mode.terminator_end, mode.illegal])
          .map(reStr)
          .filter(Boolean);
        mode.terminators = terminators.length ? langRe(terminators.join('|'), true) : {
          exec: function( /*s*/ ) {
            return null;
          }
        };
      }
      compileMode(language);
    },
    highlight: function(name, value, ignore_illegals, continuation) {
      function subMode(lexeme, mode) {
        for (var i = 0; i < mode.contains.length; i++) {
          if (TB_Highlight.testRe(mode.contains[i].beginRe, lexeme)) {
            return mode.contains[i];
          }
        }
      }
      function endOfMode(mode, lexeme) {
        if (TB_Highlight.testRe(mode.endRe, lexeme)) {
          while (mode.endsParent && mode.parent) {
            mode = mode.parent;
          }
          return mode;
        }
        if (mode.endsWithParent) {
          return endOfMode(mode.parent, lexeme);
        }
      }
      function isIllegal(lexeme, mode) {
        return !ignore_illegals && TB_Highlight.testRe(mode.illegalRe, lexeme);
      }
      function keywordMatch(mode, match) {
        var match_str = language.case_insensitive ? match[0].toLowerCase() : match[0];
        return mode.keywords.hasOwnProperty(match_str) && mode.keywords[match_str];
      }
      function buildSpan(classname, insideSpan, leaveOpen, noPrefix) {
        var classPrefix = noPrefix ? '' : TB_Highlight.options.classPrefix,
          openSpan = '<span class="' + classPrefix,
          closeSpan = leaveOpen ? '' : '</span>';
        openSpan += classname + '">';
        return openSpan + insideSpan + closeSpan;
      }
      function processKeywords() {
        if (!top.keywords)
          return TB_Highlight.escape(mode_buffer);
        var result = '';
        var last_index = 0;
        top.lexemesRe.lastIndex = 0;
        var match = top.lexemesRe.exec(mode_buffer);
        while (match) {
          result += TB_Highlight.escape(mode_buffer.substr(last_index, match.index - last_index));
          var keyword_match = keywordMatch(top, match);
          if (keyword_match) {
            relevance += keyword_match[1];
            result += buildSpan(keyword_match[0], TB_Highlight.escape(match[0]));
          } else {
            result += TB_Highlight.escape(match[0]);
          }
          last_index = top.lexemesRe.lastIndex;
          match = top.lexemesRe.exec(mode_buffer);
        }
        return result + TB_Highlight.escape(mode_buffer.substr(last_index));
      }
      function processSubLanguage() {
        if (top.subLanguage && !languages[top.subLanguage]) {
          return TB_Highlight.escape(mode_buffer);
        }
        var result = top.subLanguage ? TB_Highlight.highlight(top.subLanguage, mode_buffer, true, continuations[top.subLanguage]) : TB_Highlight.highlightAuto(mode_buffer);
        if (top.relevance > 0) {
          relevance += result.relevance;
        }
        if (top.subLanguageMode == 'continuous') {
          continuations[top.subLanguage] = result.top;
        }
        return buildSpan(result.language, result.value, false, true);
      }
      function processBuffer() {
        return top.subLanguage !== undefined ? processSubLanguage() : processKeywords();
      }
      function startNewMode(mode, lexeme) {
        var markup = mode.className ? buildSpan(mode.className, '', true) : '';
        if (mode.returnBegin) {
          result += markup;
          mode_buffer = '';
        } else if (mode.excludeBegin) {
          result += TB_Highlight.escape(lexeme) + markup;
          mode_buffer = '';
        } else {
          result += markup;
          mode_buffer = lexeme;
        }
        top = Object.create(mode, {
          parent: {
            value: top
          }
        });
      }
      function processLexeme(buffer, lexeme) {
        mode_buffer += buffer;
        if (lexeme === undefined) {
          result += processBuffer();
          return 0;
        }
        var new_mode = subMode(lexeme, top);
        if (new_mode) {
          result += processBuffer();
          startNewMode(new_mode, lexeme);
          return new_mode.returnBegin ? 0 : lexeme.length;
        }
        var end_mode = endOfMode(top, lexeme);
        if (end_mode) {
          var origin = top;
          if (!(origin.returnEnd || origin.excludeEnd)) {
            mode_buffer += lexeme;
          }
          result += processBuffer();
          do {
            if (top.className) {
              result += '</span>';
            }
            relevance += top.relevance;
            top = top.parent;
          } while (top != end_mode.parent);
          if (origin.excludeEnd) {
            result += TB_Highlight.escape(lexeme);
          }
          mode_buffer = '';
          if (end_mode.starts) {
            startNewMode(end_mode.starts, '');
          }
          return origin.returnEnd ? 0 : lexeme.length;
        }
        if (isIllegal(lexeme, top)) {
          throw new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.className || '<unnamed>') + '"');
        }
        mode_buffer += lexeme;
        return lexeme.length || 1;
      }
      var language = TB_Highlight.getLanguage(name);
      if (!language) {
        throw new Error('Unknown language: "' + name + '"');
      }
      TB_Highlight.compileLanguage(language);
      var top = continuation || language;
      var continuations = {};
      var result = '',
        current;
      for (current = top; current != language; current = current.parent) {
        if (current.className) {
          result = buildSpan(current.className, '', true) + result;
        }
      }
      var mode_buffer = '';
      var relevance = 0;
      try {
        var match, count, index = 0;
        while (true) {
          top.terminators.lastIndex = index;
          match = top.terminators.exec(value);
          if (!match)
            break;
          count = processLexeme(value.substr(index, match.index - index), match[0]);
          index = match.index + count;
        }
        processLexeme(value.substr(index));
        for (current = top; current.parent; current = current.parent) {
          if (current.className) {
            result += '</span>';
          }
        }
        return {
          relevance: relevance,
          value: result,
          language: name,
          top: top
        };
      } catch (e) {
        if (e.message.indexOf('Illegal') != -1) {
          return {
            relevance: 0,
            value: TB_Highlight.escape(value)
          };
        } else {
          throw e;
        }
      }
    },
    highlightAuto: function(text, languageSubset) {
      languageSubset = languageSubset || TB_Highlight.options.languages || Object.keys(TB_Highlight.languages);
      var result = {
        relevance: 0,
        value: TB_Highlight.escape(text)
      };
      var second_best = result;
      languageSubset.forEach(function(name) {
        if (!TB_Highlight.getLanguage(name)) {
          return;
        }
        var current = TB_Highlight.highlight(name, text, false);
        current.language = name;
        if (current.relevance > second_best.relevance) {
          second_best = current;
        }
        if (current.relevance > result.relevance) {
          second_best = result;
          result = current;
        }
      });
      if (second_best.language) {
        result.second_best = second_best;
      }
      return result;
    },
    highlightBlock: function(block) {
      var language = TB_Highlight.blockLanguage(block);
      var node = block;
      var text = node.textContent;
      var result = language ? TB_Highlight.highlight(language, text, true) : TB_Highlight.highlightAuto(text);
      block.innerHTML = result.value;
      block.result = {
        language: result.language,
        re: result.relevance
      };
    },
    configure: function(user_options) {
      options = TB_Highlight.inherit(options, user_options);
    },
    registerLanguage: function(name, language) {
      var lang = TB_Highlight.languages[name] = language(TB_Highlight);
      if (lang.aliases) {
        lang.aliases.forEach(function(alias) {
          TB_Highlight.aliases[alias] = name;
        });
      }
    },
    listLanguages: function() {
      return Object.keys(languages);
    },
    getLanguage: function(name) {
      return TB_Highlight.languages[name] || TB_Highlight.languages[TB_Highlight.aliases[name]];
    },
    COMMENT: function(begin, end, inherits) {
      var mode = TB_Highlight.inherit({
          className: 'comment',
          begin: begin,
          end: end,
          contains: []
        },
        inherits || {}
      );
      mode.contains.push(TB_Highlight.PHRASAL_WORDS_MODE);
      mode.contains.push({
        className: 'doctag',
        begin: "(?:TODO|FIXME|NOTE|BUG|XXX):",
        relevance: 0
      });
      return mode;
    },
    aliases: {},
    options: {
      classPrefix: 'toolbar_table_syntax-',
      languages: undefined
    },
    languages: {},
  };
  var C_NUMBER_RE = '\\b(0[xX][a-fA-F0-9]+|(\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)';
  var BACKSLASH_ESCAPE = {
    begin: '\\\\[\\s\\S]',
    relevance: 0
  };
  var QUOTE_STRING_MODE = {
    className: 'string',
    begin: '"',
    end: '"',
    illegal: '\\n',
    contains: [BACKSLASH_ESCAPE]
  };
  var PHRASAL_WORDS_MODE = {
    begin: /\b(a|an|the|are|I|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such)\b/
  };
  var C_BLOCK_COMMENT_MODE = TB_Highlight.COMMENT('/\\*', '\\*/');
  var C_NUMBER_MODE = {
    className: 'number',
    begin: C_NUMBER_RE,
    relevance: 0
  };
  window.TB_Highlight = TB_Highlight;
})(window);
TB_Highlight.registerLanguage("xml", function() {
  var XML_IDENT_RE = '[A-Za-z0-9\\._:-]+';
  var PHP = {
    begin: /<\?(php)?(?!\w)/,
    end: /\?>/,
    subLanguage: 'php',
    subLanguageMode: 'continuous'
  };
  var TAG_INTERNALS = {
    endsWithParent: true,
    illegal: /</,
    relevance: 0,
    contains: [
      PHP, {
        className: 'attribute',
        begin: XML_IDENT_RE,
        relevance: 0
      }, {
        begin: '=',
        relevance: 0,
        contains: [{
          className: 'value',
          contains: [PHP],
          variants: [{
            begin: /"/,
            end: /"/
          }, {
            begin: /'/,
            end: /'/
          }, {
            begin: /[^\s\/>]+/
          }]
        }]
      }
    ]
  };
  return {
    aliases: ['html', 'xhtml', 'rss', 'atom', 'xsl', 'plist'],
    case_insensitive: true,
    contains: [{
        className: 'doctype',
        begin: '<!DOCTYPE',
        end: '>',
        relevance: 10,
        contains: [{
          begin: '\\[',
          end: '\\]'
        }]
      },
      TB_Highlight.COMMENT(
        '<!--',
        '-->', {
          relevance: 10
        }
      ), {
        className: 'cdata',
        begin: '<\\!\\[CDATA\\[',
        end: '\\]\\]>',
        relevance: 10
      }, {
        className: 'tag',
        begin: '<style(?=\\s|>|$)',
        end: '>',
        keywords: {
          title: 'style'
        },
        contains: [TAG_INTERNALS],
        starts: {
          end: '</style>',
          returnEnd: true,
          subLanguage: 'css'
        }
      }, {
        className: 'tag',
        begin: '<script(?=\\s|>|$)',
        end: '>',
        keywords: {
          title: 'script'
        },
        contains: [TAG_INTERNALS],
        starts: {
          end: '\<\/script\>',
          returnEnd: true,
          subLanguage: ''
        }
      },
      PHP, {
        className: 'pi',
        begin: /<\?\w+/,
        end: /\?>/,
        relevance: 10
      }, {
        className: 'tag',
        begin: '</?',
        end: '/?>',
        contains: [{
            className: 'title',
            begin: /[^ \/><\n\t]+/,
            relevance: 0
          },
          TAG_INTERNALS
        ]
      }
    ]
  };
});
TB_Highlight.registerLanguage("json", function() {
  var LITERALS = {
    literal: 'true false null'
  };
  var TYPES = [
    TB_Highlight.QUOTE_STRING_MODE,
    TB_Highlight.C_NUMBER_MODE
  ];
  var VALUE_CONTAINER = {
    className: 'value',
    end: ',',
    endsWithParent: true,
    excludeEnd: true,
    contains: TYPES,
    keywords: LITERALS
  };
  var OBJECT = {
    begin: '{',
    end: '}',
    contains: [{
      className: 'attribute',
      begin: '\\s*"',
      end: '"\\s*:\\s*',
      excludeBegin: true,
      excludeEnd: true,
      contains: [TB_Highlight.BACKSLASH_ESCAPE],
      illegal: '\\n',
      starts: VALUE_CONTAINER
    }],
    illegal: '\\S'
  };
  var ARRAY = {
    begin: '\\[',
    end: '\\]',
    contains: [TB_Highlight.inherit(VALUE_CONTAINER, {
      className: null
    })],
    illegal: '\\S'
  };
  TYPES.splice(TYPES.length, 0, OBJECT, ARRAY);
  return {
    contains: TYPES,
    keywords: LITERALS,
    illegal: '\\S'
  };
});
TB_Highlight.registerLanguage("sql", function() {
  var COMMENT_MODE = TB_Highlight.COMMENT('--', '$');
  return {
    case_insensitive: true,
    illegal: /[<>]/,
    contains: [{
        className: 'operator',
        beginKeywords: 'begin end start commit rollback savepoint lock alter create drop rename call ' +
          'delete do handler insert load replace select truncate update set show pragma grant ' +
          'merge describe use explain help declare prepare execute deallocate savepoint release ' +
          'unlock purge reset change stop analyze cache flush optimize repair kill ' +
          'install uninstall checksum restore check backup revoke',
        end: /;/,
        endsWithParent: true,
        keywords: {
          keyword: 'abs absolute acos action add adddate addtime aes_decrypt aes_encrypt after aggregate all allocate alter ' +
            'analyze and any are as asc ascii asin assertion at atan atan2 atn2 authorization authors avg backup ' +
            'before begin benchmark between bin binlog bit_and bit_count bit_length bit_or bit_xor both by ' +
            'cache call cascade cascaded case cast catalog ceil ceiling chain change changed char_length ' +
            'character_length charindex charset check checksum checksum_agg choose close coalesce ' +
            'coercibility collate collation collationproperty column columns columns_updated commit compress concat ' +
            'concat_ws concurrent connect connection connection_id consistent constraint constraints continue ' +
            'contributors conv convert convert_tz corresponding cos cot count count_big crc32 create cross cume_dist ' +
            'curdate current current_date current_time current_timestamp current_user cursor curtime data database ' +
            'databases datalength date_add date_format date_sub dateadd datediff datefromparts datename ' +
            'datepart datetime2fromparts datetimeoffsetfromparts day dayname dayofmonth dayofweek dayofyear ' +
            'deallocate declare decode default deferrable deferred degrees delayed delete des_decrypt ' +
            'des_encrypt des_key_file desc describe descriptor diagnostics difference disconnect distinct ' +
            'distinctrow div do domain double drop dumpfile each else elt enclosed encode encrypt end end-exec ' +
            'engine engines eomonth errors escape escaped event eventdata events except exception exec execute ' +
            'exists exp explain export_set extended external extract fast fetch field fields find_in_set ' +
            'first first_value floor flush for force foreign format found found_rows from from_base64 ' +
            'from_days from_unixtime full function get get_format get_lock getdate getutcdate global go goto grant ' +
            'grants greatest group group_concat grouping grouping_id gtid_subset gtid_subtract handler having help ' +
            'hex high_priority hosts hour ident_current ident_incr ident_seed identified identity if ifnull ignore ' +
            'iif ilike immediate in index indicator inet6_aton inet6_ntoa inet_aton inet_ntoa infile initially inner ' +
            'innodb input insert install instr intersect into is is_free_lock is_ipv4 ' +
            'is_ipv4_compat is_ipv4_mapped is_not is_not_null is_used_lock isdate isnull isolation join key kill ' +
            'language last last_day last_insert_id last_value lcase lead leading least leaves left len lenght level ' +
            'like limit lines ln load load_file local localtime localtimestamp locate lock log log10 log2 logfile ' +
            'logs low_priority lower lpad ltrim make_set makedate maketime master master_pos_wait match matched max ' +
            'md5 medium merge microsecond mid min minute mod mode module month monthname mutex name_const names ' +
            'national natural nchar next no no_write_to_binlog not now nullif nvarchar oct ' +
            'octet_length of old_password on only open optimize option optionally or ord order outer outfile output ' +
            'pad parse partial partition password patindex percent_rank percentile_cont percentile_disc period_add ' +
            'period_diff pi plugin position pow power pragma precision prepare preserve primary prior privileges ' +
            'procedure procedure_analyze processlist profile profiles public publishingservername purge quarter ' +
            'query quick quote quotename radians rand read references regexp relative relaylog release ' +
            'release_lock rename repair repeat replace replicate reset restore restrict return returns reverse ' +
            'revoke right rlike rollback rollup round row row_count rows rpad rtrim savepoint schema scroll ' +
            'sec_to_time second section select serializable server session session_user set sha sha1 sha2 share ' +
            'show sign sin size slave sleep smalldatetimefromparts snapshot some soname soundex ' +
            'sounds_like space sql sql_big_result sql_buffer_result sql_cache sql_calc_found_rows sql_no_cache ' +
            'sql_small_result sql_variant_property sqlstate sqrt square start starting status std ' +
            'stddev stddev_pop stddev_samp stdev stdevp stop str str_to_date straight_join strcmp string stuff ' +
            'subdate substr substring subtime subtring_index sum switchoffset sysdate sysdatetime sysdatetimeoffset ' +
            'system_user sysutcdatetime table tables tablespace tan temporary terminated tertiary_weights then time ' +
            'time_format time_to_sec timediff timefromparts timestamp timestampadd timestampdiff timezone_hour ' +
            'timezone_minute to to_base64 to_days to_seconds todatetimeoffset trailing transaction translation ' +
            'trigger trigger_nestlevel triggers trim truncate try_cast try_convert try_parse ucase uncompress ' +
            'uncompressed_length unhex unicode uninstall union unique unix_timestamp unknown unlock update upgrade ' +
            'upped upper usage use user user_resources using utc_date utc_time utc_timestamp uuid uuid_short ' +
            'validate_password_strength value values var var_pop var_samp variables variance varp ' +
            'version view warnings week weekday weekofyear weight_string when whenever where with work write xml ' +
            'xor year yearweek zon',
          literal: 'true false null',
          built_in: 'array bigint binary bit blob boolean char character date dec decimal float int integer interval number ' +
            'numeric real serial smallint varchar varying int8 serial8 text'
        },
        contains: [{
            className: 'string',
            begin: '\'',
            end: '\'',
            contains: [TB_Highlight.BACKSLASH_ESCAPE, {
              begin: '\'\''
            }]
          }, {
            className: 'string',
            begin: '"',
            end: '"',
            contains: [TB_Highlight.BACKSLASH_ESCAPE, {
              begin: '""'
            }]
          }, {
            className: 'string',
            begin: '`',
            end: '`',
            contains: [TB_Highlight.BACKSLASH_ESCAPE]
          },
          TB_Highlight.C_NUMBER_MODE,
          TB_Highlight.C_BLOCK_COMMENT_MODE,
          COMMENT_MODE
        ]
      },
      TB_Highlight.C_BLOCK_COMMENT_MODE,
      COMMENT_MODE
    ]
  };
});
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
    } else {
        element.style.display = 'block';
    }
}
TB_Ready(function() {
    Array.prototype.forEach.call(document.querySelectorAll('.toolbar_table_syntax'), TB_Highlight.highlightBlock);
    if (document.getElementById('develop_toolbar') !== null) {
        document.getElementById('develop_toolbar_btn').addEventListener('click', function(e) {
            e.preventDefault();
            TB_SlideToggle('develop_toolbar');
        });
        document.getElementById('toolbar_label_link').addEventListener('click', function(e) {
            e.preventDefault();
            TB_SlideToggle('develop_toolbar');
        });
        var active_section = TB_Cookie.read('tb_dev_toolbar');
        if (active_section === null) {
            active_section = 'dashboard_1';
            TB_Cookie.write('tb_dev_toolbar', active_section, 30 * 24 * 60 * 60);
        }
        var section_parts = active_section.split('_');
        TB_Menu('toolbar_' + section_parts[0]);
        TB_Tab(section_parts[0], section_parts[1]);
        TB_Sortable.load();
    }
});