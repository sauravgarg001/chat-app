$(document).ready(function() {
    //Sidebar Events:-
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
    $("#chatBox, #senders-list").click(function() {
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
    // Chats Events:-
    //-------------------------------------------------
    socket.on("receive-group", (data) => { //Message received

        let group = $(`.group .group-id:contains(${data.groupId})`).parents(".group"); //get group's element who's message came

        //Add message to chatbox
        if ($(group).hasClass("active")) { //Check if the user has openned the chat of the person who's message came
            $("#no-message").hide()
            $('#unread-messages').hide();

            let parent = $("#message-recieved-block").parent();
            let message = $("#message-recieved-block").clone();
            $(message).find(".message-recieved").text(data.message);
            $(message).find(".time").text(changeTo12Hour(data.createdOn));
            $(message).find(".message-recieved-id").val(data.chatId);
            $(message).find(".message-name").text(data.senderName);
            $(message).find(".message-sender-id").text(data.senderId);
            $(message).prop("id", "").prop("hidden", false);
            $(parent).append($(message));

            setUnseenChatsInChatBox([data.chatId], { groupId: data.groupId, senderIds: [data.senderId] }, 'group');
        } else {
            setUndeliveredMessagesInChatBox([data.chatId], { groupId: data.groupId, senderIds: [data.senderId] }, 'group');
        }


        //Add message to userlist
        $(group).find(".group-message").text(data.message);
        $(group).find(".group-message-date").text(" ");
        $(group).find(".group-message-time").text(changeTo12Hour(data.createdOn));

        let unreadCount = parseInt($(group).find(".group-unread-messages-count").text()) + 1;
        $(group).find(".group-unread-messages-count").text(unreadCount);
        $(group).find(".group-unread-messages-count").show();


        let parent = $(group).parent();
        let clone = $(group).clone();
        $(parent).prepend($(clone));
        $(group).remove();


        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);

    });
    //-------------------------------------------------
    socket.on("typing-group", (id, name) => {
        setTimeout(function() {
            let group = $(`.group .group-id:contains(${id})`).parent();
            $(group).find(".group-message-typing").hide();
            $(group).find(".group-message").show();
        }, 500);
        let group = $(`.group .group-id:contains(${id})`).parent();
        $(group).find(".group-message").hide();
        $(group).find(".group-message-typing").text(`${name} is typing...`).show();

    });
    //-------------------------------------------------
    socket.on("seen-group@" + authToken, (data) => {

        if ($(".group.active .group-id").text() == data.groupId) {

            for (let i = 0; i < data.chatIds.length; i++) {
                let chatId = data.chatIds[i];
                $(".message-sent-id").each(function() {
                    if ($(this).val() == chatId) {
                        let parent = $(this).parent();

                        $(parent).find(".status-sent").hide();
                        $(parent).find(".status-delivered").hide();
                        $(parent).find(".status-seen").slideDown();
                        return false;
                    }
                });
            }
        }

    });
    //-------------------------------------------------
    socket.on("delivered-group@" + authToken, (data) => {

        if ($(".group.active .group-id").text() == data.groupId) {

            for (let i = 0; i < data.chatIds.length; i++) {
                let chatId = data.chatIds[i];
                $(".message-sent-id").each(function() {
                    if ($(this).val() == chatId) {
                        let parent = $(this).parent();

                        $(parent).find(".status-sent").hide();
                        $(parent).find(".status-delivered").slideDown();
                        $(parent).find(".status-seen").hide();
                        return false;
                    }
                });
            }
        }

    });
    //-------------------------------------------------
    $('body').on('click', '.group-dropdown-spam', function(e) {

        let group = $(this).parents(".group");
        let id = $(group).find(".group-id").text();
        //Send API
        let object = {
            groupId: id,
            authToken: authToken
        }
        let json = JSON.stringify(object);

        $.ajax({
            type: 'PUT', // Type of request to be send, called as method
            url: `${baseUrl}/group/spam`, // Url to which the request is send
            data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
            cache: false, // To unable request pages to be cached
            contentType: 'application/json', // The content type used when sending data to the server.
            processData: false, // To send DOMDocument or non processed data file it is set to false
            success: function(response) { // A function to be called if request succeeds
                console.info(response.message);
                $(group).remove();
            },
            error: function(response) { // A function to be called if request failed
                console.error(response);
            }
        });
    });

});