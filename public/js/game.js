;(function($){
    'use strict';

    var game = undefined,
        chatPoller = 0,
        gamePoller = 0,
        gameCleanedUp = false;

    function abandon(){
      if(typeof game != 'undefined' && game.status === "PLAYING"){
        $.ajax({
          type: "POST",
          async: false,
          cache: false,
          url: "/759/battleship/public/forfeitGame",
          data: game,
          dataType: "json",
          success: function(data){
            console.log(data);
            gameCleanedUp = true;
          },
          failure: function() {

          },
        });
      }
    }

    $(window).on('beforeunload', function(){
      abandon();
    });

    $(window).on('unload', function(){
      abandon();
    });


    $("#starter").on("submit",function(e){
      e.preventDefault();
      console.log($( this ).serialize());

      $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: "/759/battleship/public/findGame",
        data: $( this ).serialize(),
        dataType: "json",
        success: function(data){
          //console.log( data );
          game = data.data;
          console.log(game);
          $(this).hide();
          $( "input[name*='gameId']" ).val(game.id);
          if(typeof game != 'undefined'){
            chatPoller = setInterval(pollChat, 2500);
            gamePoller = setInterval(pollGame, 5000);
          }



        },
        failure: function() {

        },
      });

      return false;
    });

    $("#chat").on("submit",function(e){
      e.preventDefault();
      console.log($( this ).serialize());


      $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: "/759/battleship/public/sendMessage",
        data: $( this ).serialize(),
        dataType: "json",
        success: function(data){
          console.log( data );
        },
        failure: function() {

        },
      });

      return false;
    });


    function pollChat(){
      //console.log(game);
      if(typeof game != 'undefined'){
        $.ajax({
          type: "POST",
          async: true,
          cache: false,
          url: "/759/battleship/public/getMessages",
          data: game,
          dataType: "json",
          success: function(data){
            console.log( data );
            var chat = data.data;
            $(".messages").html("");
            console.log(chat);

            for (let message in chat) {
              //console.log(`${message} = ${chat[message]}`);
              $(".messages").html(`${$(".messages").html()}<div>${chat[message].userName}: ${chat[message].message}</div>`);
            }
          },
          failure: function() {

          },
        });
      }
    }

    function pollGame(){
      if(typeof game != 'undefined'){
        $.ajax({
          type: "POST",
          async: true,
          cache: false,
          url: "/759/battleship/public/getGameStatus",
          data: game,
          dataType: "json",
          success: function(data){
            console.log( JSON.stringify(data.data) );
            game = data.data;
            $('.status').text(game.status);
            $('.opponent-name').text(game.opponentName);
          },
          failure: function() {

          },
        });
      }
    }

})(jQuery);
