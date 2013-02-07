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

	function initMyBookmarklet() {
        (window.doorcontrolmarklet = function() {
            if ($("#doorcontrol").length == 0) {
                $("body").append("\
                <div id='doorcontrol'>\
                	<style type='text/css'>\
                        #doorcontrol-msg { display: none; position: fixed; width: 100%; height: 100px; top: -100px; left: 0; background-color: rgba(255,255,255,0.9); cursor: pointer; z-index: 900; }\
                        #doorcontrol-msg p { color: black; font: normal normal bold 20px/20px Helvetica, sans-serif; position: absolute; top: 50%; left: 50%; width: 10em; margin: -10px auto 0 -5em; text-align: center; }\
                    </style>\
                    <div id='doorcontrol-msg' style=''>\
                        <p>Opening Door</p>\
                    </div>\
                </div>");
            }

            $("#doorcontrol-msg").click(function(event){
                hide();
            });

            function openDoor() {
				$.get(host + '/open', function(data) {
					show(data);
					setTimeout(hide, 3000);
				});
            }

            function show(data) {
            	$("#doorcontrol-msg").html('<p>' + data + '</p>');
            	$("#doorcontrol-msg").fadeIn(200);
            	$("#doorcontrol-msg").animate({top:'0px'}, 500);
            }

            function hide() {
            	//$("#doorcontrol-msg").fadeOut(200);
            	$("#doorcontrol-msg").animate({top:'-100px'}, 500);
            	setTimeout("$('#doorcontrol').remove()", 500);
            }

            openDoor();

        })();
    }

})();