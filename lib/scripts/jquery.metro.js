/**
* jqMetro
* JQUERY PLUGIN FOR METRO UI CONTROLS
*
* Copyright (c) 2011 Mohammad Valipour (http://manorey.net/mohblog)
* Licensed under the MIT License:
*   http://www.opensource.org/licenses/mit-license.php
*
*/

// ================= PIVOT CONTROL
; (function ($) {
    var defaults = {
        animationDuration: 500,
        headerOpacity: 0.5,
        fixedHeaders: false,
        animationEasing: "easeOutExpo",
        headerSelector: "h2",
        itemSelector: ".ui-pivot-item",
        itemsContainerSelector: ".ui-pivot-items",
        controlInitializedEventName: "controlInitialized",
        selectedItemChangedEventName: "selectedItemChanged"
    };

    $.fn.metroPivot = function (settings) {
        if (this.length != 1) { return this.each(function (index, el) { $(el).metroPivot(settings); }); }

        $.extend(this, defaults, settings);
        $.extend(this, {
            animating: false,
            currentIndex: 0,

            getHeader: function (item) { return item.find(this.headerSelector).first(); },
            getItems: function () { return this.find(this.itemSelector); },
            getItemsContainer: function () { return this.find(this.itemsContainerSelector); },
            getHeadersContainer: function () { return this.find(".ui-pivot-headers"); },
            goToNext: function () { this.changeItem(this.getHeadersContainer().children(".current").next()); },
            goToPrevious: function () { this.changeItem(this.getHeadersContainer().children().last(), true); },
            goToItemByName: function (header) { this.changeItem(this.getHeadersContainer().children(":contains(" + header + ")").first()); },
            goToItemByIndex: function (index) { this.changeItem(this.getHeadersContainer().children().filter("[index='" + index + "']")); },

            initialize: function () {
                var pivot = this;
                var myWidth = this.outerWidth();

                var headers = $("<div class='ui-pivot-headers' />").prependTo(this);

                this.getItems().each(function (index, el) {
                    el = $(el).attr("data-scroll", "y");

                    // set height
                    el.height(itemsHeight - (el.outerHeight() - el.height()));

                    // set width
                    el.width(myWidth - (el.outerWidth() - el.width()));

                    var headerElement = pivot.getHeader(el);
                    if (headerElement.length == 0) return;

                    var headerItem = $("<span class='ui-pivot-header' />").html(headerElement.html()).fadeTo(0, pivot.headerOpacity);

                    if (index == 0) {
                        headerItem.addClass("current").fadeTo(0, 1);
                        el.addClass("current");
                    }
                    else { el.hide(); }

                    headerItem.attr("index", index).click(function () { pivot.changeItem($(this)); }).appendTo(headers);
                    headerElement.remove();
                });

                // set height: must be done after first .each() because headers are set there
                var itemsHeight = this.parent().height() - this.getItemsContainer().position().top;
                this.getItems().each(function (index, el) {
                    el = $(el);
                    el.height(itemsHeight - (el.outerHeight() - el.height()));
                });


                // enable swipe
                this.bind("swiperight", function () { pivot.goToPrevious(); })
                    .bind("swipeleft", function () { pivot.goToNext(); });

                this.data("controller", pivot);
                this.trigger(this.controlInitializedEventName);
            },
            setCurrentHeader: function (header, goLeft) {
                var pivot = this;

                // make current header a normal one
                this.getHeadersContainer().children(".current").removeClass("current").fadeTo(0, this.headerOpacity);

                // make selected header to current
                header.addClass("current").fadeTo(0, 1);

                if (pivot.fixedHeaders == false) {
                    var container = pivot.getHeadersContainer();
                    if (goLeft) {
                        container.css({ marginLeft: -header.width() }).prepend(header).animate({ marginLeft: 0 }, pivot.animationDuration, pivot.animationEasing)
                    }
                    else {
                        container.animate({ marginLeft: -header.position().left }, pivot.animationDuration, pivot.animationEasing, function () {
                            container.css({ marginLeft: 0 }).append(header.prevAll().hide().fadeIn("fast"));
                        })
                    }
                }
            },
            setCurrentItem: function (item, goLeft) {
                var pivot = this;

                // hide current item immediately
                this.getItems().filter(".current").hide().removeClass("current");

                // after a little delay
                setTimeout(function () {
                    // move the item to far right and make it visible
                    item.css({ left: item.outerWidth() * (goLeft ? -1 : 1) }).show().addClass("current");

                    // animate it to left
                    item.animate({ left: 0 }, pivot.animationDuration, pivot.animationEasing, function () { pivot.onSelectedItemChanged(); });

                }, 200);
            },
            onSelectedItemChanged: function () {
                this.animating = false;
                this.trigger(this.selectedItemChangedEventName);
            },
            changeItem: function (header, goLeft) {
                // ignore if already current
                if (header.is(".current")) return;

                // ignore if still animating
                if (this.animating) return;
                this.animating = true;

                // set current header
                this.setCurrentHeader(header, goLeft);

                var index = header.attr("index");
                // find and set current item
                var item = this.getItems().eq(index);
                this.setCurrentItem(item, goLeft);
            }
        });

        return this.initialize();
    };
})(jQuery);

// ================================== PANORAMA CONTROL
; (function ($) {
    var defaults = {
        animationDuration: 500,
        animationEasing: "easeOutExpo",
        titleSelector: "h1",
        itemsContainerSelector: ".ui-panorama-items",
        itemSelector: ".ui-panorama-item",
        titleAnimationStep: 15,
        backgroundAnimationStep: 15,
        itemsGapPercentage: 10,
        controlInitializedEventName: "controlInitialized",
        selectedItemChangedEventName: "selectedItemChanged"
    };

    $.fn.metroPanorama = function (settings) {
        if (this.length != 1) {
            return this.each(function (index, el) { $(el).metroPanorama(settings); });
        }

        $.extend(this, defaults, settings);
        $.extend(this, {
            animating: false,
            currentIndex: 0,
            totalNumberOfItems: 1,
            getItemsContainer: function () { return this.find(this.itemsContainerSelector); },
            getItems: function () { return this.getItemsContainer().find(this.itemSelector); },
            getTitle: function () { return this.find(this.titleSelector).first(); },
            fixIndex: function (index) {
                if (index < 0) index += this.totalNumberOfItems;
                else if (index >= this.totalNumberOfItems) index -= this.totalNumberOfItems;
                return index;
            },
            getCurrentItem: function () { return this.getItems().eq(this.currentIndex); },
            goToNext: function () { this.changeItem(true); },
            goToPrevious: function () { this.changeItem(false); },

            _item_width: 0,
            initialize: function () {
                var controller = this;

                // set height
                var myHeight = this.parent().height();
                this.height(myHeight);
                var itemsHeight = myHeight - this.getItemsContainer().position().top;
                this.getItemsContainer().height(itemsHeight);

                this.totalNumberOfItems = this.getItems().length;

                var myWidth = this.outerWidth();
                var item_width = myWidth * (100 - this.itemsGapPercentage) / 100;
                this._item_width = item_width;

                this.getItems().each(function (index, el) {
                    el = $(el).attr("data-scroll", "y");

                    // set height
                    el.height(itemsHeight - (el.outerHeight() - el.height()));

                    // set real width
                    el.width(item_width - (el.outerWidth() - el.width()));

                    // set initial visibility state
                    if (index == 1) el.css({ left: item_width });
                    if (index > 1) el.hide();
                });

                // enable swipe
                this.bind("swiperight", function () { controller.goToPrevious(); })
                    .bind("swipeleft", function () { controller.goToNext(); });

                this.data("controller", controller);

                this.trigger(this.controlInitializedEventName);
            },
            changeItem: function (goRight) {
                // ignore if still animating
                if (this.animating) return;
                this.animating = true;

                var controller = this;

                var otherItemIndex = this.fixIndex(goRight ? (this.currentIndex + 1) : (this.currentIndex - 1));
                var otherItem2Index = this.fixIndex(goRight ? (this.currentIndex + 2) : (this.currentIndex + 1));

                var currentItem = this.getItems().eq(this.currentIndex);
                var otherItem = this.getItems().eq(otherItemIndex);
                if (!goRight) {
                    otherItem.css({ left: -this._item_width });
                }

                var otherItem2 = this.totalNumberOfItems > 2 ? this.getItems().eq(otherItem2Index) : undefined; // only when 3 and more
                if (goRight && otherItem2) {
                    otherItem2.css({ left: 2 * this._item_width });
                }

                var isLast = this.currentIndex == (this.totalNumberOfItems - 1);
                var isFirst = this.currentIndex == 0;

                var animationTarget = { left: ((goRight ? "-=" : "+=") + this._item_width) };

                // after a little delay
                setTimeout(function () {
                    // hide any other item
                    controller.getItems().not(":eq(" + controller.currentIndex + ")").not(":eq(" + otherItemIndex + ")").hide();

                    // showItems
                    otherItem.show();
                    otherItem2.show();

                    // animate!
                    var onAnimationFinished = function () {
                        controller.currentIndex = otherItemIndex;
                        controller.onSelectedItemChanged();
                    };
                    if (isLast && goRight) {
                        controller.getTitle().css("margin-left", "100%").delay(controller.animationDuration / 4);
                    }
                    else if (isFirst && !goRight) {
                        controller.getTitle().css("margin-left", "-100%").delay(controller.animationDuration / 4);
                    }
                    currentItem.animate(animationTarget, controller.animationDuration, controller.animationEasing);
                    otherItem.animate(animationTarget, controller.animationDuration, controller.animationEasing, onAnimationFinished);
                    if (otherItem2) otherItem2.animate(animationTarget, controller.animationDuration, controller.animationEasing);
                    controller.getTitle().animate({ marginLeft: (-otherItemIndex * controller.titleAnimationStep) + "%" }, controller.animationDuration, controller.animationEasing);
                    controller.animate({ backgroundPosition: (otherItemIndex * controller.backgroundAnimationStep) + "% 0" }, controller.animationDuration, controller.animationEasing);
                }, 200);
            },
            onSelectedItemChanged: function (index) {
                this.animating = false;
                this.trigger(this.selectedItemChangedEventName);
            }
        });

        return this.initialize();
    };
})(jQuery);

// ================================== toggleSwitch
; (function ($) {
    var defaults = {
    };

    $.fn.metroToggleSwitch = function (settings) {
        if (this.length != 1) {
            return this.each(function (index, el) { $(el).metroToggleSwitch(settings); });
        }

        $.extend(this, defaults, settings);
        $.extend(this, {
            initialize: function () {
                var el = $(this);
                if (!el.is("input:checkbox")) { return; }

                var template =
                "<div class='ui-switch'>" +
                "    <div class='ui-switch-box ui-border'><div class='ui-switch-box-inner ui-bg-accent'></div></div>" +
                "    <div class='ui-switch-handle ui-border ui-bg-ph-fg'></div>" +
                "</div>";

                // create control
                var control = $(template).click(this.toggleSwitch_click).data("input", el);
                var handle = control.find(".ui-switch-handle");
                var boxInner = control.find(".ui-switch-box-inner");

                // set initial state
                var isChecked = el.prop("checked");
                handle.css({ left: isChecked ? 40 : 0 });
                boxInner.fadeTo(1, isChecked ? 1 : 0);

                // append
                el.hide().after(control);
                control.before($("<span class='ui-switch-title' />").html(isChecked ? "On" : "Off"));
            },
            toggleSwitch_click: function () {
                var toggleSwitch = $(this);
                var el = toggleSwitch.data("input");

                var handle = toggleSwitch.find(".ui-switch-handle");
                if (handle.is(":animated")) return;

                var boxInner = toggleSwitch.find(".ui-switch-box-inner");

                var isChecked = el.prop("checked");

                handle.animate({ left: isChecked ? 0 : 40 }, "fast");
                boxInner.fadeTo("fast", isChecked ? 0 : 1);

                toggleSwitch.siblings(".ui-switch-title").html(isChecked ? "Off" : "On");

                el.prop("checked", !isChecked).trigger("change");
            }
        });

        return this.initialize();
    };
})(jQuery);

// ================================== List Picker
; (function ($) {
    var defaults = {};

    $.fn.metroListPicker = function (settings) {
        if (this.length != 1) { return this.each(function (index, el) { $(el).metroListPicker(settings); }); }


        $.extend(this, defaults, settings);
        $.extend(this, {
            selectedItemClass: "ui-fg-accent current",

            list_height: 0,
            is_open: false,

            getList: function () { return this.parent().find("ul"); },
            getCurrentHeight: function () { return this.getList().find(".current").outerHeight(); },
            initialize: function () {
                var controller = this;
                if (!this.is("select")) return;

                // create
                var container = $("<div class='ui-list-picker' />").insertBefore(this).append(this.hide());
                var list = $("<ul class='closed' />").appendTo(container);

                var anySelected = this.find(":selected").length > 0;
                // add items
                this.find("option").each(function (index, opt) {
                    opt = $(opt);
                    var item = $("<li />").html(opt.html()).attr("index", index).appendTo(list).click(function (evt) {
                        if (controller.is_open) {
                            var $this = $(this);

                            // set current
                            list.find(".current").removeClass(controller.selectedItemClass);
                            $this.addClass(controller.selectedItemClass);
                            controller.close();

                            // update value
                            controller.find("option").eq($this.attr("index")).prop("selected", true);
                            controller.trigger("change");
                        }
                        else {
                            controller.open();
                        }
                    });
                    if (opt.is(":selected") || (!anySelected && index == 0)) {
                        item.addClass(controller.selectedItemClass);
                    }
                });
                this.list_height = list.find("li").sum(function () { return $(this).outerHeight(); });
                list.height(this.getCurrentHeight()).find("li").first().css({ marginTop: -this.getScrollTopValue() })

                $(document).click(function (e) {
                    if ($(e.srcElement).parent().get(0) == list.get(0)) return; // click is on this list picker
                    controller.close();
                });

                // create actions
                this.data("controller", this);
            },
            getScrollTopValue: function () {
                var top = 0;
                this.getList().find(".current").prevAll().each(function (index, pp) { top += $(pp).outerHeight(true); });
                return top;
            },
            open: function () {
                if (this.is_open) return;
                this.is_open = true;

                this.getList().removeClass("closed").animate({ height: this.list_height }, "fast", $.mobile.metro.defaultEasing)
                    .find("li").first().animate({ marginTop: 0 }, "fast", $.mobile.metro.defaultEasing);
            },
            close: function () {
                if (!this.is_open) return;
                this.is_open = false;

                this.getList().animate({ height: this.getCurrentHeight() }, "fast", $.mobile.metro.defaultEasing, function () {
                    $(this).addClass("closed")
                }).find("li").first().animate({ marginTop: -this.getScrollTopValue() }, "fast", $.mobile.metro.defaultEasing);
            }
        });

        return this.initialize();
    };
})(jQuery);


// ================================== Context Menu
; (function ($) {
    var defaults = {};

    $.fn.metroContextMenu = function (settings) {
        if (this.length != 1) { return this.each(function (index, el) { $(el).metroContextMenu(settings); }); }


        $.extend(this, defaults, settings);
        $.extend(this, {
            _page_scale: 0.95,
            isOpen: function () { return this.is(":visible") || this.is(":animated"); },
            initialize: function () {
                var controller = this;

                this.hide().addClass("ui-bg");

                var scaleAttr = this.attr("data-scale");
                if (scaleAttr) this._page_scale = parseFloat(scaleAttr);

                var owner = $(this.attr("data-target"));
                if (owner.length == 0) return;

                owner.bind("taphold", function (e) { controller.open(e.currentTarget); });

                $(document).bind("mousedown", function (e) { controller.close(); });

                this.data("controller", this);
            },
            getScaleCss: function (s) {
                return {
                    "transform": "scale(" + s + ")",
                    "-moz-transform": "scale(" + s + ")",
                    "-webkit-transform": "scale(" + s + ")",
                    "-o-transform": "scale(" + s + ")"
                };
            },
            open: function (target) {
                if (this.isOpen()) return;

                target = $(target);

                var pos = target.position();
                pos.top += target.outerHeight() / 2;
                pos.left += (target.outerWidth() - this.outerWidth()) / 2;

                this.css({ top: pos.top, left: pos.left }).slideDown("fast")
                    .css(this.getScaleCss(1 / this._page_scale))
                    .closest(".ui-page").css(this.getScaleCss(this._page_scale));
            },
            close: function () {
                if (!this.isOpen()) return;
                this.slideUp("fast").closest(".ui-page").css(this.getScaleCss(1));
            }
        });

        return this.initialize();
    };
})(jQuery);

// ================================== ProgressBar
; (function ($) {
    var defaults = {
        numberOfDots: 5,
        cycleDuration: 3000
    };

    $.fn.metroProgressBar = function (settings) {
        if (this.length != 1) {
            return this.each(function (index, el) { $(el).metroProgressBar(settings); });
        }

        $.extend(this, defaults, settings);
        $.extend(this, {
            isEnabled: false,
            initialize: function () {
                this.hide();

                // add dots
                for (var i = 0; i < this.numberOfDots; i++) {
                    var $dot = $("<div class='ui-progressbar-dot ui-bg-accent' />");
                    this.append($dot);
                }

                this.setupAnimation();

                // create actions
                this.data("controller", this);
            },
            setupAnimation: function () {
                var allDots = this.find(".ui-progressbar-dot");

                var dur = this.cycleDuration; // ms
                var tMiddle = dur * 0.45; //ms
                var dMiddle = this.outerWidth() * 0.2; // px
                // v = d / t
                var vMiddle = dMiddle / tMiddle; // px/ms
                var itemWidth = allDots.first().outerWidth(true); //px
                // t = d/v
                var delayStep = Math.round(itemWidth / vMiddle);

                for (var i = 0; i < this.numberOfDots; i++) {
                    var delayStr = (i * delayStep) + "ms";
                    var durationStr = dur + "ms";
                    allDots.eq(i)
                        .css("-webkit-animation-delay", delayStr).css("-webkit-animation-duration", durationStr)
                        .css("-moz-animation-delay", delayStr).css("-moz-animation-duration", durationStr)
                        .css("-o-animation-delay", delayStr).css("-o-animation-duration", durationStr)
                        .css("animation-delay", delayStr).css("-webkit-animation-duration", durationStr);
                }

                var autoStart = (this.attr("data-autostart") || "").toLowerCase() == "true";
                if (autoStart) this.enable();
            },
            enable: function () { this.show().addClass("ui-enabled"); },
            disable: function () { this.hide().removeClass("ui-enabled"); },
            toggleEnabled: function () { this.toggleClass("ui-enabled"); }
        });

        return this.initialize();
    };
})(jQuery);

/*Some useful jquery extensions*/
; (function ($) {
    $.fn.sum = function (selector) {
        var res = 0;
        this.each(function (index, el) { res += selector.apply(el); });
        return res;
    };
})(jQuery);

/**
* [INCLUDED] jQuery background position animation plugin
* http://www.protofunc.com/scripts/jquery/backgroundPosition/
* @author Alexander Farkas
* v. 1.22
*/
(function (a) { function d(a) { a = a.replace(/left|top/g, "0px"); a = a.replace(/right|bottom/g, "100%"); a = a.replace(/([0-9\.]+)(\s|\)|$)/g, "$1px$2"); var b = a.match(/(-?[0-9\.]+)(px|\%|em|pt)\s(-?[0-9\.]+)(px|\%|em|pt)/); return [parseFloat(b[1], 10), b[2], parseFloat(b[3], 10), b[4]] } if (!document.defaultView || !document.defaultView.getComputedStyle) { var b = a.curCSS; a.curCSS = function (a, c, d) { if (c === "background-position") { c = "backgroundPosition" } if (c !== "backgroundPosition" || !a.currentStyle || a.currentStyle[c]) { return b.apply(this, arguments) } var e = a.style; if (!d && e && e[c]) { return e[c] } return b(a, "backgroundPositionX", d) + " " + b(a, "backgroundPositionY", d) } } var c = a.fn.animate; a.fn.animate = function (a) { if ("background-position" in a) { a.backgroundPosition = a["background-position"]; delete a["background-position"] } if ("backgroundPosition" in a) { a.backgroundPosition = "(" + a.backgroundPosition } return c.apply(this, arguments) }; a.fx.step.backgroundPosition = function (b) { if (!b.bgPosReady) { var c = a.curCSS(b.elem, "backgroundPosition"); if (!c) { c = "0px 0px" } c = d(c); b.start = [c[0], c[2]]; var e = d(b.end); b.end = [e[0], e[2]]; b.unit = [e[1], e[3]]; b.bgPosReady = true } var f = []; f[0] = (b.end[0] - b.start[0]) * b.pos + b.start[0] + b.unit[0]; f[1] = (b.end[1] - b.start[1]) * b.pos + b.start[1] + b.unit[1]; b.elem.style.backgroundPosition = f[0] + " " + f[1] } })(jQuery)