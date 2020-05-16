$(document).ready(function() {
    const baseUrl = 'http://localhost:3000';
    const socket = io(baseUrl); // connecting with sockets.
    const authToken = getCookie("authToken");
    const userId = getCookie("userId");
    let name = "";
    let flag = true; //for initialization

    //-------------------------------------------------------------------------------------------------------------------

    let chatSocket = () => {
        //-------------------------------------------------
        socket.on('verifyUser', (data) => {

            console.log("socket trying to verify user");

            socket.emit("set-user", authToken, userId);

        });
        //-------------------------------------------------
        socket.on(userId, (data) => { //Message received

            let sender = $(`.sender .sender-name:contains(${data.senderName})`).parents(".sender");
            //Add message to chatbox
            if ($(sender).hasClass("active")) {
                $("#noMessage").prop("hidden", true);
                let parent = $("#message-recieved-block").parent();
                let message = $("#message-recieved-block").clone();
                $(message).find(".message-recieved").text(data.message);
                $(message).prop("hidden", false).prop("id", "");
                $(parent).append($(message));
            }

            //Add message to userlist
            $(sender).find(".sender-message").text(data.message);
            $(sender).find(".sender-message-date").text(formatDate(data.createdOn));
            $(sender).find(".sender-message-time").text(changeTo12Hour(data.createdOn));
            $(sender).find(".sender-message-status").text("New message");
            let parent = $(sender).parent();
            let clone = $(sender).clone();
            $(sender).remove();
            $(parent).prepend($(clone));
            sender = clone;


            $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);

        });
        //-------------------------------------------------
        socket.on("online-user-list", (jsonData) => {

            $(".sender").find(".sender-message-status").text("Offline");
            for (const [id, name] of Object.entries(jsonData)) {
                if (userId == id)
                    continue;
                $(`.sender .sender-id:contains(${id})`).parent().find(".sender-message-status").text("Online").css("color", "green");
            }

        });
        //-------------------------------------------------
        socket.on("typing", (name) => {
            let sender = $(`.sender .sender-name:contains(${name})`).parent();
            setTimeout(function() {
                $(sender).find(".sender-message-status").text("Online");
            }, 1500);
            $(sender).find(".sender-message-status").text("typing...");

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
            $(sender).find(".sender-message-date").text(formatDate(chatMessage.createdOn));
            let parent = $(sender).parent();
            let clone = $(sender).clone();
            $(sender).remove();
            $(parent).prepend($(clone));


            //Add message to chatbox
            parent = $("#message-sent-block").parent();
            let message = $("#message-sent-block").clone();
            $(message).find(".message-sent").text(chatMessage.message);
            $(message).prop("hidden", false).prop("id", "");
            $(parent).append($(message)).fadeIn('slow');


            socket.emit("chat-msg", chatMessage)
            $("#message").val("");
            $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
            $("#noMessage").prop("hidden", true);
        });

        $("#message").on('keypress', function() {

            socket.emit("typing", name)

        });
        //-------------------------------------------------
        socket.on("auth-error", (jsonData) => {

            console.log(jsonData);
            $("#logout").trigger('click');

        });
        //-------------------------------------------------
    };
    //----------------------------------------------------------------------------------------------------------------


    function initialize() {
        if (!authToken || !userId)
            window.location.href = "index.html";
        chatSocket();

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

        $(".sender").find(".sender-message-status").css("color", "red").text("Offline");
    }

    initialize();

    $("#message").on('keypress', function(e) {
        if (e.keyCode == 13) {
            $("#send").trigger("click");
        }
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

        $("#sendMessage").prop("hidden", false);
        $("#noMessage").prop("hidden", false);
        $(".sender").removeClass("active");
        $(".date:not(#date)").remove();
        $(".message-sent-block:not(#message-sent-block)").remove();
        $(".message-recieved-block:not(#message-recieved-block)").remove();
        $(this).addClass("active");

        let id = $(this).find(".sender-id").text();
        let request = {
            authToken: authToken,
            senderId: id,
            receiverId: userId
        }
        $.get(`${baseUrl}/chat/single`, request, function(response, status, xhr) {

                if (response.status == 200) {
                    if (response.data) {
                        $("#noMessage").prop("hidden", true);
                        let data = response.data;


                        let date = formatDate(new Date());

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
                                $(message).find(".time").text(changeTo12Hour(data[i].createdOn));
                                $(message).prop("hidden", false).prop("id", "");
                                $(parent).prepend($(message));

                            } else if (data[i].receiverId == userId) {

                                let parent = $("#message-recieved-block").parent();
                                let message = $("#message-recieved-block").clone();
                                $(message).find(".message-recieved").text(data[i].message);
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

                        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);

                        //Add message to userlist
                        let sender = $(`.sender .sender-id:contains(${id})`).parents(".sender");
                        $(sender).find(".sender-message").text(data[0].message);
                        $(sender).find(".sender-message-time").text(changeTo12Hour(data[0].createdOn));
                        $(sender).find(".sender-message-date").text(formatDate(data[0].createdOn));


                        setTimeout(function() {
                            let msgSender = $(".sender:not(#sender)").first();

                            if ($(msgSender).find(".sender-id").text() != id) {


                                let msgtime = $(msgSender).find(".sender-message-time").text();
                                let msgdate = $(msgSender).find(".sender-message-date").text();

                                if (msgtime.trim() != "" && msgdat.trim() != "") {

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
                        }, 400);
                    }
                }

            },
            "json");
    });

});

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

function unformatDate(date) {

    let [day, month, year] = date.split('/');
    day = parseInt(day)
    month = parseInt(month)
    year = parseInt(year)
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;


    return `${year}-${month}-${day}`;
}