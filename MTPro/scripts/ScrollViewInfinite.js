(function($, window) {

    // shorten references to variables. this is better for uglification 
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget

    var ScrollViewInfinite = Widget.extend({

        init: function(element, options) {

            // call the base function to create the widget
            Widget.fn.init.call(this, element, options);
            this._create();
        },

        // create ScrollView element and assigning it to _ScrollView
        _create: function() {
            var that = this;
            that.templates.fullItem = kendo.template(that.options.fullItemTemplate);
            that.templates.shortItem = kendo.template(that.options.shortItemTemplate);
            that.templates.emptyPage = that.options.emptyTemplate;


            // begin with one page
            that.element.html('<div data-role="page">' + that.templates.emptyPage + '</div>');
            that.element.kendoMobileScrollView({
                change: function(e) {
                    var page = that._currentState[e.page];
                    if (that.element.parents("[data-role=view]").data("kendoMobileView")) that.element.parents("[data-role=view]").data("kendoMobileView").scroller.reset();

                    setTimeout(function() {
                        that.navigateTo(page);
                    }, 100);
                }
            });
            that._ScrollView = that.element.data("kendoMobileScrollView");
        },

        navigateTo: function(id) {
            var that = this;
            if (id != that._activeId) {
                    that._activeId = id;
                    var item = that.getFromCache(id);
                    if (item !== -1) {
                        that.refreshStatus(item);
                    } else {
                        that._currentState = [id];
                        that.regeneratePages();
                    }
            }

            setTimeout(function(){
                if(!that._eventAssigned) {
                    var view = that.element.parents("[data-role=view]").data("kendoMobileView");
                    if (view) {
                        view.bind("show", function(e){
                            that.refresh();
                        });
                        that._eventAssigned = true;
                    }
                }
            }, 50);
        },

        refresh: function(e) {
            // var that = e.sender.element.find("[data-role=scrollviewinfinite]").data("kendoScrollViewInfinite");
            var that = this;
            that._ScrollView.refresh();
            that._ScrollView.scrollTo(that._currentState.indexOf(that._activeId));
        },

        regeneratePages: function() {
            var that = this,
                content = "",
                activePage = that._currentState.indexOf(that._activeId),
                activePageHtml = that.getItemHtml(that._activeId);

            for (var i = 0; i < that._currentState.length; i++) {
                content = content + '<div data-role="page">' + activePageHtml + '</div>';
            }
            that._ScrollView.content(content);
            that._ScrollView.refresh();

            that._ScrollView.duration = 0.1;
            that._ScrollView.options.duration = 0.1;
            that._ScrollView.scrollTo(activePage);

            for (var i = 0; i < that._currentState.length; i++) {
                if (i != activePage)
                    that.updatePage(i, that.getItemHtml(that._currentState[i]));
            }

            // that.navigateTo(that._activeId);
            that._ScrollView.duration = 300;
            that._ScrollView.options.duration = 300;
        },

        getItemHtml: function(id) {
            var that = this,
                item = that.getFromCache(id),
                html = that.templates.emptyPage;

            if (item !== -1) {
                if (!item.IsShort) return that.templates.fullItem(item);
                html = that.templates.shortItem(item);
            }
            that.updateStoryFromServer(id);
            return html;
        },

        refreshStatus: function(item) {
            var that = this;
            var cIdName = that.options.cIdName;
            var lIdName = that.options.lIdName;
            var rIdName = that.options.rIdName;
            var newState = [item[cIdName]];

            if (item[cIdName] == that._activeId) {
                // Только в этом случае что-то делаем
                if (item[lIdName]) newState.unshift(item[lIdName]);
                if (item[rIdName]) newState.push(item[rIdName]);
                if (newState.toString() != that._currentState.toString()) {
                    that._currentState = newState;
                    that.regeneratePages();
                }

            }
        },

        updateStoryFromServer: function(id) {
            var that = this;
            $.ajax({
                url: that.options.url,
                data: {
                    id: id
                },
                dataType:"jsonp",
                success: function(data, textStatus, jqXHR) {
                    that.saveToCache(data);

                    var page = that._currentState.indexOf(data[that.options.cIdName]);
                    if (page !== -1) {
                        var html = that.templates.fullItem(data);
                        that.updatePage(page, html);
                        that.refreshStatus(data);
                    }

                },
                error: function(xmlhttprequest, textstatus, message) {
                    if (message === "timeout") {
                        window.app.navigate("#tabstrip-newsList");
                    }
                }
            });
        },



        updatePage: function(page, html) {
            page++;
            this.element.find("div > div:nth-child(" + page + ")").html(html);
            this._ScrollView.refresh();
        },

        saveToCache: function(item) {
            var that = this;
            var cIdName = that.options.cIdName;
            if (!that._itemsCache[item[cIdName]]) {
                that._itemsCache[item[cIdName]] = item;
                that._itemsOrder.unshift(item[cIdName]);
            } else if (!item.IsShort) {
                that._itemsCache[item[cIdName]] = item;

                // "освежаем" порядок (недавно обновленные элементы в начало)
                that._itemsOrder.splice(that._itemsOrder.indexOf(item[cIdName]), 1);
                that._itemsOrder.unshift(item[cIdName]);
            }
        },

        getFromCache: function(id) {
            var that = this;
            if (that._itemsCache[id]) {
                // "освежаем" порядок (недавно запрошенные элементы в начало)
                that._itemsOrder.splice(that._itemsOrder.indexOf(id), 1);
                that._itemsOrder.unshift(id);
                return that._itemsCache[id];
            } else {
                return -1;
            }
        },

        _currentState: [], // массив, содержащий текущие страницы ScrollView
        _activeId: "",     // Id активной в данный момент новости

        _ScrollView: null,

        _itemsCache:[], // TODO реализовать очитску кеша
        _itemsOrder: [], // Самые свежие в начале, старые, которые можно удалить, в конце

        _eventAssigned: false,



        options: {

            // the name is what it will appear as off the kendo namespace(i.e. kendo.ui.CustomWidget). 
            // The jQuery plugin would be jQuery.fn.CustomWidget.
            name: "ScrollViewInfinite",

            url: "http://api.maritimeprofessional.com/json/Story",

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