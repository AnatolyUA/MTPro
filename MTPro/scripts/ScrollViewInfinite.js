(function($, window) {
    // shorten references to variables. this is better for uglification
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        _i = 0,
        _debug = function(s) {
            s = "!>>> " + _i + ": " + s;
            console.log(s);
            $("#debugInfo").append("<li>" + s + "</li>");
            _i++;
        };

    var _currentState = [-1, -1, -1], // массив, содержащий текущие страницы ScrollView
        _activeId = "",     // Id активной в данный момент новости

        _ScrollView = null,

        _itemsCache = [],
        _itemsCacheOrder = [], // Самые свежие в начале, старые, которые можно удалить, в конце

        _requestQueue = [],

        _eventAssigned = false,

        cIdName,
        lIdName,
        rIdName,

        _itemsIdOrder = [],

        _lockScrollToFast = false;

    var ScrollViewInfinite = Widget.extend({

        init: function(element, options) {

            // call the base function to create the widget
            Widget.fn.init.call(this, element, options);
            this._create();
        },

        // create ScrollView element and assigning it to _ScrollView
        _create: function() {
            _debug("Создали виджет");
            var that = this;
            that.templates.fullItem = kendo.template(that.options.fullItemTemplate);
            that.templates.shortItem = kendo.template(that.options.shortItemTemplate);
            that.templates.emptyPage = that.options.emptyTemplate;

            cIdName = that.options.cIdName;
            lIdName = that.options.lIdName;
            rIdName = that.options.rIdName;


            // begin with one page
            that.element.html('<div data-role="page">' + that.templates.emptyPage + '</div>' + '<div data-role="page">' + that.templates.emptyPage + '</div>' + '<div data-role="page">' + that.templates.emptyPage + '</div>');
            that.element.kendoMobileScrollView({
                change: function(e) {
                    if(_lockScrollToFast) {
                        _lockScrollToFast = false;
                        _debug("scrollToFast Finished (change)");
                    } else {
                        _debug("!!!!!!change");
                        var prevPage = _currentState.indexOf(_activeId);
                        var curPage = e.page;
                        var curId = _activeId = _currentState[e.page];
                        var curItem = that.getFromCache(curId);

                        if (curItem !== -1) {
                            // перелопачиваем все
                            if (curItem[lIdName] && curPage == 0) {
                                that.copyPage(1, 2);
                                that.copyPage(0, 1);
                                _currentState[0] = curItem[lIdName];
                                _currentState[1] = curItem[cIdName];
                                _currentState[2] = curItem[rIdName];
                                that.scrollToFast(1);
                                setTimeout(function(){
                                    that.updatePage(0, that.getItemHtml(curItem[lIdName]));
                                }, 100);

                            } else if (curItem[rIdName] && curPage == 2) {

                                _currentState[0] = curItem[lIdName];
                                _currentState[1] = curItem[cIdName];
                                _currentState[2] = curItem[rIdName];

                                var clone = that.element.find("div > div:nth-child(" + 1 + ")").clone(true);
                                that.element.find("div > div:nth-child(" + 1 + ")").remove();
                                _ScrollView.page = 1;
                                clone.insertAfter(that.element.find("div > div:nth-child(" + 2 + ")"));
                                _ScrollView.refresh();


//                                that.copyPage(1, 0);
//                                that.copyPage(2, 1);
//                                that.scrollToFast(1);
                                setTimeout(function(){
                                    that.updatePage(2, that.getItemHtml(curItem[rIdName]));
                                }, 10);

                            }


                        }
                    }
                }
            });
            _ScrollView = that.element.data("kendoMobileScrollView");

            // that._checkIntegrityTimer = setInterval($.proxy(that._checkIntegrity, that), 1000);
        },

/*        _checkIntegrityTimer: null,
        _checkIntegrityCounter: 0,
        _checkIntegrity: function() {
            var that = this;
            that._checkIntegrityCounter++;
            if (!that._lock && _ScrollView.page != _currentState.indexOf(_activeId))
                that.navigateTo(_activeId);
        },*/

        navigateTo: function(id) {
            _debug("Переходим на " + id);
            var that = this;
            if (id != _activeId) {
                    _activeId = id;
                    var item = that.getFromCache(id);
                    if (item !== -1) {
                        that.refreshStatus(item);
                    } else {
                        _currentState = [id];
                        that.regeneratePages();
                    }
            }

            if(!_eventAssigned) {
                setTimeout(function(){
                        var view = that.element.parents("[data-role=view]").data("kendoMobileView");
                        if (view) {
                            view.bind("show", function(e){
                                that.refresh();
                            });
                            _eventAssigned = true;
                        }
                }, 50);
            }
        },

        refresh: function(e) {
            _debug("refresh");
            _ScrollView.refresh();
        },

        regeneratePages: function() {

            var that = this,
                content = "",
                activePage = _currentState.indexOf(_activeId),
                activePageHtml = that.getItemHtml(_activeId);
            _debug("regeneratePages: " + _currentState + " акт. стр. " + activePage);

            for (var i = 0; i < _currentState.length; i++) {
                content = content + '<div data-role="page">' + activePageHtml + '</div>';
            }
            _ScrollView.content(content);

            _ScrollView.transition.moveTo({
                location: -activePage * _ScrollView.dimension.getSize(),
                duration: 0.1,
                ease: kendo.fx.Transition.easeOutExpo
            });

            that._lock = true;
            _debug("_lock = true");
            setTimeout($.proxy(that._updateInvisiblePages, that), 20);
        },

        scrollToFast: function(page) {
            _debug("scrollToFast: " + page);
            _lockScrollToFast = true;
            _ScrollView.transition.moveTo({
                location: -page * _ScrollView.dimension.getSize(),
                duration: 0.1,
                ease: kendo.fx.Transition.easeOutExpo
            });
        },

        _lock: false,
        _updateInvisiblePages: function() {
            var that = this
            if (that._lock) {
                var that = this;
                that._lock = false;
                var activePage = _currentState.indexOf(_activeId);
                if (activePage == _ScrollView.page) {
                    _debug("_updateInvisiblePages: _lock = false");
                    for (var i = 0; i < _currentState.length; i++) {
                        if (i != activePage)
                            that.updatePage(i, that.getItemHtml(_currentState[i]));
                    }
                    _ScrollView.refresh();
                } else {
                    // _debug("_updateInvisiblePages Перевыставляем таймер");
                    setTimeout($.proxy(that._updateInvisiblePages, that), 20);
                }
            }
        },

        getItemHtml: function(id) {
            var that = this,
                item = that.getFromCache(id),
                html = that.templates.emptyPage;

            if (id === -1) {
                _debug("getItemHtml (empty) " + id);
                return html;
            }


            if (item !== -1) {
                if (!item.IsShort) {
                    _debug("getItemHtml (full) " + id);
                    return that.templates.fullItem(item);
                }
                html = that.templates.shortItem(item);
            }
            that.updateStoryFromServer(id);
            _debug("getItemHtml (empty) " + id);
            return html;
        },

        refreshStatus: function(item) {
            _debug("!!!!!!!!!refreshStatus");
            var that = this;
            var newState = [item[cIdName]];

            if (item[cIdName] == _activeId) {
                _debug("refreshStatus " + _currentState + "/" + _activeId);
                // Только в этом случае что-то делаем
                if (item[lIdName]) newState.unshift(item[lIdName]);
                if (item[rIdName]) newState.push(item[rIdName]);
                if (newState.toString() != _currentState.toString()) {
                    _currentState = newState;
                    _debug("refreshStatus ON " + _currentState + "/" + _activeId);
                    that.regeneratePages();
                }
            }
        },

        updateStatus: function(item) {
            _debug("updateStatus begin for " + item[cIdName] + " _currentState: " + _currentState + "/" + _activeId);
            var that = this;
            var curPage = _currentState.indexOf(item[cIdName]);
            if(curPage !== -1) {

                _debug("updateStatus for " + item[lIdName] + "[" + item[cIdName] + "]" + item[rIdName] + " curPage=" + curPage + " _currentState: " + _currentState + "/" + _activeId);

                that.updatePage(curPage, that.getItemHtml(item[cIdName]));

                if ((curPage == 0 || curPage == 1) && item[rIdName]) {
                    _debug("OK item[rIdName]=" + item[rIdName]);
                    _currentState[curPage + 1] = item[rIdName];
                    that.updatePage(curPage + 1, that.getItemHtml(item[rIdName]));
                }
                if ((curPage == 1 || curPage == 2) && item[lIdName]) {
                    _debug("OK item[lIdName]=" + item[lIdName]);
                    _currentState[curPage - 1] = item[lIdName];
                    that.updatePage(curPage - 1, that.getItemHtml(item[lIdName]));
                }

                if(_activeId == -1) {
                    _activeId = _currentState[_ScrollView.page];
                }

                _debug("updateStatus for " + item[cIdName] + " _currentState: " + _currentState + "/" + _activeId);

                // Нужно ли менять _currentState
                if(item[cIdName] == _activeId) {
                    var toGo;
                    if(!item[lIdName]) {
                        toGo = 0;
                    } else if(!item[rIdName]) {
                        toGo = 2;
                    } else {
                        toGo = 1;
                    }

                    if(toGo != curPage) {
                        // да, нужно
                        // предполагаем, что новостей больше 3х, в противном случае, нужно все усложнять
                        switch (toGo) {
                            case 0:
                                _currentState[0] = item[cIdName];
                                _currentState[1] = item[rIdName];
                                var nextItem = that.getFromCache(item[rIdName]);
                                _currentState[2] = (nextItem === -1) ? -1 : nextItem[rIdName];
                                break;
                            case 1:
                                _currentState[0] = item[lIdName];
                                _currentState[1] = item[cIdName];
                                _currentState[2] = item[rIdName];
                                break;
                            case 2:
                                _currentState[2] = item[cIdName];
                                _currentState[1] = item[lIdName];
                                var nextItem = that.getFromCache(item[lIdName]);
                                _currentState[0] = (nextItem === -1) ? -1 : nextItem[lIdName];
                                break;
                        }

                        that.updatePage(toGo, that.getItemHtml(_currentState[toGo]));
                        that.scrollToFast(toGo);
                        for(var i = 0; i < 3; i++) {
                            if (i != toGo) that.updatePage(i, that.getItemHtml(_currentState[i]));
                        }

                        that.refresh();
                        _debug("new state: " + _currentState + "/" + _activeId + ", page: " + _ScrollView.page);
                    }

                    that.refresh();

                }
            }
        },

        show: function(id) {
            var that = this,
                item = that.getFromCache(id);
            _activeId = id;

            if(item !== -1) {
                if(!item[lIdName]) {
                    // Если первый
                    _currentState = [item[cIdName], item[rIdName], -1];
                    that.scrollToFast(0);
                    var nextItem = that.getFromCache(item[rIdName]);
                    if (nextItem !== -1) {
                        _currentState[2] = nextItem[rIdName];
                    }
                } else if (!item[rIdName]) {
                    // Если последний
                    _currentState = [-1, item[lIdName], item[cIdName]];
                    that.scrollToFast(2);
                    var nextItem = that.getFromCache(item[lIdName]);
                    if (nextItem !== -1) {
                        _currentState[0] = nextItem[lIdName];
                    }
                } else {
                    // Если из середины
                    _currentState = [item[lIdName], item[cIdName], item[rIdName]];
                    that.scrollToFast(1);
                }
                that.updateStatus(_itemsCache[id]);
            } else {
                _currentState = [-1, id, -1];
                that.scrollToFast(1);
                that.updateStoryFromServer(id);
            }

            _debug("show - " + _currentState + "/" + _activeId);

            if(!_eventAssigned) {
                setTimeout(function(){
                    var view = that.element.parents("[data-role=view]").data("kendoMobileView");
                    if (view) {
                        view.bind("show", function(e){
                            that.refresh();
                        });
                        _eventAssigned = true;
                    }
                }, 50);
            }

        },

        
        updateStoryFromServer: function(id) {

            var that = this;
            if (id != -1 && _requestQueue.indexOf(id) == -1) {
                _debug("updateStoryFromServer " + id);
                _requestQueue.push(id);
                $.ajax({
                    url: that.options.url,
                    data: {
                        id: id
                    },
                    timeout: that.options.timeout,
                    dataType:"jsonp",
                    success: function(item, textStatus, jqXHR) {
                        that.saveToCache(item);

                        if(_currentState.indexOf(item[cIdName]) !== -1) {
                            // запрашиваем заранее на шаг вперед
                            if(item[lIdName] && !_itemsCache[item[lIdName]]) that.updateStoryFromServer(item[lIdName]);
                            if(item[rIdName] && !_itemsCache[item[rIdName]]) that.updateStoryFromServer(item[rIdName]);
                        }

                        _debug("updateStoryFromServer OK " + id);

//                        var page = _currentState.indexOf(item[cIdName]);
//                        if (page !== -1) {
//                            var html = that.templates.fullItem(item);
//                            that.updatePage(page, html);
//                            that.updateStatus(item);
//                        }
                        that.updateStatus(item);

                    },
                    error: function(xmlhttprequest, textstatus, message) {
                        _debug("updateStoryFromServer ERROR " + id);
                        that.options.onError(id);
                    },
                    complete: function() {
                        _requestQueue.splice(_requestQueue.indexOf(id), 1);
                        _debug("_requestQueue " + _requestQueue);
                    }
                });
            }
        },



        updatePage: function(page, html) {
            _debug("updatePage " + page);
            var divIndex = page + 1;

            var oldText = this.element.find("div > div:nth-child(" + divIndex + ")").text();
            var newText = $(html).text();

            oldText = $.trim(oldText);
            newText = $.trim(newText);

            if (oldText != newText) {
                _debug("updatePage OK " + page);
                this.element.find("div > div:nth-child(" + divIndex + ")").html(html);
                this.refresh(0);
            } else {
                _debug("updatePage NO " + page);
            }
        },

        copyPage: function(source, target) {
            _debug("copyPage: " + source + "/" + target);
            var that = this;
            // _currentState[target] = _currentState[source];
            source++;
            that.updatePage(target, that.element.find("div > div:nth-child(" + source + ")").html());
        },

        saveToCache: function(item) {
            var that = this;
            while(_itemsCacheOrder.length > 10) {
                var idToDel = _itemsCacheOrder.pop();
                delete _itemsCache[idToDel];
            }
            var cIdName = that.options.cIdName;
            if (!_itemsCache[item[cIdName]]) {
                _itemsCache[item[cIdName]] = item;
                _itemsCacheOrder.unshift(item[cIdName]);
            } else if (!item.IsShort) {
                _itemsCache[item[cIdName]] = item;

                // "освежаем" порядок (недавно обновленные элементы в начало)
                _itemsCacheOrder.splice(_itemsCacheOrder.indexOf(item[cIdName]), 1);
                _itemsCacheOrder.unshift(item[cIdName]);
            }
        },

        getFromCache: function(id) {
            var that = this;
            if (_itemsCache[id]) {
                // "освежаем" порядок (недавно запрошенные элементы в начало)
                _itemsCacheOrder.splice(_itemsCacheOrder.indexOf(id), 1);
                _itemsCacheOrder.unshift(id);
                return _itemsCache[id];
            } else {
                that.updateStoryFromServer(id);
                return -1;
            }
        },





        options: {

            // the name is what it will appear as off the kendo namespace(i.e. kendo.ui.CustomWidget). 
            // The jQuery plugin would be jQuery.fn.CustomWidget.
            name: "ScrollViewInfinite",

            url: "http://api.maritimeprofessional.com/json/Story",
            timeout: 10000,
            onError: function(id) {},

            // templates
            fullItemTemplate: "<h1>#= Title #</h1><h1>#= StoryEID #</h1> #= ContentHTML #",
            shortItemTemplate: "<h1>#= StoryEID #</h1><div class='km-loader' style='margin-top:200px; text-align: center; padding: 100px'><span class='km-loading km-spin'></span></div>",
            emptyTemplate: "<div class='km-loader' style='margin-top:200px; text-align: center; padding: 100px'><span class='km-loading km-spin'></span></div>",

            // Id fields names
            cIdName: "StoryEID", // current / active
            lIdName: "PrevStoryEID",
            rIdName: "NextStoryEID"
        },

        templates: {
            fullItem: null,
            shortItem: null,
            emptyPage: null
        }

    });

    ui.plugin(ScrollViewInfinite);

})(jQuery, window);