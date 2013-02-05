/**
 * Created with JetBrains PhpStorm.
 * User: Анатолий
 * Date: 29.01.13
 * Time: 11:21
 * To change this template use File | Settings | File Templates.
 */
var viewModelStoriesList = new kendo.observable({
    Stories: [],
    StoriesIndex: [],
    PagesQueue: [],
    Template: kendo.template($("#story-details-template").html()),
    getScrollView: function() {
        var that = this;
        if ($("#scrollview").data("kendoMobileScrollView")) {
            return $("#scrollview").data("kendoMobileScrollView");
        }

        $("#scrollview").kendoMobileScrollView({
            change: function(e) {
                that.populateScrollVewContent(e.page);
            },
            page: 2
        });

        return $("#scrollview").data("kendoMobileScrollView");
    },
    populateScrollVewContent: function(page) {
        var that = this;
        that.addContentToScrollViewPage(page);
        that.addContentToScrollViewPage(page + 1);
        that.addContentToScrollViewPage(page - 1);
        that.clearContentOfScrollVewPage(page - 2);
        that.clearContentOfScrollVewPage(page + 2);
        if (scrollerInstance)
            scrollerInstance.reset();

    },
    populateScrollVewContentByEvent: function(e) {
        var page = viewModelStoriesList.getScrollView().page;

        viewModelStoriesList.populateScrollVewContent(page);
    },
    clearContentOfScrollVewPage: function(page) {
        var divIndex = page + 1;
        if (page >= 0 && page <= this.StoriesIndex.length)
            $("#scrollview div div:nth-child(" + divIndex + ")").html("");
    },
    navigateToStoryId: function(storyId) {
        window.app.navigate("#StoriesListSlider");
        var that = this;
        var page = that.getStoryIdPage(storyId);
        if (page != -1) {
            that.getScrollView().scrollTo(page);
            that.populateScrollVewContent(page);
        }

    },
    getStoryPage: function(story) {
        return this.getStoryIdPage(story.StoryEID);
    },
    getStoryIdPage: function(storyId){
        return this.get("StoriesIndex").indexOf(storyId);
    },
    addStory: function(story, flag) {
        var that = this;
        if (that.get("StoriesIndex").indexOf(story.StoryEID) === -1) {
            that.get("Stories").push(story);
            that.get("StoriesIndex").push(story.StoryEID);
            if (flag) that.initScrollViewContent();
        }
    },
    addStories: function(stories) {
        var that = this;
        for (var i = 0; i < stories.length; i++) {
            var dataItem = stories[i];
            var story = {
                IsFull: false,
                StoryEID: dataItem.StoryEid,
                Title: dataItem.Title,
                Author: "",
                DatePublished: kendo.toString(new Date(parseInt(dataItem.DatePublished.substr(6))), "dd MMM HH:mm"),
                ContentHtml: "<p>" + dataItem.Description + "</p>"
            };
            that.addStory(story, false);
        }
        that.initScrollViewContent();
    },
    updateStory: function(story) {
        var that = this;
        var i = that.get("StoriesIndex").indexOf(story.StoryEID);
        if (i === -1) {
            that.addStory(story, true);
        } else {
            that.get("Stories").splice(i, 1, story);
        }
    },
    updateStoryFromServerByPage: function(page) {
        var that = this;
        if (that.get("StoriesIndex")[page]) {
            that.updateStoryFromServer(that.get("StoriesIndex")[page]);
        }
    },
    updateStoryFromServer: function(storyId) {
        var that = this;
        $.ajax({
            url: "http://api.maritimeprofessional.com/json/Story?id=" + storyId,
            dataType:"jsonp",
            success: function(data) {
                var story = {
                    IsFull: true,
                    StoryEID: data.StoryEID,
                    Title: data.Title,
                    Author: data.Author,
                    DatePublished: kendo.toString(new Date(parseInt(data.DatePublished.substr(6))), "dd MMM HH:mm"),
                    ContentHtml: data.ContentHTML
                };
                that.updateStory(story);
                that.addContentToScrollViewStory(story);
            },
            error: function(xmlhttprequest, textstatus, message) {
                if (message === "timeout") {
                    window.app.navigate("#tabstrip-newsList");
                }
            }
        });
    },
    addContentToScrollViewPage: function(page) {
        var that = this;
        if (that.Stories[page]) {
            var divIndex = page + 1;
            $("#scrollview div div:nth-child(" + divIndex + ")").html(that.Template(that.Stories[page]));
            if (!that.Stories[page].IsFull) {
                that.updateStoryFromServerByPage(page);
            }
        }
    },
    addContentToScrollViewStory: function(story) {
        var that = this;
        var page = that.getStoryPage(story);
        that.addContentToScrollViewPage(page);
    },
    initScrollViewContent: function() {
        if (viewModelStoriesList.StoriesIndex) {
            var count = viewModelStoriesList.StoriesIndex.length;
            var content = "";
            for (var i = 0; i < count; i++) {
                content = content + '<div data-role="page"></div>';
            }
            viewModelStoriesList.getScrollView().content(content);
            // viewModelStoriesList.populateScrollVewContent(that.getScrollView().page);
        }
    },
    reset: function(){
        var that = this;
        that.set("StoriesIndex", new kendo.data.ObservableArray());
        that.set("Stories", new kendo.data.ObservableArray());
    }
});