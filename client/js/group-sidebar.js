$(document).ready(function() {
    //-------------------------------------------------
    $("#close-sidebar").click(function() {
        $(".page-wrapper").removeClass("toggled");
    });
    //-------------------------------------------------
    $("#show-sidebar").click(function() {

        if ($(".page-wrapper").hasClass("toggled")) {
            $("#close-sidebar").trigger('click');
        } else {
            $(".page-wrapper").addClass("toggled");
        }
    });
    //-------------------------------------------------
    $("#chatBox, #sender-list").click(function() {
        $("#close-sidebar").trigger('click');
    });
    //-------------------------------------------------
    $('body').on('click', '.user', function(e) {
        $(this).find(".user-selected").toggle();
        if ($(this).hasClass("selected"))
            $(this).removeClass("selected");
        else
            $(this).addClass("selected");
    });
    //-------------------------------------------------
    $("#user-search").on('keyup change', function() {
        let text = $(this).val().toLowerCase();
        $(".user:not(#user)").show();
        $(".user:not(#user)").filter(function() {
            if ($(this).find(".user-name").text().toLowerCase().indexOf(text) == -1 &&
                $(this).find(".user-selected").css("display") == "none")
                return true;
            else
                return false;
        }).hide();
    });
    //-------------------------------------------------
    $('body').on('click', '#create-group', function(e) {
        let members = Array();
        $(".user.selected").each(function() {
            members.push({ userId: $(this).find('.user-id').text() });
        });
        let groupName = $("#group-name").val();

        if (groupName.trim() && members && members.length != 0) {

            let object = {
                authToken: authToken,
                name: groupName,
                members: members
            };

            let json = JSON.stringify(object);

            $.ajax({
                type: 'POST', // Type of request to be send, called as method
                url: 'http://localhost:3000/group/', // Url to which the request is send
                data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
                cache: false, // To unable request pages to be cached
                contentType: 'application/json', // The content type used when sending data to the server.
                processData: false, // To send DOMDocument or non processed data file it is set to false
                success: function(response) { // A function to be called if request succeeds
                    console.log(response);
                    $("#txtToast").html(response.message);
                    $('.toast').toast('show');
                    if (!response.error) {
                        $("#close-sidebar").trigger('click');
                    }
                },
                error: function(response) { // A function to be called if request failed
                    console.error(response);
                    $("#txtToast").html(response.responseJSON.message);
                    $('.toast').toast('show');
                }
            });

        } else {
            $("#txtToast").html("Enter required Fields!");
            $('.toast').toast('show');
        }

    });
    //-------------------------------------------------

});