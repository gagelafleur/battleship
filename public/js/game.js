;(function($){
    'use strict';

    var game = undefined,
        chatPoller = 0,
        gamePoller = 0,
        gameCleanedUp = false,
        board = [];

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

    $(window).on('load', function(){
      updateBoardArray();
    });

    $(".opponent-board rect").on('click', function(){
      //get id
      console.log($(this).data('xcoord'), $(this).data('ycoord'));


      //quick call to server to check if legal and if ship is on it


    });

    function updateBoardArray(){

      board = [
              ["0","0","0","0","0","0","0","0","0","0"],
              ["0","0","0","0","0","0","0","0","0","0"],
              ["0","0","0","0","0","0","0","0","0","0"],
              ["0","0","0","0","0","0","0","0","0","0"],
              ["0","0","0","0","0","0","0","0","0","0"],
              ["0","0","0","0","0","0","0","0","0","0"],
              ["0","0","0","0","0","0","0","0","0","0"],
              ["0","0","0","0","0","0","0","0","0","0"],
              ["0","0","0","0","0","0","0","0","0","0"],
              ["0","0","0","0","0","0","0","0","0","0"],
              ];

      $(".gamepiece").each(function(){
          var x = $(this).data("xcoord");
          var y = $(this).data("ycoord");
          var orientation = $(this).data("orientation");
          var length = $(this).data("length");
          console.log(x,y,orientation, length);
          for(var i=0;i<length;i++){
            if(orientation === "H"){
              board[y][x+i] = "X";
            }else if(orientation === "V"){
              board[y+i][x] = "X";
            }
          }

      });
      //console.log(board);
      $("#starter input[name='board']").val(JSON.stringify(board));
    }


    $("#starter").on("submit",function(e){
      e.preventDefault();
      console.log($( this ).serialize());
      //send board data with this call.

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
          $("input:text[name='chat']").val("");
          console.log( data );
          pollChat();
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
              $(".messages").html(`${$(".messages").html()}<div>${chat[message].userName} (${chat[message].created_at}): ${chat[message].message}</div>`);
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
            if(game.status === "ABANDONED"){
              clearInterval(chatPoller);
              clearInterval(gamePoller);
              $('.opponent-name').text("");
              window.alert('Your opponent has forfeited the match.');
              window.location.href='http://gagelafleur.com/759/battleship/public/';
            }
          },
          failure: function() {

          },
        });
      }
    }

})(jQuery);
