$(document).ready(init);

function init() {
	$(window).resize(onResize);

}


function openDoor(id) {

	$.ajax({
		type: "GET",
		url: "open/" + id
	}).done(function( msg ) {
	
	});
}

function onResize(){

}
