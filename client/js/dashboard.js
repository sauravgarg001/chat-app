const baseUrl = 'http://localhost:3000';
const socket = io(baseUrl); // connecting with sockets.
const authToken = getCookie("authToken");
const userId = getCookie("userId");
let name = "";
let flag = true; //for initialization
let skip = 0;
//---------------------------------------------------------------------------------------------------------------
$(document).ready(function() {
    //=======================================================================================================
    function initialize() {
        //-------------------------------------------------
        socket.on('verifyUser', (data) => { //verify user from auth Token

            console.log("socket trying to verify user");

            socket.emit("set-user", authToken, userId);

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
        //-------------------------------------------------
        socket.on("auth-error", (jsonData) => {

            console.error(jsonData);
            $("#logout").trigger('click');

        });
        //-------------------------------------------------
        if (!authToken || !userId)
            $("#logout").trigger('click');


        $.get(`${baseUrl}/user/${userId}`, { authToken: authToken },
            function(response, status, xhr) {
                if (response.status == 200) {
                    let data = response.data;
                    name = data.firstName + " " + data.lastName;
                    $("#name").text(name + " welcome to Incubchat");
                }
            },
            "json");
        //-------------------------------------------------
        $.get(`${baseUrl}/user`, { authToken: authToken }, //All users
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

                    let senders = $("#sender").parent().find('.sender:not(#sender)');
                    for (let i = senders.length - 1; i >= 0; i--) {
                        $(senders[i]).trigger('click');
                    }

                }
            },
            "json");
        $(".sender").find(".sender-message-status").hide();
    }

    initialize();

    //=======================================================================================================
    socket.on(authToken, (data) => { //Message received

        let sender = $(`.sender .sender-name:contains(${data.senderName})`).parents(".sender"); //get sender's element who's message came

        //Add message to chatbox
        if ($(sender).hasClass("active")) { //Check if the user has openned the chat of the person who's message came
            $("#noMessage").prop("hidden", true);
            let parent = $("#message-recieved-block").parent();
            let message = $("#message-recieved-block").clone();
            $(message).find(".message-recieved").text(data.message);
            $(message).find(".time").text(changeTo12Hour(data.createdOn));
            $(message).find(".message-recieved-id").val(data.chatId);
            $(message).prop("hidden", false).prop("id", "");
            $(parent).append($(message));

            setTimeout(function() {
                markChatAsDelivered(data.chatId, data.senderId);
            }, 500);
            setTimeout(function() {
                markChatAsSeen([data.chatId], data.senderId);
            }, 3000);
            $('#unread-messages').hide();
        }

        //Add message to userlist
        $(sender).find(".sender-message").text(data.message);
        $(sender).find(".sender-message-date").text(" ");
        $(sender).find(".sender-message-time").text(changeTo12Hour(data.createdOn));
        let unreadCount = parseInt($(sender).find(".sender-unread-messages-count").text()) + 1;
        $(sender).find(".sender-unread-messages-count").text(unreadCount);
        $(sender).find(".sender-unread-messages-count").show();
        if ($(sender).hasClass("active")) {
            setTimeout(function() {
                $(sender).find(".sender-unread-messages-count").text(0).fadeOut();
            }, 3000);
        }
        let parent = $(sender).parent();
        let clone = $(sender).clone();
        $(sender).remove();
        $(parent).prepend($(clone));
        sender = clone;


        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);

    });
    //-------------------------------------------------
    socket.on("typing@" + authToken, (id) => {
        setTimeout(function() {
            let sender = $(`.sender .sender-id:contains(${id})`).parent();
            $(sender).find(".sender-message-typing").hide();
            $(sender).find(".sender-message").show();
        }, 1000);
        let sender = $(`.sender .sender-id:contains(${id})`).parent();
        $(sender).find(".sender-message").hide();
        $(sender).find(".sender-message-typing").show();

    });
    //-------------------------------------------------
    socket.on("seen@" + authToken, (data) => {

        setTimeout(function() {
            if ($(".sender.active .sender-id").text() == data.receiverId) {

                for (let i = 0; i < data.chatIds.length; i++) {
                    let chatId = data.chatIds[i];
                    $(".message-sent-id").each(function() {
                        if ($(this).val() == chatId) {
                            let parent = $(this).parent();
                            $(parent).find(".status-delivered").slideUp();
                            $(parent).find(".status-seen").slideDown();
                            return false;
                        }
                    });
                }
            }
        }, 1000);
    });
    //-------------------------------------------------
    socket.on("delivered@" + authToken, (data) => {

        setTimeout(function() {
            if ($(".sender.active .sender-id").text() == data.receiverId) {
                let chatId = data.chatId;
                $(".message-sent-id").each(function() {
                    if ($(this).val() == chatId) {
                        let parent = $(this).parent();
                        $(parent).find(".status-sent").slideUp();
                        $(parent).find(".status-delivered").slideDown();
                        return false;
                    }
                });
            }
        }, 1000);
    });
    //-------------------------------------------------
    $("#message").on('keypress', function(e) {
        if (e.keyCode == 13) {
            $("#send").trigger("click");
        }
    });
    //-------------------------------------------------
    $("#send").on('click', function() {

        let chatMessage = {
            createdOn: Date.now(),
            receiverId: $(".sender.active").find(".sender-id").text(),
            receiverName: $(".sender.active").find(".sender-name").text(),
            senderId: userId,
            senderName: name,
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
        $(message).prop("hidden", false).prop("id", "");
        $(parent).append($(message)).fadeIn('slow');

        let data = {
            authToken: authToken,
            chatMessage: chatMessage
        }

        socket.emit("chat-msg", data)
        socket.on("getChatId@" + authToken, function(chatId) {
            $(message).find(".message-sent-id").val(chatId);
        });
        $("#message").val("");
        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
        $("#noMessage").prop("hidden", true);
        $('#unread-messages').hide();
    });

    $("#message").on('keypress', function() {

        let data = {
            senderId: userId,
            receiverId: $(".sender.active").find(".sender-id").text(),
            authToken: authToken
        }
        socket.emit("typing", data)

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
                setCookie("name", name, -1); //Delete cookies

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
        $("#noMessage").prop("hidden", false);
        $(".sender").removeClass("active");
        $(".date:not(#date)").remove();
        $(".message-sent-block:not(#message-sent-block)").remove();
        $(".message-recieved-block:not(#message-recieved-block)").remove();
        $(this).addClass("active");

        let id = $(this).find(".sender-id").text();

        if (flag) { //unread messages count at initilization
            countUnseenMessages(id, (count) => {
                if (count != 0) {
                    let sender = $(`.sender .sender-id:contains(${id})`).parents(".sender");
                    $(sender).find(".sender-unread-messages-count").text(count).slideDown();
                }
            });
        }
        skip = 0;
        let query = {
            authToken: authToken,
            senderId: id,
            receiverId: userId,
        }
        $.get(`${baseUrl}/chat/single`, query, function(response, status, xhr) {

                if (response.status == 200) {
                    if (response.data) {
                        $("#noMessage").prop("hidden", true);
                        let data = response.data;


                        let date = formatDate(new Date());
                        let unseenMessages = Array();
                        let unseenFlag = true;

                        for (let i = 0; i < data.length && !flag; i++) {

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
                                if (unseenMessages.length != 0 && unseenFlag) {
                                    setUnreadMessagesInChatBox(id, unseenMessages);
                                    unseenFlag = false;
                                }

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
                                unseenFlag = false;

                            } else if (data[i].receiverId == userId) {
                                if (!data[i].seen) {
                                    unseenMessages.push(data[i].chatId);
                                } else if (unseenFlag && unseenMessages.length != 0) {
                                    countUnseenMessages(data[i].senderId);
                                    setUnreadMessagesInChatBox(id, unseenMessages);
                                    unseenFlag = false;

                                }

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

                        if (!flag && unseenFlag && unseenMessages.length != 0) {

                            setUnreadMessagesInChatBox(id, unseenMessages);
                            unseenFlag = false;

                        }

                        for (let i = 0; i < data.length && flag; i++) {
                            if (data[i].receiverId == userId && !data[i].delivered)
                                markChatAsDelivered(data[i].chatId, data[i].senderId);
                        }

                        //Add message to userlist
                        let sender = $(`.sender .sender-id:contains(${id})`).parents(".sender");
                        $(sender).find(".sender-message").text(data[0].message);
                        $(sender).find(".sender-message-time").text(changeTo12Hour(data[0].createdOn));
                        if (formatDate(data[0].createdOn) == formatDate(new Date()))
                            $(sender).find(".sender-message-date").text(" ");
                        else
                            $(sender).find(".sender-message-date").text(formatDate(data[0].createdOn));

                        //set user with latest message at first
                        setTimeout(function() {
                            let msgSender = $(".sender:not(#sender)").first();

                            if ($(msgSender).find(".sender-id").text() != id) {


                                let msgtime = $(msgSender).find(".sender-message-time").text();
                                let msgdate = $(msgSender).find(".sender-message-date").text();

                                if (msgtime.trim() != "" && msgdate.trim() != "") {

                                    let time1 = new Date(data[0].createdOn).getTime();
                                    let time2 = new Date(unformatDate(msgdate) + " " + change12HourTo24Hour(msgtime)).getTime();

                                    if (time1 > time2) {
                                        let parent = $(sender).parent();
                                        let clone = $(sender).clone();
                                        $(sender).remove();
                                        $(parent).prepend($(clone));
                                    }
                                } else {
                                    let parent = $(sender).parent();
                                    let clone = $(sender).clone();
                                    $(sender).remove();
                                    $(parent).prepend($(clone));
                                }
                            }
                            if (flag) {
                                $(".sender:not(#sender)").first().trigger("click");
                                flag = false;
                            }

                            $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
                            if ($('#chatBox')[0].scrollTop == 0) { //check whether chatbox is already scroll up
                                $('#chatBox').trigger("scroll");
                                $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
                            }
                        }, 400);

                    }
                }

            },
            "json");
    });
    //-------------------------------------------------
    $("#chatBox").scroll(function() { //when scroll to top load old chats
        if ($(this)[0].scrollTop == 0) {
            let senderId = $(".sender.active").find(".sender-id").text();

            let query = {
                authToken: authToken,
                senderId: senderId,
                receiverId: userId,
                skip: skip
            }
            $.get(`${baseUrl}/chat/single`, query, function(response, status, xhr) {

                    if (response.status == 200) {
                        if (response.data) {
                            let data = response.data;
                            let date = $("#chatBox .date").first().text();
                            if (date == "Today")
                                date = formatDate(new Date());
                            $("#chatBox .date").first().remove();

                            for (let i = 0; i < data.length && !flag; i++) {

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
                                    unseenFlag = false;

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
                            skip += 10;
                        }

                    }

                },
                "json");
        }
    });

});
//---------------------------------------------------------------------------------------------------------------
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

function setUnreadMessagesInChatBox(id, unseenMessages) {
    if (unseenMessages.length != 0) {
        let parent = $("#unread-messages").parent();
        let element = $("#unread-messages");
        let unreadMessages = $("#unread-messages").clone();
        $(unreadMessages).show();
        $(unreadMessages).find("#unread-messages-count").text(unseenMessages.length);
        $(parent).prepend($(unreadMessages));
        $(element).remove();
        $(".sender.active .sender-unread-messages-count").text(unseenMessages.length).slideDown();
    }
    setTimeout(function() {
        $("#unread-messages").fadeOut();
        let sender = $(`.sender .sender-id:contains(${id})`).parents(".sender");
        $(sender).find(".sender-unread-messages-count").text(0).hide();
        markChatAsSeen(unseenMessages, id);
    }, 3000);
}

function markChatAsSeen(unseenMessages, id) {

    socket.emit("seen", { chatIds: unseenMessages, senderId: id, authToken: authToken, receiverId: userId });
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
            console.log(response);
        },
        error: function(response) { // A function to be called if request failed
            console.error(response);
        }
    });
}

function markChatAsDelivered(undeliveredMessage, id) {
    socket.emit("delivered", { chatId: undeliveredMessage, senderId: id, authToken: authToken, receiverId: userId });
    let object = {
        chatId: undeliveredMessage,
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
            console.log(response);
        },
        error: function(response) { // A function to be called if request failed
            console.error(response);
        }
    });
}

function countUnseenMessages(senderId, callback) {
    let query = {
        senderId: senderId,
        receiverId: userId,
        authToken: authToken
    }
    $.get(`${baseUrl}/chat/single/unseen/sender/count`, query, function(response, status, xhr) {

        if (response.status == 200) {
            callback(response.data);
        }
    });
}