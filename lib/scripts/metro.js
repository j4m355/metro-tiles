$(document).ready(function () {
        var currentSectionIndex = 0;
        var next;
        var prev;

        $('.ui-app-bar-buttons').click(function(e){
            $('.ui-app-bar-menu').toggle(800)
        })

       $('.drag').click(function(e){

             $('.leftDrag').toggle({
       
            });
        })

        $(".live-tile, .flip-list").not(".exclude").liveTile();

        $(".appbar").applicationBar({ 
                  preloadAltBaseTheme: true, 
                  bindKeyboard: true,
                  metroLightUrl: 'images/metroIcons_light.jpg',
                  metroDarkUrl: 'images/metroIcons.jpg'
           }); 

 
        var sectionCount = $('.metro-section').length - 1
        var sectionIndex = 0
        
        function nextSection()
        {
            oldNext = $('.metro-section').eq(sectionIndex);
            next = $('.metro-section').eq(sectionIndex).next();
            
            if(next.length != 0){sectionIndex++;return next;}else{return oldNext;}         
        }

        function previousSection()
        {
            oldPrevious = $('.metro-section').eq(sectionIndex);
            previous = $('.metro-section').eq(sectionIndex).prev();
            
            if(previous.length != 0){sectionIndex--;return previous;}else{return oldPrevious}            
        }
        
        $(document).keydown(function(e){
            switch (e.keyCode) {
                case 37:
                    $(".metro").scrollTo($(previousSection()), 700);  
                    break;
                case 39:
                    $(".metro").scrollTo($(nextSection()), 700);  
                    break;
                }      
        });



     

        
        $('.metro-section').wipetouch(
            {
            tapToClick: true,             
          
            wipeLeft: function(result) {                    
             $(".metro").scrollTo($(nextSection()), 700);       
             },
            wipeRight: function(result) { 
             
             $(".metro").scrollTo($(previousSection()), 700);              
             }
        });

        $(".metro-section").mousewheel(function(event, delta, deltaX, deltaY){
            var scrollNext = delta < 0;
            return false;
        });

        // Tiles click&hover effects
        var tiles = $(".tile");
        $.each(tiles, function(i, e){
            var el = $(this);
            var duration = 100;
            el.data('metro',{
                clicking:   false,
                origin:     0,
                ang:        10,
                orizorvert: 0,
                slide: 0
            });

            /* for a better antialiasing */
            if(el.css('box-shadow')=='none') el.css({'box-shadow':'0 0 1px transparent'});
            el.parent().css({'-webkit-perspective':el.outerWidth()*20});
            el.parent().css({'-o-perspective':el.outerWidth()*20});
            el.parent().css({'-moz-perspective':el.outerWidth()*20});
            el.parent().css({'-ms-perspective':el.outerWidth()*20});

            el.mousedown(function(e){

                var mouse = {
                    x:e.pageX-el.offset().left,
                    y:e.pageY-el.offset().top
                },

                metro=$(this).data('metro');
                metro.clicking=true;

                if( mouse.x < el.outerWidth()/3 ){
                    metro.orizorvert = 1;
                    metro.origin = 100;
                    metro.ang = -metro.ang;
                    /* left */
                }else if(mouse.x > parseInt(el.outerWidth()*2/3)){
                    metro.orizorvert = 1;
                    /* right */
                }else{
                    if(mouse.y < el.outerHeight()/3){
                        metro.orizorvert = 2;
                        metro.origin = 100;
                        /* top */
                    }else if(mouse.y > parseInt(el.outerHeight()*2/3)){
                        metro.orizorvert = 2;
                        metro.ang = -metro.ang;
                        /* bottom */
                    }
                }
                el.data('metro',metro)

                if( metro.orizorvert > 0 && $.browser.webkit){
                    el
                        .css({'-webkit-transform-origin':(metro.orizorvert==1 ? metro.origin+'% 0%' : '0% '+metro.origin+'%')})
                        .animate({'text-indent':el.css('text-indent')},{duration:duration, step: function(now,fx){
                            /* anim = rotateX(number) or rotateY(number) */
                            anim = 'rotate'+ (metro.orizorvert==1 ? 'Y':'X')+ '('+( metro.ang*Math.sin((fx.pos*Math.PI/2)) )+'deg)'
                            el.css({'-webkit-transform' : anim })
                        },queue:false})
                        .delay(duration)
                } else if( metro.orizorvert==0 || !$.browser.webkit ){
                    el
                        .css({'-webkit-transform-origin':''})
                        .css({'-moz-transform-origin':(metro.orizorvert==1 ? metro.origin+'% 0%' : '0% '+metro.origin+'%')})
                        .css({'-o-transform-origin':(metro.orizorvert==1 ? metro.origin+'% 0%' : '0% '+metro.origin+'%')})
                        .css({'-ms-transform-origin':(metro.orizorvert==1 ? metro.origin+'% 0%' : '0% '+metro.origin+'%')})
                        .css({'transform-origin':(metro.orizorvert==1 ? metro.origin+'% 0%' : '0% '+metro.origin+'%')})
                        .animate({'text-indent':el.css('text-indent')},{duration:duration, step: function(now,fx){
                            /* anim = scale(number) */
                            anim = 'scale('+(1- Math.sin(fx.pos*Math.PI/2)/10)+')'
                            //anim = 'rotate'+ (metro.orizorvert==1 ? 'Y':'X')+ '('+( metro.ang*Math.sin((fx.pos*Math.PI/2)) )+'deg)'
                            el.css({
                                '-webkit-transform' : anim,
                                '-moz-transform'	: anim,
                                '-o-transform'		: anim,
                                '-ms-transform'		: anim
                            })
                        },queue:false})
                        .delay(duration)
                }
            }).mouseup(function(e){
                var a = el.data('metro');

                if( a.clicking==true ){
                    if( a.orizorvert > 0 && $.browser.webkit){
                        el
                            .css({ '-webkit-transform-origin' : (a.orizorvert==1 ? a.origin+'% 0%' : '0% '+a.origin+'%') })
                            .animate({'text-indent':el.css('text-indent')},{duration:duration, step: function(now,fx){
                                /* anim = rotateX(number) or rotateY(number) */
                                anim = 'rotate'+(a.orizorvert==1 ? 'Y':'X')+'('+a.ang*Math.cos((fx.pos*Math.PI/2))+'deg)';
                                el.css({'-webkit-transform' : anim })
                            },queue:false})
                            .delay(duration)
                    }else if( a.orizorvert==0 || !$.browser.webkit){
                        el
                            .animate({'text-indent': el.css('text-indent')},{duration:duration, step: function(now,fx){
                                /* anim = scale(number) */
                                anim = 'scale('+(1- Math.cos(fx.pos*Math.PI/2)/10)+')';
                                el.css({
                                    '-webkit-transform' : anim,
                                    '-moz-transform'	: anim,
                                    '-o-transform'		: anim,
                                    '-ms-transform'		: anim
                                })
                            },queue:false})
                            .delay(duration)
                    }
                    el.data('metro',{
                        clicking:   false,
                        origin:     0,
                        ang:        10,
                        orizorvert: 0
                    })
                }
            }).mouseenter(function(){
                if (el.hasClass("tile-multi-content")){
                    var c_main = $(el.children(".tile-content-main"));
                    var c_sub = $(el.children(".tile-content-sub"));
                    var subHeight = c_sub.height()+5;
                    c_main.animate({"marginTop": - subHeight}, 100);
                    c_sub.css("opacity", 1);
                }
            }).mouseleave(function(){
                if (el.hasClass("tile-multi-content")){
                    var c_main = $(el.children(".tile-content-main"));
                    var c_sub = $(el.children(".tile-content-sub"));
                    var subHeight = c_sub.height();
                    c_main.animate({"marginTop": 0}, 100);
                    c_sub.css("opacity", .1);
                }
            }).mouseout(function(){
                if( el.data('metro').clicking ){
                   el.mouseup()
                }
            })
        })

        // Selectable
        var selectables = $(".selectable");
        $.each(selectables, function(i, e){
            var el = $(this);
            var items = el.children(".metro-image, .metro-image-overlay, .metro-icon-text, .metro-image-text");
            items.bind("click", function(){
                if ($(this).hasClass("disabled")) return;
                $(this).toggleClass("selected");
            })
        })

        // Metro-Switchers
        var switchers = $(".metro-switch");
        switchers.bind("click", function(){
            var el = $(this);
            if (el.hasClass('disabled') || el.hasClass('static')) return false;
            el.toggleClass("state-on");
        })
});