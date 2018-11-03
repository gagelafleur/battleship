;(function($){
    'use strict';

    var game = undefined,
        chatPoller = 0;



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

})(jQuery);
