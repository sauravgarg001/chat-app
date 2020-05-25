const baseUrl = 'http://localhost:3000';
const socket = io(baseUrl); // connecting with sockets.
const authToken = getCookie("authToken");
const userId = getCookie("userId");
let userName = "";
let initializationFlag = true;
let skip = 0;
//---------------------------------------------------------------------------------------------------------------
$(document).ready(function() {
    //=======================================================================================================
    function initialize() {

        if (!authToken || !userId)
            $("#logout").trigger('click');

        //-------------------------------------------------
        socket.on('verifyUser', (data) => { //verify user from auth Token

            console.log("socket trying to verify user");

            socket.emit("set-user", authToken, userId);

        });
        //-------------------------------------------------
        socket.on("auth-error", (jsonData) => {

            console.error(jsonData);
            $("#logout").trigger('click');

        });
        //-------------------------------------------------
        socket.on("online-user-list", (users) => {

            $(".sender").find(".sender-message-status").hide();
            if (Array.isArray(users)) {
                for (let id of users) {
                    if (userId == id)
                        continue;
                    $(`.sender .sender-id:contains(${id})`).parent().find(".sender-message-status").show();
                }
            }

        });


        let getUserInfo = () => {
            return new Promise((resolve, reject) => {
                $.get(`${baseUrl}/user/${userId}`, { authToken: authToken },
                    function(response, status, xhr) {
                        if (response.status == 200) {
                            let data = response.data;
                            userName = data.firstName + " " + data.lastName;
                            $("#name").text(userName + " welcome to Incubchat");
                            resolve();
                        } else {
                            reject(`${baseUrl}/user/${userId} not working`);
                        }
                    },
                    "json");
            });
        };


        let getAllUsers = () => {
            return new Promise((resolve, reject) => {
                $.get(`${baseUrl}/user`, { authToken: authToken },
                    function(response, status, xhr) {
                        if (response.status == 200) {
                            let data = response.data;

                            for (let i = 0; i < data.length; i++) {
                                if (data[i].userId == userId)
                                    continue;
                                let parent = $("#sender").parent();
                                let sender = $("#sender").clone();
                                $(sender).find(".sender-name").text(data[i].firstName + " " + data[i].lastName);
                                $(sender).find(".sender-id").text(data[i].userId);
                                $(sender).find(".sender-img .img").text(data[i].firstName[0] + data[i].lastName[0]);
                                $(sender).prop("hidden", false).prop("id", "");
                                $(parent).append($(sender));
                            }
                            resolve();
                        } else {
                            reject(`${baseUrl}/user not working`);
                        }
                    }, "json");
            });
        };


        let marktUndeliveredChats = () => {
            return new Promise((resolve, reject) => {
                let object = {
                    authToken: authToken,
                    userId: userId,
                };

                let json = JSON.stringify(object);

                $.ajax({
                    type: 'PUT', // Type of request to be send, called as method
                    url: `${baseUrl}/chat/single/delivered/sender/mark/all`, // Url to which the request is send
                    data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
                    cache: false, // To unable request pages to be cached
                    contentType: 'application/json', // The content type used when sending data to the server.
                    processData: false, // To send DOMDocument or non processed data file it is set to false
                    success: function(response) { // A function to be called if request succeeds
                        if (response.status == 200) {
                            console.log(response.message);
                            resolve();
                        } else {
                            reject(response.message);
                        }
                    },
                    error: function(response) { // A function to be called if request failed
                        console.error(response);
                        reject(`${baseUrl}/chat/single/undelivered/sender not working`);
                    }
                });
            });
        }


        let getLastChat = () => {
            return new Promise((resolve, reject) => {
                let query = {
                    userId: userId,
                    authToken: authToken
                }
                $.get(`${baseUrl}/chat/single/senders/lastchat`, query, function(response, status, xhr) {
                    if (response.status == 200) {
                        let chats = response.data;
                        if (chats) {
                            console.log(`Last Chat Found`);

                            for (let i = chats.length - 1; i >= 0; i--) {
                                //Add last message to userlist
                                let sender = $(`.sender .sender-id:contains(${chats[i].senderId})`).parents(".sender");
                                $(sender).find(".sender-message").text(chats[i].message);
                                $(sender).find(".sender-message-time").text(changeTo12Hour(chats[i].createdOn));
                                if (formatDate(chats[i].createdOn) == formatDate(new Date()))
                                    $(sender).find(".sender-message-date").text(" ");
                                else
                                    $(sender).find(".sender-message-date").text(formatDate(chats[i].createdOn));
                                let parent = $(sender).parent();
                                let clone = $(sender).clone();
                                $(sender).remove();
                                $(parent).prepend($(clone));
                            }

                        }
                        resolve();
                    } else {
                        reject(`${baseUrl}/chat/single/senders/lastchat not woking`);
                    }
                });
            });
        }


        let countUnseenChats = () => {
            return new Promise((resolve, reject) => {
                let query = {
                    userId: userId,
                    authToken: authToken
                }
                $.get(`${baseUrl}/chat/single/unseen/sender/count`, query, function(response, status, xhr) {
                    if (response.status == 200) {
                        let data = response.data;

                        for (let i = 0; i < data.length; i++) {
                            if (data[i].count > 0) {
                                let sender = $(`.sender .sender-id:contains(${data[i].senderId})`).parents(".sender");
                                $(sender).find(".sender-unread-messages-count").text(count).show();
                            }
                        }
                        console.log(`Unread Chat Found`);
                        resolve();
                    } else {
                        reject(`${baseUrl}/chat/single/unseen/sender/count not working`);
                    }
                });
            });
        }

        getUserInfo()
            .then(getAllUsers)
            .then(marktUndeliveredChats)
            .then(getLastChat)
            .then(countUnseenChats)
            .then(() => {
                $(".sender:not(#sender)").first().trigger('click');
                initializationFlag = false;
                console.log("Initialization Done.");
            })
            .catch((err) => {
                console.log(err);
            });

    }

    initialize();

    //=======================================================================================================
    socket.on("receive@" + authToken, (data) => { //Message received

        let sender = $(`.sender .sender-name:contains(${data.senderName})`).parents(".sender"); //get sender's element who's message came

        //Add message to chatbox
        if ($(sender).hasClass("active")) { //Check if the user has openned the chat of the person who's message came
            $("#no-message").hide()
            $('#unread-messages').hide();

            let parent = $("#message-recieved-block").parent();
            let message = $("#message-recieved-block").clone();
            $(message).find(".message-recieved").text(data.message);
            $(message).find(".time").text(changeTo12Hour(data.createdOn));
            $(message).find(".message-recieved-id").val(data.chatId);
            $(message).prop("id", "").prop("hidden", false);
            $(parent).append($(message));

            setUnseenChatsInChatBox([data.chatId], data.senderId);
        } else {
            setUndeliveredMessagesInChatBox([data.chatId], data.senderId);
        }


        //Add message to userlist
        $(sender).find(".sender-message").text(data.message);
        $(sender).find(".sender-message-date").text(" ");
        $(sender).find(".sender-message-time").text(changeTo12Hour(data.createdOn));

        let unreadCount = parseInt($(sender).find(".sender-unread-messages-count").text()) + 1;
        $(sender).find(".sender-unread-messages-count").text(unreadCount);
        $(sender).find(".sender-unread-messages-count").show();


        let parent = $(sender).parent();
        let clone = $(sender).clone();
        $(sender).remove();
        $(parent).prepend($(clone));
        sender = clone;

        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);

    });
    //-------------------------------------------------
    $("#message").on('keypress', function() {

        let data = {
            senderId: userId,
            receiverId: $(".sender.active").find(".sender-id").text(),
            authToken: authToken
        }
        socket.emit("typing", data)

    });
    //-------------------------------------------------
    socket.on("typing@" + authToken, (id) => {
        setTimeout(function() {
            let sender = $(`.sender .sender-id:contains(${id})`).parent();
            $(sender).find(".sender-message-typing").hide();
            $(sender).find(".sender-message").show();
        }, 500);
        let sender = $(`.sender .sender-id:contains(${id})`).parent();
        $(sender).find(".sender-message").hide();
        $(sender).find(".sender-message-typing").show();

    });
    //-------------------------------------------------
    socket.on("seen@" + authToken, (data) => {

        if ($(".sender.active .sender-id").text() == data.receiverId) {

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
    socket.on("delivered@" + authToken, (data) => {

        if ($(".sender.active .sender-id").text() == data.receiverId) {

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
    $("#message").on('keypress', function(e) {
        if (e.keyCode == 13) {
            $("#send").trigger("click");
        }
    });
    //-------------------------------------------------
    $("#send").on('click', function() {

        if ($("#message").val().trim() == "")
            return false;


        let chatMessage = {
            createdOn: Date.now(),
            receiverId: $(".sender.active").find(".sender-id").text(),
            receiverName: $(".sender.active").find(".sender-name").text(),
            senderId: userId,
            senderName: userName,
            message: $("#message").val()
        }


        //Add message to userlist
        let sender = $(`.sender .sender-id:contains(${chatMessage.receiverId})`).parents(".sender");
        $(sender).find(".sender-message").text(chatMessage.message);
        $(sender).find(".sender-message-time").text(changeTo12Hour(chatMessage.createdOn));
        $(sender).find(".sender-message-date").text(" ");
        let parent = $(sender).parent();
        let clone = $(sender).clone();
        $(sender).remove();
        $(parent).prepend($(clone));


        //Add message to chatbox
        parent = $("#message-sent-block").parent();
        let message = $("#message-sent-block").clone();
        $(message).find(".message-sent").text(chatMessage.message);
        $(message).find(".time").text(changeTo12Hour(chatMessage.createdOn));
        $(message).find(".status-sent").slideDown();
        $(message).prop("id", "").prop("hidden", false);
        $(parent).append($(message)).fadeIn('slow');

        let data = {
            authToken: authToken,
            chatMessage: chatMessage
        }

        $("#message").val("");
        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
        $("#no-message").hide()
        $('#unread-messages').hide();

        socket.emit("chat-msg", data)
        socket.on("getChatId@" + authToken, function(chatId) {
            $(message).find(".message-sent-id").val(chatId);
        });
    });

    //-------------------------------------------------
    $("#logout").click(function() {
        let object = {
            userId: userId,
            authToken: authToken
        }
        let json = JSON.stringify(object);
        $.ajax({
            type: 'POST', // Type of request to be send, called as method
            url: `${baseUrl}/user/logout`, // Url to which the request is send
            data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
            cache: false, // To unable request pages to be cached
            contentType: 'application/json', // The content type used when sending data to the server.
            processData: false, // To send DOMDocument or non processed data file it is set to false
            success: function(response) { // A function to be called if request succeeds
                setCookie("userId", userId, -1); //Delete cookies
                setCookie("authToken", authToken, -1); //Delete cookies
                setCookie("name", userName, -1); //Delete cookies

                $("#txtToast").html(response.message);
                $('.toast').toast('show');
                setTimeout(function() {
                    window.location.href = "index.html";
                }, 1500);
            },
            error: function(response) { // A function to be called if request failed
                console.error(response);
                $("#txtToast").html(response.message);
                $('.toast').toast('show'); //show response on toast
            }
        });
    });
    //-------------------------------------------------
    $('body').on('click', '.sender', function() { //for dynamic elements

        $("#unread-messages").hide();
        $("#sendMessage").prop("hidden", false);
        $(".sender").removeClass("active");
        $(".date:not(#date)").remove();
        $(".message-sent-block:not(#message-sent-block)").remove();
        $(".message-recieved-block:not(#message-recieved-block)").remove();
        $(this).addClass("active");
        $(this).find("sender-unread-messages-count").hide();

        let id = $(this).find(".sender-id").text();
        let name = $(this).find(".sender-name").text();

        let getUnseenChats = () => { //Get all unseen chat
            return new Promise((resolve, reject) => {

                let date = formatDate(new Date()); //Today's Date

                let query = {
                    authToken: authToken,
                    senderId: id,
                    receiverId: userId,
                };
                $.get(`${baseUrl}/chat/single/unseen/sender`, query, function(response, status, xhr) {

                    if (response.status == 200) {
                        let unseenChats = response.data;
                        if (unseenChats) {
                            console.log("Unseen Chat Found");
                            let unseenMessages = Array();
                            let undeliveredMessages = Array();

                            for (let i = 0; i < unseenChats.length; i++) {
                                if (!unseenChats[i].delivered) //undelivered
                                    undeliveredMessages.push(unseenChats[i].chatId);
                                unseenMessages.push(unseenChats[i].chatId);

                                let chatCreatedOn = formatDate(unseenChats[i].createdOn);
                                if (chatCreatedOn != date) {

                                    let parentDate = $("#date").parent();
                                    let newDate = $("#date").clone();
                                    $(newDate).prop("hidden", false).prop("id", "");
                                    if (date == formatDate(new Date()))
                                        $(newDate).text("Today");
                                    else
                                        $(newDate).text(date);
                                    $(parentDate).prepend($(newDate));
                                    date = chatCreatedOn;
                                }

                                //Adding unread message to chatbox
                                let parent = $("#message-recieved-block").parent();
                                let message = $("#message-recieved-block").clone();
                                $(message).find(".message-recieved").text(unseenChats[i].message);
                                $(message).find(".message-recieved-id").val(unseenChats[i].chatId);
                                $(message).find(".time").text(changeTo12Hour(unseenChats[i].createdOn));
                                $(message).prop("hidden", false).prop("id", "");
                                $(parent).prepend($(message));

                            }

                            setUndeliveredMessagesInChatBox(undeliveredMessages, id);
                            setUnseenChatsInChatBox(unseenMessages, id);

                            let lastChat = {
                                createdOn: unseenChats[0].createdOn,
                                message: unseenChats[0].message
                            }

                            let data = {
                                lastChat: lastChat,
                                date: date
                            }
                            resolve(data);
                        } else {
                            console.log("No Unseen Chat for " + name);
                            let data = {
                                lastChat: null,
                                date: date
                            }
                            resolve(data);
                        }
                    }
                });
            });
        }

        let getSeenChats = (data) => { //Get all seen chat
            return new Promise((resolve, reject) => {

                let query = {
                    authToken: authToken,
                    senderId: id,
                    receiverId: userId,
                };

                skip = 10;
                $.get(`${baseUrl}/chat/single/seen/sender`, query, function(response, status, xhr) {

                    if (response.status == 200) {
                        let seenChats = response.data;
                        let date = data.date;
                        if (seenChats) {
                            console.log("Seen Chat Found");
                            for (let i = 0; i < seenChats.length; i++) {

                                let chatCreatedOn = formatDate(seenChats[i].createdOn);
                                if (chatCreatedOn != date) {

                                    let parentDate = $("#date").parent();
                                    let newDate = $("#date").clone();
                                    $(newDate).prop("hidden", false).prop("id", "");
                                    if (date == formatDate(new Date()))
                                        $(newDate).text("Today");
                                    else
                                        $(newDate).text(date);
                                    $(parentDate).prepend($(newDate));
                                    date = chatCreatedOn;

                                }

                                if (seenChats[i].senderId == userId) {

                                    let parent = $("#message-sent-block").parent();
                                    let message = $("#message-sent-block").clone();
                                    $(message).find(".message-sent").text(seenChats[i].message);
                                    $(message).find(".message-sent-id").val(seenChats[i].chatId);
                                    $(message).find(".time").text(changeTo12Hour(seenChats[i].createdOn));
                                    if (seenChats[i].seen)
                                        $(message).find(".status-seen").slideDown();
                                    else if (seenChats[i].delivered)
                                        $(message).find(".status-delivered").slideDown();
                                    else
                                        $(message).find(".status-sent").slideDown();
                                    $(message).prop("hidden", false).prop("id", "");
                                    $(parent).prepend($(message));


                                } else if (seenChats[i].receiverId == userId) {

                                    let parent = $("#message-recieved-block").parent();
                                    let message = $("#message-recieved-block").clone();
                                    $(message).find(".message-recieved").text(seenChats[i].message);
                                    $(message).find(".message-recieved-id").val(seenChats[i].chatId);
                                    $(message).find(".time").text(changeTo12Hour(seenChats[i].createdOn));
                                    $(message).prop("hidden", false).prop("id", "");
                                    $(parent).prepend($(message));

                                }

                                if (i == seenChats.length - 1) {

                                    let parentDate = $("#date").parent();
                                    let newDate = $("#date").clone();
                                    $(newDate).prop("hidden", false).prop("id", "");
                                    if (date == formatDate(new Date()))
                                        $(newDate).text("Today");
                                    else
                                        $(newDate).text(date);
                                    $(parentDate).prepend($(newDate));

                                }
                            }

                            if (!data.lastChat) {
                                data.lastChat = {
                                    createdOn: seenChats[0].createdOn,
                                    message: seenChats[0].message
                                }
                            }
                            resolve(data.lastChat);
                        } else {
                            reject("No Seen Chat for " + name);
                        }
                    }

                }, "json");
            });
        }

        let addMessageToUserlist = (lastChat) => {
            return new Promise((resolve, reject) => {
                //Add message to userlist
                $(this).find(".sender-message").text(lastChat.message);
                $(this).find(".sender-message-time").text(changeTo12Hour(lastChat.createdOn));
                if (formatDate(lastChat.createdOn) == formatDate(new Date()))
                    $(sender).find(".sender-message-date").text(" ");
                else
                    $(sender).find(".sender-message-date").text(formatDate(lastChat.createdOn));


                //set user with latest message at first
                setTimeout(function() {
                    let msgSender = $(".sender:not(#sender)").first();
                    let lastSenderId = $(".sender:not(#sender)").last().find(".sender-id").text()

                    let msgSenderId = $(msgSender).find(".sender-id").text();
                    let msgTime = $(msgSender).find(".sender-message-time").text();
                    let msgDate = $(msgSender).find(".sender-message-date").text();


                    //check cuurent user is first user or not
                    if (msgSenderId != id && msgTime.trim() != "" && msgDate.trim() != "") {

                        let currentUserChatTime = new Date(lastChat.createdOn).getTime();
                        let firstUserChatTime = new Date(unformatDate(msgDate) + " " + change12HourTo24Hour(msgTime)).getTime();

                        if (currentUserChatTime > firstUserChatTime) {
                            let parent = $(sender).parent();
                            let clone = $(sender).clone();
                            $(sender).remove();
                            $(parent).prepend($(clone));
                        }

                    }
                }, 400); //end of Timeout
                resolve();
            });
        }

        let loadOldMessages = () => { //If there is no scroll
            return new Promise((resolve, reject) => {
                $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
                if ($('#chatBox')[0].scrollTop == 0) { //check whether chatbox is already scroll up
                    $('#chatBox').trigger("scroll");
                    setTimeout(function() {
                        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
                    }, 200);
                }
                resolve();
            });
        }


        getUnseenChats()
            .then(getSeenChats)
            .then(addMessageToUserlist)
            .then(loadOldMessages)
            .then(() => {
                $("#no-message").hide()
            })
            .catch((err) => {
                console.log(err);
                $("#no-message").show()
            });

    });
    //-------------------------------------------------
    $("#chatBox").scroll(function() { //when scroll to top load old chats
        let oldHeight = $('#chatBox')[0].scrollHeight;
        if ($(this)[0].scrollTop == 0) {
            let senderId = $(".sender.active").find(".sender-id").text();
            let query = {
                authToken: authToken,
                senderId: senderId,
                receiverId: userId,
                skip: skip
            }

            $.get(`${baseUrl}/chat/single/seen/sender`, query, function(response, status, xhr) {

                if (response.status == 200) {
                    if (response.data) {
                        let data = response.data;
                        let date = $("#chatBox .date").first().text();
                        if (date == "Today")
                            date = formatDate(new Date());
                        $("#chatBox .date").first().remove();

                        for (let i = 0; i < data.length; i++) {

                            let chatDate = formatDate(data[i].createdOn);
                            if (chatDate != date) {

                                let parentDate = $("#date").parent();
                                let newDate = $("#date").clone();
                                $(newDate).prop("hidden", false).prop("id", "");
                                if (date == formatDate(new Date()))
                                    $(newDate).text("Today");
                                else
                                    $(newDate).text(date);
                                $(parentDate).prepend($(newDate));
                                date = chatDate;
                            }

                            if (data[i].senderId == userId) {

                                let parent = $("#message-sent-block").parent();
                                let message = $("#message-sent-block").clone();
                                $(message).find(".message-sent").text(data[i].message);
                                $(message).find(".message-sent-id").val(data[i].chatId);
                                $(message).find(".time").text(changeTo12Hour(data[i].createdOn));
                                if (data[i].seen)
                                    $(message).find(".status-seen").slideDown();
                                else if (data[i].delivered)
                                    $(message).find(".status-delivered").slideDown();
                                else
                                    $(message).find(".status-sent").slideDown();
                                $(message).prop("hidden", false).prop("id", "");
                                $(parent).prepend($(message));
                                unseeninitializationFlag = false;

                            } else if (data[i].receiverId == userId) {

                                let parent = $("#message-recieved-block").parent();
                                let message = $("#message-recieved-block").clone();
                                $(message).find(".message-recieved").text(data[i].message);
                                $(message).find(".message-recieved-id").val(data[i].chatId);
                                $(message).find(".time").text(changeTo12Hour(data[i].createdOn));
                                $(message).prop("hidden", false).prop("id", "");
                                $(parent).prepend($(message));

                            }

                            if (i == data.length - 1) {

                                let parentDate = $("#date").parent();
                                let newDate = $("#date").clone();
                                $(newDate).prop("hidden", false).prop("id", "");
                                if (date == formatDate(new Date()))
                                    $(newDate).text("Today");
                                else
                                    $(newDate).text(date);
                                $(parentDate).prepend($(newDate));

                            }
                        }
                        let newHeight = $('#chatBox')[0].scrollHeight;
                        $('#chatBox').scrollTop(newHeight - oldHeight);
                        skip += 10;
                    }

                }

            }, "json");
        }
    });

});
//---------------------------------------------------------------------------------------------------------------
function setUnseenChatsInChatBox(unseenMessages, id) {
    if (unseenMessages.length != 0) {
        let parent = $("#unread-messages").parent();
        let element = $("#unread-messages");
        let unreadMessages = $("#unread-messages").clone();
        $(unreadMessages).find("#unread-messages-count").text(unseenMessages.length);
        $(unreadMessages).show();
        $(parent).prepend($(unreadMessages));
        $(element).remove();

        let query = {
            chatIds: unseenMessages,
            senderId: id,
            authToken: authToken,
            receiverId: userId
        };
        socket.emit("seen", query);
    }
    setTimeout(function() {
        $("#unread-messages").fadeOut();
        $("#unread-messages-count").text(0);
        let parent = $(`.sender .sender-id:contains(${id})`).parent();
        $(parent).find(".sender-unread-messages-count").text(0).hide();

        markChatAsSeen(unseenMessages);
    }, 1000);
}

function markChatAsSeen(unseenMessages) {
    //Send API
    let object = {
        chatIds: unseenMessages,
        receiverId: userId,
        authToken: authToken
    }
    let json = JSON.stringify(object);

    $.ajax({
        type: 'PUT', // Type of request to be send, called as method
        url: `${baseUrl}/chat/single/seen/sender/mark`, // Url to which the request is send
        data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
        cache: false, // To unable request pages to be cached
        contentType: 'application/json', // The content type used when sending data to the server.
        processData: false, // To send DOMDocument or non processed data file it is set to false
        success: function(response) { // A function to be called if request succeeds
            console.info(response.message);
        },
        error: function(response) { // A function to be called if request failed
            console.error(response);
        }
    });
}

function setUndeliveredMessagesInChatBox(undeliveredMessages, id) {
    let query = {
        chatIds: undeliveredMessages,
        senderId: id,
        authToken: authToken,
        receiverId: userId
    };
    socket.emit("delivered", query);
    setTimeout(function() {
        markChatAsDelivered(undeliveredMessages);
    }, 1000);
}

function markChatAsDelivered(undeliveredMessages) {
    //Send API
    let object = {
        chatIds: undeliveredMessages,
        receiverId: userId,
        authToken: authToken
    }

    let json = JSON.stringify(object);

    $.ajax({
        type: 'PUT', // Type of request to be send, called as method
        url: `${baseUrl}/chat/single/delivered/sender/mark`, // Url to which the request is send
        data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
        cache: false, // To unable request pages to be cached
        contentType: 'application/json', // The content type used when sending data to the server.
        processData: false, // To send DOMDocument or non processed data file it is set to false
        success: function(response) { // A function to be called if request succeeds
            console.info(response.message);
        },
        error: function(response) { // A function to be called if request failed
            console.error(response);
        }
    });
}

//Utility Functions
function changeTo12Hour(time) {
    let date = new Date(time);
    let hours = date.getHours();
    let minutes = date.getMinutes();

    let newformat = hours >= 12 ? 'PM' : 'AM'; // Check whether AM or PM 
    hours = hours % 12;
    hours = hours ? hours : 12; // To display "0" as "12" 
    minutes = minutes < 10 ? '0' + minutes : minutes;

    time = hours + ':' + minutes + ' ' + newformat;
    return time;
}


function change12HourTo24Hour(time) {

    let AM_PM = time.split(' ')[1];
    let hours = time.split(':')[0];
    if (AM_PM == 'PM')
        hours = parseInt(hours) + 12;
    else if (hours < 10)
        hours = '0' + hours;
    let minutes = time.split(':')[1].split(' ')[0];
    minutes = minutes < 10 ? '0' + minutes : minutes;

    time = hours + ':' + minutes + ':00';

    return time;
}

function formatDate(date) {
    let d = new Date(date)
    let month = '' + (d.getMonth() + 1)
    let day = '' + d.getDate()
    let year = '' + d.getFullYear()

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    date = [day, month, year].join('/');

    return date;
}

function unformatDate(date) { //dd/mm/yyyyy to yyyy-mm-dd

    let [day, month, year] = date.split('/');
    day = parseInt(day)
    month = parseInt(month)
    year = parseInt(year)
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;

    return `${year}-${month}-${day}`;
}