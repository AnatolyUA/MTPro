/**
 * Created with JetBrains PhpStorm.
 * User: Анатолий
 * Date: 18.01.13
 * Time: 11:00
 * To change this template use File | Settings | File Templates.
 */

var MTProApp = (function ($, window, tL, newsCategories) {
    var kendoMobileApp,

        viewNewsList = "#tabstrip-newsList",
        viewNewsDetails = "#test",
        viewConnectionError = "#connectionError",

        globalJsonpTimeout = 5000,

        urlNewsList = "http://api.maritimeprofessional.com/json/StreamNews",
        elmNewsSelector = "#newsList",
        widgetNewsList,
        dataNewsList,

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
                dataNewsList = null;
            }

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

            $(elmNewsSelector).kendoMobileListView({
                dataSource: dataNewsList,
                template: $("#news-list-template").text(),
                click: function (e) {
                    // viewModelStory.setFieldsFromListClick(e);
                    // viewModelStoriesList.navigateToStoryId(e.item.find("div.Story").data("storyid"));
                    widgetDetails.navigateTo(e.item.find("div.Story").data("storyid"));
                },
                scrollTreshold: 30, //treshold in pixels
                appendOnRefresh: true,
                pullToRefresh: true,
                //addition parameters which will be passed to the DataSource's read method
                pullParameters: function(item) { //pass first data item of the ListView
                    return {
                        maxid: $(elmNewsSelector).find("li:first-child div.Story").data("storyid") // item.StoryEid,
                        // page: 1
                    };
                },
                endlessScroll: true,
                //addition parameters which will be passed to the DataSource's next method
                endlessScrollParameters: function(first, last) {
//                        while ($("#newsList").children().length > 12) {
//                            $("#newsList li:first-child").remove();
//                        }
//                        $("#newsList").data("kendoMobileListView").refresh();
                    return {
                        minid: $(elmNewsSelector).find("li:last-child div.Story").data("storyid")
                    }
                }
            });

            widgetNewsList = $(elmNewsSelector).data("kendoMobileListView");

        },

        detailsInit: function() {
            var that = this;
            $(elmDetailsSelector).kendoScrollViewInfinite({
                fullItemTemplate: $("#news-details-template").html(),
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

            tL.loadExtTemplate("templates/_index.tpl.html");
            $(document).bind("TEMPLATES_LOADED", function(e, data) {
                _private.listInit();
                _private.detailsInit();
            });


        },

        updateList: function() {
            _private.listInit();
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

        connectionError: function(fx) {
            _private.connectionError(fx);
        },

        setUrlDetails: function(url) {
            widgetDetails.options.url = url;
        },
        widgetNewsList: function() {
            return widgetDetails;
        },
        widgetDetails: function() {
            return widgetDetails;
        }
    }
})(jQuery, window, templateLoader, newsCategories);
