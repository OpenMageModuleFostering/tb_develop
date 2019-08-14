var $j = jQuery.noConflict();
$j(document).ready(function() {    
    $j('div#develop_toolbar_btn').click(function() {
        $j('div#develop_toolbar').slideToggle();
    });
    $j('a#toolbar_label_link').click(function() {
        $j('div#develop_toolbar').slideToggle();
    });
    $j('a.toolbar_menu_item').click(function() {
        $j('a.toolbar_menu_item').removeClass('toolbar_active');        
        $j('.toolbar_content_section').hide();
        $j(this).addClass('toolbar_active');
        $j($j(this).attr('href')).show();
    });    
    var toolbar_menu_current = "toolbar_menu_current";
    var toolbar_tabs = ["dashboard", "layouts", "blocks", "models", "controller"];
    $j.each(toolbar_tabs, function(index, value) {
        var toolbar_menu_class = ".tabs_" + value + "_menu a";
        var toolbar_content_class = ".tab_" + value + "_content";
        $j(toolbar_menu_class).click(function(event) {
            event.preventDefault();
            $j(this).parent().addClass(toolbar_menu_current);
            $j(this).parent().siblings().removeClass(toolbar_menu_current);
            var tab = $j(this).attr("href");
            $j(toolbar_content_class).not(tab).css("display", "none");
            $j(tab).fadeIn();
        });
    });  
    $j('.toolbar_table_syntax').each(function(i, block) {
        hljs.highlightBlock(block);
    });
});