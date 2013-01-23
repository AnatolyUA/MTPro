/**
 * Created with JetBrains PhpStorm.
 * User: Анатолий
 * Date: 18.01.13
 * Time: 12:00
 * To change this template use File | Settings | File Templates.
 */
var newsCategories = (function($, window) {

    var elmNewsCategoriesSelector = "#newsCategoriesList",
        tplNewsCategories = '<li data-catid="#= CategoryEID #"><label>#= CategoryDisplay #<input # if ( isSelected ) {# checked="checked" #}# type="checkbox"></label></li>';

    var _private = {
        categories: $.parseJSON(localStorage.categories),
        update: function(cats) {
            _private.categories = cats;
            localStorage.categories = JSON.stringify(cats);
        },
        list: null
    }

    return {
        get: function() {
            return _private.categories;
        },
        getSelectedIds: function() {
            if (_private.categories) {
                return $.map(_private.categories, function(cat) {
                    return cat.isSelected ? cat["CategoryEID"] : null;
                });
            }
            return [];
        },
        getSelectedString: function() {
            return this.getSelectedIds().join(",");
        },
        toggle: function(id) {
            _private.update($.map(_private.categories, function(cat) {
                if (cat["CategoryEID"] == id) cat.isSelected = !cat.isSelected;
                return cat;
            }));
        },
        init: function() {
            var that = this;
            $.ajax({
                url: "http://api.maritimeprofessional.com/json/CategoriesList",
                dataType:"jsonp",
                timeout:10000,
                success: function(data, textStatus, jqXHR) {
                    var selectedIds = that.getSelectedIds();
                    var restoreSelection = $.map(data, function(cat, index) {
                        cat.isSelected = (selectedIds.indexOf(cat["CategoryEID"]) !== -1);
                        return cat;
                    });
                    _private.update(restoreSelection);
                },
                error: function(xmlhttprequest, textstatus, message) {
                    if (!_private.categories) {
                        _private.update([{"CategoryEID":"nczw","NextCategoryEID":"","PrevCategoryEID":"","CategoryDisplay":"People \u0026 Company News","storiesShort":[]},{"CategoryEID":"nd48","NextCategoryEID":"","PrevCategoryEID":"","CategoryDisplay":"Shipbuilding","storiesShort":[]},{"CategoryEID":"nd5v","NextCategoryEID":"","PrevCategoryEID":"","CategoryDisplay":"Offshore","storiesShort":[]},{"CategoryEID":"nda7","NextCategoryEID":"","PrevCategoryEID":"","CategoryDisplay":"Finance","storiesShort":[]},{"CategoryEID":"ndbt","NextCategoryEID":"","PrevCategoryEID":"","CategoryDisplay":"Government Update","storiesShort":[]},{"CategoryEID":"ndg6","NextCategoryEID":"","PrevCategoryEID":"","CategoryDisplay":"Education/Training","storiesShort":[]},{"CategoryEID":"ndmk","NextCategoryEID":"","PrevCategoryEID":"","CategoryDisplay":"Casualties","storiesShort":[]},{"CategoryEID":"ndp5","NextCategoryEID":"","PrevCategoryEID":"","CategoryDisplay":"Logistics","storiesShort":[]}]);
                    }
                },
                complete: function() {
                    that.refreshList();
                }
            });
        },
        refreshList: function() {
            var that = this;
            if(!_private.list) {
                $(elmNewsCategoriesSelector).kendoMobileListView({
                    dataSource: that.get(),
                    template: tplNewsCategories,
                    click: function (e) {
                        var element = $(e.target.context);
                        if (element.get(0).tagName == "INPUT") {
                            that.toggle(e.item.data("catid"));
                        } else {
                            // e.preventDefault();
                        }
                    }
                });
                _private.list = $(elmNewsCategoriesSelector).data("kendoMobileListView");
            }
            _private.list.refresh();
        }
    }

})(jQuery, window);
