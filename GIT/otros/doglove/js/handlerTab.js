function tabHandler(){
    window.alert = function(){};
    var defaultCSS = document.getElementById('bootstrap-css');
    function changeCSS(css){
        if(css) $('head > link').filter(':first').replaceWith('<link rel="stylesheet" href="'+ css +'" type="text/css" />'); 
        else $('head > link').filter(':first').replaceWith(defaultCSS); 
    }
    $( document ).ready(function() {
      var iframe_height = parseInt($('html').height()); 
      window.parent.postMessage( iframe_height, 'https://bootsnipp.com');
    });
}


function btnHandler() {
    $(document).ready(function() {
    $(".btn-pref .btn").click(function () {
        $(".btn-pref .btn").removeClass("btn-primary").addClass("btn-default");
        // $(".tab").addClass("active"); // instead of this do the below 
        $(this).removeClass("btn-default").addClass("btn-primary");   
    });
    })
}    
    