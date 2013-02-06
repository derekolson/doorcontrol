$(document).ready(init);

function init() {
	$(window).resize(onResize);
}

function onResize(){
}

function openDoor(id) {
	$.get('open/' + id, function(data) {
	});
 }