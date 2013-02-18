/**
 * Created with JetBrains PhpStorm.
 * User: Анатолий
 * Date: 18.01.13
 * Time: 11:00
 * To change this template use File | Settings | File Templates.
 */

var MTProApp = (function ($, window, newsCategories) {
    var kendoMobileApp,

        templatesLoaded = false,

        viewNewsList = "#tabstrip-newsList",
        viewNewsDetails = "#test",
        viewConnectionError = "#connectionError",

        globalJsonpTimeout = 5000,

        urlNewsList = "http://api.maritimeprofessional.com/json/StreamNews",
        elmNewsSelector = "#newsList",
        widgetNewsList,
        dataNewsList,

        viewIssuesList = "#view-issues-list",
        urlIssuesList = "http://www.digitalwavepublishing.com/json/magazineissues",
        elmIssuesSelector = "#issuesList",
        widgetIssuesList,
        dataIssuesList,

        urlDetails = "http://api.maritimeprofessional.com/json/Story",
        elmDetailsSelector = "#sv",
        widgetDetails,

        popoverWidget,

        elmConnectionErrorSelector = "#refresh",

        newsDetails;

    var _private = {
        listInit: function () {
            if (widgetNewsList) {
                widgetNewsList.destroy();
                $(elmNewsSelector).html("");
                $(elmNewsSelector).parents("[data-role=view]").data("kendoMobileView").scroller.reset();
            }






            $(elmNewsSelector).kendoMobileListView({
                dataSource: dataNewsList,
                template: $("#news-list-template").text(),
                click: function (e) {
                    // viewModelStory.setFieldsFromListClick(e);
                    // viewModelStoriesList.navigateToStoryId(e.item.find("div.Story").data("storyid"));
                    // widgetDetails.show(e.item.find("div.Story").data("storyid"));
                },
                scrollTreshold: 300, //treshold in pixels
                appendOnRefresh: true,
                pullToRefresh: true,
                //addition parameters which will be passed to the DataSource's read method
                pullParameters: function(item) { //pass first data item of the ListView
                    if ($(elmNewsSelector).children().length > 12) {
                        $(elmNewsSelector + " li:gt(12)").remove();
                    }
                    return {
                        maxid: $(elmNewsSelector).find("li:first-child div.Story").data("storyid") // item.StoryEid,
                        // page: 1
                    };
                },
                endlessScroll: true,
                //addition parameters which will be passed to the DataSource's next method
                endlessScrollParameters: function(first, last) {
                    if ($(elmNewsSelector).children().length > 12) {
                        var scroller = kendoMobileApp.view().scroller;
                        var height = 0;
                        $(elmNewsSelector + " li:lt(12)").each(function(index, value) {
                            height = height + $(value).height();
                        });
                        scroller.scrollTo(0, - scroller.scrollTop + height + 160);
                        $(elmNewsSelector + " li:lt(12)").remove();
                    }
                    return {
                        minid: $(elmNewsSelector).find("li:last-child div.Story").data("storyid")
                    }
                }
            });

            widgetNewsList = $(elmNewsSelector).data("kendoMobileListView");

//            $(elmDetailsSelector).kendoScrollViewInfinite({
//                dataSource: dataNewsList,
//                fullItemTemplate: $("#news-details-template").html(),
//                shortItemTemplate: $("#news-details-short-template").html(),
//                url: urlDetails,
//                timeout:globalJsonpTimeout,
//                onError: function(id) {
//                }
//            });
//            widgetDetails = $(elmDetailsSelector).data("kendoScrollViewInfinite");


        },

        detailsInit: function() {

            var that = this;
            $(elmDetailsSelector).kendoScrollViewInfinite({
                fullItemTemplate: $("#news-details-template").html(),
                shortItemTemplate: $("#news-details-short-template").html(),
                url: urlDetails,
                timeout:globalJsonpTimeout,
                onError: function(id) {
                    kendoMobileApp.navigate(viewConnectionError);
                    _private.connectionError(function(){
                        kendoMobileApp.navigate(viewNewsDetails);
                        widgetDetails.navigateTo(id);
                    });

                }
            });
            widgetDetails = $(elmDetailsSelector).data("kendoScrollViewInfinite");

        },



        listIssuesInit: function (id) {
            id = id || 11;
            if (widgetIssuesList) {
                widgetIssuesList.destroy();
                $(elmIssuesSelector).html("");
                $(elmIssuesSelector).parents("[data-role=view]").data("kendoMobileView").scroller.reset();
                dataIssuesList = null;
            }

            dataIssuesList = new kendo.data.DataSource({
                pageSize: 12,
                serverPaging: true,
                transport: {
                    read: {
                        url: urlIssuesList, // the remove service url
                        dataType: "jsonp", // JSONP (JSON with padding) is required for cross-domain AJAX
                        timeout: globalJsonpTimeout
                    },
                    parameterMap: function(options) {
                        var parameters = {
                            width:200,
                            take: 12,
                            magazineid: id/*,
                            skip: options.skip,
                            minid: options.minid,
                            maxid: options.maxid,

                            categoriesids: newsCategories.getSelectedString()
                            // page: options.page //next page */
                        }

                        return parameters;
                    }
                },
                schema: { // describe the result format
                    data: "Issues" // the data which the data source will be bound to is in the "results" field
                },
                error: function(e) {
                    kendoMobileApp.navigate(viewConnectionError);
                    setTimeout(function() {
                        _private.connectionError(function() {
                            _private.listInit();
                            kendoMobileApp.navigate(viewIssuesList);
                        });
                    }, 1000);
                },
                requestStart: function() {
                    kendoMobileApp.showLoading();
                },
                requestEnd: function (e) {
                    kendoMobileApp.hideLoading();
                    // var data = e.response.Stories;
                    // viewModelStoriesList.addStories(data);
                    // var listView = $("#newsList").data("kendoMobileListView");

                }
            });

            $(elmIssuesSelector).kendoMobileListView({
                dataSource: dataIssuesList,
                template: $("#tpl-issues-list").text(),
                click: function (e) {
                    // viewModelStory.setFieldsFromListClick(e);
                    // viewModelStoriesList.navigateToStoryId(e.item.find("div.Story").data("storyid"));
                    // widgetDetails.navigateTo(e.item.find("div.Story").data("storyid"));
                },
                scrollTreshold: 30, //treshold in pixels
                appendOnRefresh: true,
                pullToRefresh: false,
                //addition parameters which will be passed to the DataSource's read method
                pullParameters: function(item) { //pass first data item of the ListView
                    return {
                        maxid: $(elmNewsSelector).find("li:first-child div.Story").data("storyid") // item.StoryEid,
                        // page: 1
                    };
                },
                endlessScroll: false,
                //addition parameters which will be passed to the DataSource's next method
                endlessScrollParameters: function(first, last) {
                    if ($(elmNewsSelector).children().length > 12) {
                        var scroller = kendoMobileApp.view().scroller;
                        var height = 0;
                        $(elmNewsSelector + " li:lt(12)").each(function(index, value) {
                            height = height + $(value).height();
                        });
                        scroller.scrollTo(0, - scroller.scrollTop + height);
                        $(elmNewsSelector + " li:lt(12)").remove();
                    }
                    return {
                        minid: $(elmNewsSelector).find("li:last-child div.Story").data("storyid")
                    }
                }
            });

            widgetIssuesList = $(elmIssuesSelector).data("kendoMobileListView");

        },

        connectionError: function(fx) {
            var button = $(elmConnectionErrorSelector).data("kendoMobileButton");
            if (button) button.destroy();

            $(elmConnectionErrorSelector).kendoMobileButton({
                icon: "refresh",
                click: function(e) {
                    fx();
                }
            });
        }

    }

    return {
        init: function(MobileApp) {
            var that = this;
            kendoMobileApp = MobileApp;

            newsCategories.init();
            dataNewsList = new kendo.data.DataSource({
                pageSize: 12,
                serverPaging: true,
                transport: {
                    read: {
                        url: urlNewsList, // the remove service url
                        dataType: "jsonp", // JSONP (JSON with padding) is required for cross-domain AJAX
                        timeout: globalJsonpTimeout
                    },
                    parameterMap: function(options) {
                        var parameters = {
                            imageWidth:80,
                            ImageHeight:80,
                            take: options.pageSize,
                            skip: options.skip,
                            minid: options.minid,
                            maxid: options.maxid,

                            categoriesids: newsCategories.getSelectedString()
                            // page: options.page //next page
                        }

                        return parameters;
                    }
                },
                schema: { // describe the result format
                    data: "Stories" // the data which the data source will be bound to is in the "results" field
                },
                error: function(e) {
                    kendoMobileApp.navigate(viewConnectionError);
                    setTimeout(function() {
                        _private.connectionError(function() {
                            _private.listInit();
                            kendoMobileApp.navigate(viewNewsList);
                        });
                    }, 1000);
                },
                requestStart: function() {
                    kendoMobileApp.showLoading();
                },
                requestEnd: function (e) {
                    kendoMobileApp.hideLoading();
                    // var data = e.response.Stories;
                    // viewModelStoriesList.addStories(data);
                    // var listView = $("#newsList").data("kendoMobileListView");
                }
            });

        },

        updateList: function() {
            _private.listInit();
        },

        updateIssuesList: function(e) {
                var magazineid = e.view.params.magazineid || 11;
                _private.listIssuesInit(magazineid);
        },

        popoverOpen: function (e) {
            popoverWidget = e.sender.element.parent();
            var v = kendoMobileApp.pane.viewEngine.view().element.find("[data-role=content]");
            popoverWidget.height(v.height() - 20);
            popoverWidget.width(v.width() - 30);
        },

        popoverClose: function() {
            _private.listInit();
            if (kendoMobileApp.view().id != viewNewsList)
                kendoMobileApp.navigate(viewNewsList);
        },

        onShowDetails: function(e) {
            // widgetDetails.show(e.view.params.id);
        },


        connectionError: function(fx) {
            _private.connectionError(fx);
        },

        newsDetailsInit: function() {
            _private.detailsInit();
        },

        setUrlDetails: function(url) {
            widgetDetails.options.url = url;
        },
        widgetNewsList: function() {
            return widgetNewsList;
        },
        widgetDetails: function() {
            return widgetDetails;
        }
    }
})(jQuery, window, newsCategories);
