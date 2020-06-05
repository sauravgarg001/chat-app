$(document).ready(function() {
    //Sidebar Events:-
    //-------------------------------------------------
    $("#close-members-sidebar").click(function() {
        $(".page-wrapper").removeClass("toggled3");
    });
    //-------------------------------------------------
    $('body').on('click', '.group-dropdown-info', function(e) {
        let groupId = $(this).parents('.group').find('.group-id').text();

        $(".members-user:not(#members-user)").remove();
        $.get(`${baseUrl}/group/`, { authToken: authToken, groupId: groupId }, function(response, status, xhr) {
            if (response.status == 200) {
                let members = response.data.members;

                if (members) {
                    let admin = false;
                    for (let i = 0; i < members.length; i++) {
                        if (members[i].user_id.userId == userId)
                            admin = members[i].admin;
                        let userParent = $("#members-user").parent();
                        let user = $("#members-user").clone();
                        $(user).find(".user-name").text(members[i].user_id.firstName + " " + members[i].user_id.lastName);
                        $(user).find(".user-id").text(members[i].user_id.userId);
                        $(user).find(".user-img .img").text(members[i].user_id.firstName[0] + members[i].user_id.lastName[0]);
                        if (members[i].admin) {
                            $(user).find(".user-admin").show();
                            $(user).find(".group-dropdown-make-admin").hide();
                            $(user).find(".group-dropdown-remove-admin").show();
                        } else {
                            $(user).find(".group-dropdown-make-admin").show();
                            $(user).find(".group-dropdown-remove-admin").hide();
                        }
                        $(user).prop("hidden", false).prop("id", "");
                        $(userParent).append($(user));
                    }
                    if (admin) {
                        $(`.members-user .group-dropdown-menu-link`).prop('hidden', false);
                        $(`.members-user .user-id:contains(${userId})`).parents('.members-user')
                            .find('.group-dropdown-menu-link').prop('hidden', true);
                    }
                }
            }
        });

        if ($(".page-wrapper").hasClass("toggled3")) {
            $("#close-members-sidebar").trigger('click');
        } else {
            $(".page-wrapper").addClass("toggled3");
        }
    });
    //-------------------------------------------------
    $('body').on('click', '.message-info', function(e) {
        let chatId = $(this).parents('.message-sent-block').find('.message-sent-id').val();
        $('#user-chat-id').val(chatId);

        $(".seen-user:not(#seen-user)").remove();
        $(".delivered-user:not(#delivered-user)").remove();
        $.get(`${baseUrl}/chat/group/${chatId}/seenby`, { authToken: authToken }, function(response, status, xhr) {
            if (response.status == 200) {
                let seenUsers = response.data;

                if (seenUsers) {
                    $("#seen-user").prop("hidden", true);
                    for (let i = 0; i < seenUsers.length; i++) {
                        let userParent = $("#seen-user").parent();
                        let user = $("#seen-user").clone();
                        $(user).find(".user-name").text(seenUsers[i].receiverName);
                        $(user).find(".user-id").text(seenUsers[i].receiverId);
                        if (formatDate(seenUsers[i].modifiedOn) == formatDate(new Date()))
                            $(user).find(".user-time").text(changeTo12Hour(seenUsers[i].modifiedOn));
                        else
                            $(user).find(".user-time").text(formatDate(seenUsers[i].modifiedOn) + " " + changeTo12Hour(seenUsers[i].modifiedOn));
                        let name = seenUsers[i].receiverName.split(' ');
                        let firstName = name[0];
                        let lastName = name[1];
                        $(user).find(".user-img .img").text(firstName[0] + lastName[0]);
                        $(user).prop("hidden", false).prop("id", "");
                        $(userParent).append($(user));
                    }
                } else {
                    $("#seen-user").prop("hidden", false);
                }
            }
        });
        $.get(`${baseUrl}/chat/group/${chatId}/deliveredto`, { authToken: authToken }, function(response, status, xhr) {
            if (response.status == 200) {
                let deliveredUsers = response.data;

                if (deliveredUsers) {
                    $("#delivered-user").prop("hidden", true);
                    for (let i = 0; i < deliveredUsers.length; i++) {
                        let userParent = $("#delivered-user").parent();
                        let user = $("#delivered-user").clone();
                        $(user).find(".user-name").text(deliveredUsers[i].receiverName);
                        $(user).find(".user-id").text(deliveredUsers[i].receiverId);
                        if (formatDate(deliveredUsers[i].createdOn) == formatDate(new Date()))
                            $(user).find(".user-time").text(changeTo12Hour(deliveredUsers[i].createdOn));
                        else
                            $(user).find(".user-time").text(formatDate(deliveredUsers[i].createdOn) + " " + changeTo12Hour(deliveredUsers[i].createdOn));
                        let name = deliveredUsers[i].receiverName.split(' ');
                        let firstName = name[0];
                        let lastName = name[1];
                        $(user).find(".user-img .img").text(firstName[0] + lastName[0]);
                        $(user).prop("hidden", false).prop("id", "");
                        $(userParent).append($(user));
                    }
                } else {
                    $("#delivered-user").prop("hidden", false);
                }
            }
        });
        if ($(".page-wrapper").hasClass("toggled2")) {
            $("#close-chat-sidebar").trigger('click');
        } else {
            $(".page-wrapper").addClass("toggled2");
        }
    });
    //-------------------------------------------------
    $("#close-chat-sidebar").click(function() {
        $(".page-wrapper").removeClass("toggled2");
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
    $("#close-sidebar").click(function() {
        $(".page-wrapper").removeClass("toggled1");
    });
    //-------------------------------------------------
    $("#show-sidebar").click(function() {

        if ($(".page-wrapper").hasClass("toggled1")) {
            $("#close-sidebar").trigger('click');
        } else {
            $(".page-wrapper").addClass("toggled1");
        }
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
            $("#no-message").hide();

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
    socket.on("typing-group", (data) => {

        setTimeout(function() {
            let group = $(`.group .group-id:contains(${data.groupId})`).parent();
            $(group).find(".group-message-typing").hide();
            $(group).find(".group-message").show();
        }, 1000);
        let group = $(`.group .group-id:contains(${data.groupId})`).parent();
        $(group).find(".group-message").hide();
        $(group).find(".group-message-typing").text(`${data.senderName} is typing...`).show();

    });
    //-------------------------------------------------
    socket.on("seen-group@" + authToken, (data) => {

        if ($(".group.active .group-id").text() == data.groupId) {

            for (let i = 0; i < data.chatIds.length; i++) {
                let chatId = data.chatIds[i];
                $(".message-sent-id").each(function() {
                    if ($(this).val() == chatId) {
                        let parent = $(this).parent();
                        let count = $(parent).find(".seen-count-text").text();
                        $(parent).find(".seen-count-text").text(parseInt(count) + 1);
                        return false;
                    }
                });

                //Add user to seen by in sidebar
                if ($(".page-wrapper").hasClass("toggled2") && $('#user-chat-id').val() == chatId) {
                    $("#seen-user").prop("hidden", true);
                    let userParent = $("#seen-user").parent();
                    let user = $("#seen-user").clone();
                    $(user).find(".user-name").text(data.receiverName);
                    $(user).find(".user-id").text(data.receiverId);
                    if (formatDate(data.modifiedOn) == formatDate(new Date()))
                        $(user).find(".user-time").text(changeTo12Hour(data.modifiedOn));
                    else
                        $(user).find(".user-time").text(formatDate(data.modifiedOn) + " " + changeTo12Hour(data.modifiedOn));
                    let name = data.receiverName.split(' ');
                    let firstName = name[0];
                    let lastName = name[1];
                    $(user).find(".user-img .img").text(firstName[0] + lastName[0]);
                    $(user).prop("hidden", false).prop("id", "");
                    $(userParent).append($(user));
                }
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
                        let count = $(parent).find(".delivered-count-text").text();
                        $(parent).find(".delivered-count-text").text(parseInt(count) + 1);
                        return false;
                    }
                });

                //Add user to delivered to in sidebar
                if ($(".page-wrapper").hasClass("toggled2") && $('#user-chat-id').val() == chatId) {
                    $("#delivered-user").prop("hidden", true);
                    let userParent = $("#delivered-user").parent();
                    let user = $("#delivered-user").clone();
                    $(user).find(".user-name").text(data.receiverName);
                    $(user).find(".user-id").text(data.receiverId);
                    if (formatDate(data.createdOn) == formatDate(new Date()))
                        $(user).find(".user-time").text(changeTo12Hour(data.createdOn));
                    else
                        $(user).find(".user-time").text(formatDate(data.createdOn) + " " + changeTo12Hour(data.createdOn));
                    let name = data.receiverName.split(' ');
                    let firstName = name[0];
                    let lastName = name[1];
                    $(user).find(".user-img .img").text(firstName[0] + lastName[0]);
                    $(user).prop("hidden", false).prop("id", "");
                    $(userParent).append($(user));
                }
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