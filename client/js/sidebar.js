$("#close-sidebar").click(function() {
    $(".page-wrapper").removeClass("toggled");
});
$("#show-sidebar").click(function() {

    if ($(".page-wrapper").hasClass("toggled")) {
        $("#close-sidebar").trigger('click');
    } else {
        $(".page-wrapper").addClass("toggled");
    }
});

$("#chatBox, #sender-list").click(function() {
    $("#close-sidebar").trigger('click');
});