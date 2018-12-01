;(function($){
    'use strict';

    var game = undefined,
        chatPoller = 0,
        gamePoller = 0,
        gameCleanedUp = false,
        board = [],
        moverId, myX, myY;

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
      document.getElementsByTagName("svg")[0].addEventListener( "mousemove", moveChecker, "false");
      document.getElementsByTagName("svg")[0].addEventListener( "mouseup", releaseMouse, "false");
    });

    $(".opponent-board rect").on('click', function(){
      //get id
      console.log($(this).data('xcoord'), $(this).data('ycoord'));


      //quick call to server to check if legal and if ship is on it


    });

    /*$(".randomizor a").on('click', function(e){
      e.preventDefault();
      $( ".board svg" ).remove( ".gamepiece" );

      $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: "/759/battleship/public/randomize",
        data: $( this ).serialize(),
        dataType: "json",
        success: function(data){

          $(".board svg").append(data);

        },
        failure: function() {

        },
      });

    });*/

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
            $.growl({ message: "Waiting for and opponent" });
            chatPoller = setInterval(pollChat, 2500);
            gamePoller = setInterval(pollGame, 5000);
          }

          $(".debug").text("<pre>"+game.array+"</pre>");

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

    $(".gamepiece").on('mousedown', function(){

      console.log($(this).attr("id"));
      setMove($(this).attr("id"));

    });


    function setMove(pId){
      moverId = pId;
      console.log(document.getElementById(moverId).getAttribute("x"));
      myX = parseInt(document.getElementById(moverId).getAttribute("x"));
      myY = parseInt(document.getElementById(moverId).getAttribute("y"));
      console.log("in setMove(): ", moverId, myX, myY);

    }

    //getting called for every mouse movement
    //only move checker if it's been clicked on
    function moveChecker(evt){
      //console.log(evt.clientX, evt.clientY);
      if(moverId){
        let checkerEle = document.getElementById(moverId);

        var b = $( ".board svg" );
        var offset = b.offset();
        console.log((evt.clientX-offset.left) , (evt.clientY-offset.top));

        //move checker on the SVG stage to mouse location
        checkerEle.setAttribute("x", evt.clientX-offset.left);
        checkerEle.setAttribute("y", evt.clientY-offset.top);
      }

    }

    function releaseMouse(){

      if(moverId){

        let curX = parseInt(document.getElementById(moverId).getAttribute("x"));
        let curY = parseInt(document.getElementById(moverId).getAttribute("y"));


        //only stop moving checker if we hit something
        if(checkHit(curX, curY)){

          moverId = undefined;

        }



      }

    }

    function checkHit(curX, curY){
      for(let i=0;i<10;i++){
        for(let j=0;j<10;j++){
          let dropTarget = document.getElementById(`square_${i}_${j}`).getBBox();
          //console.log(dropTarget);

          if(curX > dropTarget.x &&
             curX < dropTarget.x+dropTarget.width &&
             curY > dropTarget.y &&
             curY < dropTarget.y+dropTarget.height ){

               if(moverId){
                 let checkerEle = document.getElementById(moverId);
                 checkerEle.setAttribute("x", dropTarget.x);
                 checkerEle.setAttribute("y", dropTarget.y);
               }   

            return true;

          }
        }
      }
    }

})(jQuery);
