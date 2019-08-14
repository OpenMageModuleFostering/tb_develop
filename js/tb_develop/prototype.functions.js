function setDevToolberHandlers(){    
    Event.observe('develop_toolbar_btn', 'click', function(){
        Effect.toggle('develop_toolbar', 'slide', { duration: 0.4 });
    });
    Event.observe('toolbar_label_link', 'click', function(){
        Effect.toggle('develop_toolbar', 'slide', { duration: 0.4 });
    });    
    $$('.toolbar_menu_item').each(function(element) {
        element.observe('click', function() {
            $$('.toolbar_menu_item').each(function(menu_item) {
                menu_item.removeClassName('toolbar_active');
            });
            $$('.toolbar_content_section').each(function(content_section) {
                content_section.hide();
            });
            element.addClassName('toolbar_active');
            $(element.readAttribute('href').replace('#', '')).show();
        });
    });
    var toolbar_menu_current = "toolbar_menu_current";
    var toolbar_tabs = ["dashboard", "layouts", "blocks", "models", "controller"];
    toolbar_tabs.each(function(value) {
        var toolbar_menu_class = ".tabs_" + value + "_menu a";
        var toolbar_content_class = ".tab_" + value + "_content";
        var toolbar_menu_li_class = ".tabs_" + value + "_menu li";
        $$(toolbar_menu_class).each(function(toolbar_menu) {
            toolbar_menu.observe('click', function(event) {
                Event.stop(event);
                $$(toolbar_menu_li_class).each(function(li_el) {
                    li_el.removeClassName(toolbar_menu_current);
                });       
                toolbar_menu.up('li').addClassName(toolbar_menu_current);
                $$(toolbar_content_class).each(function(content_el) {
                    content_el.hide();
                });            
                Effect.Appear(toolbar_menu.readAttribute('href').replace('#', ''), { duration: 0.2 });
            });
        });
    });  
    $$('.toolbar_table_syntax').each(function(block) {
        hljs.highlightBlock(block);
    });
}
Event.observe(window, "dom:loaded", setDevToolberHandlers, true); 