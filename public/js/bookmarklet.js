(function() {
	var host = 'http://10.10.0.20';
	var e;

	if (window.jQuery === undefined) {
    	script = document.createElement('script');  
   		script.src = 'http://code.jquery.com/jquery-latest.js';
   		script.onload=init;  
    	document.body.appendChild(script);
	}  
	else {  
    	//init();
    	initMyBookmarklet();
	}
	// function init() {
	// 	if(!window.doorcontrolmarklet) {
	// 		e = document.createElement('div');
	// 		e.id = 'doorcontrolmarklet';
	// 		e.style.width = '100%';
	// 		e.style.position = 'fixed';
	// 		e.style.top = '0px';
	// 		e.style.left = '0px';
	// 		window.doorcontrolmarklet = e;
	// 		document.body.appendChild(e);
	// 	}

	// 	$.get(host + '/open/2', function(data) {
	// 		var content = "<h3>" + data + "</h3>";
	// 		e.innerHTML = content;
	// 	});
	// }

//                        <iframe src='"+host+"' onload=\"$('#doorcontrol iframe').slideDown(500);\">Enable iFrames.</iframe>\
	function initMyBookmarklet() {
        (window.doorcontrolmarklet = function() {
            if ($("#doorcontrol").length == 0) {
                $("body").append("\
                <div id='doorcontrol'>\
                	<style type='text/css'>\
                        #wikiframe_veil { display: none; position: fixed; width: 100%; height: 100px; top: -100px; left: 0; background-color: rgba(255,255,255,0.9); cursor: pointer; z-index: 900; }\
                        #wikiframe_veil p { color: black; font: normal normal bold 20px/20px Helvetica, sans-serif; position: absolute; top: 50%; left: 50%; width: 10em; margin: -10px auto 0 -5em; text-align: center; }\
                    </style>\
                    <div id='wikiframe_veil' style=''>\
                        <p>Opening Door</p>\
                    </div>\
                </div>");
            }

            $("#wikiframe_veil").click(function(event){
                hide();
            });

            function openDoor() {
				$.get(host + '/open', function(data) {
					show(data);
					setTimeout(hide, 3000);
				});
            }

            function show(data) {
            	$("#wikiframe_veil").html('<p>' + data + '</p>');
            	$("#wikiframe_veil").fadeIn(200);
            	$("#wikiframe_veil").animate({top:'0px'}, 500);
            }

            function hide() {
            	//$("#wikiframe_veil").fadeOut(200);
            	$("#wikiframe_veil").animate({top:'-100px'}, 500);
            	setTimeout("$('#doorcontrol').remove()", 500);
            }

            openDoor();

        })();
    }

})();