;(function($){
    'use strict';

    var game = undefined,
        chatPoller = 0,
        gamePoller = 0,
        gameCleanedUp = false,
        board = [],
        moverId, myX, myY, origX, origY, origWidth, origHeight, origOrient;

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
            //console.log(data);
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



    $(".opponent-board rect").on('click', function(){
      //get id
      //console.log($(this).data('xcoord'), $(this).data('ycoord'));


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
          var orientation = $(this).attr("data-orientation");
          var length = $(this).data("length");
          //console.log(x,y,orientation, length);
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
      //console.log($( this ).serialize());
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
          //console.log(game);
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

      //console.log($( this ).serialize());


      $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: "/759/battleship/public/sendMessage",
        data: $( this ).serialize(),
        dataType: "json",
        success: function(data){
          $("input:text[name='chat']").val("");
          //console.log( data );
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
            //console.log( data );
            var chat = data.data;
            $(".messages").html("");
            //console.log(chat);

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
            //console.log( JSON.stringify(data.data) );
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
      document.addEventListener('keypress', (event) => {
        const keyName = event.key;
        alert('keypress event\n\n' + 'key: ' + keyName);
      });

    });

    $(window).on('load', function(){
      updateBoardArray();
      document.getElementsByTagName("svg")[0].addEventListener( "mousemove", moveChecker, "false");
      document.getElementsByTagName("svg")[0].addEventListener( "mouseup", releaseMouse, "false");
    });


    function rotator(event){
      if(moverId && event.shiftKey){
        let activePiece = document.getElementById(moverId);
        let myWidth = activePiece.getAttribute("width");
        let myHeight = activePiece.getAttribute("height");


        activePiece.setAttribute("width", myHeight);
        activePiece.setAttribute("height", myWidth);

        if($("#"+moverId).attr("data-orientation") === "H"){
          $("#"+moverId).attr("data-orientation", "V");
          $("#"+moverId).data("data-orientation", "V");
        }else if($("#"+moverId).attr("data-orientation") === "V"){
          $("#"+moverId).attr("data-orientation", "H");
          $("#"+moverId).data("data-orientation", "H");
        }

        updateCoords(moverId);
        console.log("rotator", activePiece.getAttribute("x"), activePiece.getAttribute("y"), $("#"+moverId).attr("data-orientation"));
      }
    }


    function setMove(pId){
      moverId = pId;
      console.log(document.getElementById(moverId).getAttribute("x"));
      myX = parseInt(document.getElementById(moverId).getAttribute("x"));
      myY = parseInt(document.getElementById(moverId).getAttribute("y"));
      console.log("in setMove(): ", moverId, myX, myY);

      //remove from board array
      var moverX = $("#"+moverId).data("xcoord");
      var moverY = $("#"+moverId).data("ycoord");
      var moverLength = $("#"+moverId).data("length");
      var moverOrient = $("#"+moverId).data("orientation");
      console.log($("#"+moverId).data("xcoord"),$("#"+moverId).data("ycoord"),$("#"+moverId).data("orientation"),$("#"+moverId).data("length"));
      for(var i=0;i<moverLength;i++){
        if(moverOrient === "H"){
          board[moverY][moverX+i] = "0";
        }else if(moverOrient === "V"){
          board[moverY+i][moverX] = "0";
        }
      }
      origX = moverX*40;
      origY = moverY*40;
      origWidth = document.getElementById(moverId).getAttribute("width");
      origHeight = document.getElementById(moverId).getAttribute("height");
      origOrient = moverOrient;

      document.addEventListener("keydown", rotator, "true");

      console.log(board);
    }

    //getting called for every mouse movement
    //only move checker if it's been clicked on
    function moveChecker(evt){
      //console.log(evt.clientX, evt.clientY);
      if(moverId){
        let checkerEle = document.getElementById(moverId);


        /*$(document).on('keydown', function(e){
          console.log("shifted:",e.shiftKey);
          if(e.shiftKey){

            $(document).on('keydown', function(e){return false;});

          }
        });*/

        var b = $( ".board svg" );
        var position = b.position();
        //console.log((evt.clientX-offset.left) , (evt.clientY-offset.top));

        //move checker on the SVG stage to mouse location
        checkerEle.setAttribute("x", evt.clientX-position.left);
        checkerEle.setAttribute("y", evt.clientY-position.top);
        /*$("#"+moverId).attr("data-xcoord", evt.clientX-position.left);
        $("#"+moverId).data("data-xcoord", evt.clientX-position.left);
        $("#"+moverId).attr("data-xcoord", evt.clientX-position.left);
        $("#"+moverId).data("data-xcoord", evt.clientX-position.left);*/
      }

    }

    function releaseMouse(){

      if(moverId){

        let curX = parseInt(document.getElementById(moverId).getAttribute("x"));
        let curY = parseInt(document.getElementById(moverId).getAttribute("y"));

        updateCoords(moverId);
        //only stop moving checker if we hit something
        if(checkHit(curX, curY)){

          moverId = undefined;
          origX = undefined;
          origY = undefined;
          origWidth = undefined;
          origHeight = undefined;
          origOrient = undefined;

          document.removeEventListener("keydown", rotator, "true");

        }

      }

    }

    function checkHit(curX, curY){
      for(let i=0;i<10;i++){
        for(let j=0;j<10;j++){
          let dropTarget = document.getElementById(`square_${i}_${j}`).getBBox();

          if(curX > dropTarget.x &&
             curX < dropTarget.x+dropTarget.width &&
             curY > dropTarget.y &&
             curY < dropTarget.y+dropTarget.height ){

               if(moverId && checkLegal(moverId)){

                 let checkerEle = document.getElementById(moverId);
                 checkerEle.setAttribute("x", dropTarget.x);
                 checkerEle.setAttribute("y", dropTarget.y);



               }else if(moverId){

                 //return to original position
                 let checkerEle = document.getElementById(moverId);
                 checkerEle.setAttribute("x", origX);
                 checkerEle.setAttribute("y", origY);
                 checkerEle.setAttribute("width", origWidth);
                 checkerEle.setAttribute("height", origHeight);
                 $("#"+moverId).attr("data-orientation", origOrient);
                 $("#"+moverId).data("data-orientation", origOrient);
                 console.log(origX,origY);
                 updateCoords(moverId);

               }

               updateBoardArray();
               console.log(board);
               return true;


          }
        }
      }
    }

    function updateCoords(piece){
      var ship = $("#"+piece);

      $("#"+piece).attr("data-xcoord", parseInt($("#"+piece).attr('x')/40));
      $("#"+piece).attr("data-ycoord", parseInt($("#"+piece).attr('y')/40));
      $("#"+piece).data("xcoord", parseInt($("#"+piece).attr('x')/40));
      $("#"+piece).data("ycoord", parseInt($("#"+piece).attr('y')/40));
      console.log("#"+piece, $("#"+piece).data("xcoord"), $("#"+piece).data("ycoord"));
      //document.getElementById('piece').setAttributeNS
    }

    function checkLegal(piece){
      //needs debugging and some fixing - dropping pieces may alson need fixing
      var legal = true;
      var checkX = parseInt($("#"+piece).attr("x")/40);
      var checkY = parseInt($("#"+piece).attr("y")/40);
      var checkOrient = $("#"+piece).attr("data-orientation");
      var checkLength = $("#"+piece).data("length");
      console.log("checkLegal", checkX, checkY, checkLength, checkOrient);

      if(checkOrient === "H" && (checkX+checkLength) > 10){
        console.log("offBoard");
        return false;
      }else if(checkOrient === "V" && (checkY+checkLength) > 10){
        console.log("offBoard");
        return false;
      }else{

        console.log("onboard check");
        for(var i=0;i<checkLength;i++){
          if(checkOrient === "H"){
            //var temp = checkY;
            var verifyX = checkX+i;
            var verifyY = checkY;
            //checkX = temp;
          }else{
            var verifyX = checkX;
            var verifyY = checkY+i;
          }

          try {

            if(board[verifyY][verifyX] === 'X'){
              legal = false;
            }else if(typeof board[verifyY][verifyX+1] !== 'undefined' && board[verifyY][verifyX+1] === 'X'){
              legal = false;
            }else if(typeof board[verifyY][verifyX-1] !== 'undefined' && board[verifyY][verifyX-1] === 'X'){
              legal = false;
            }else if(typeof board[verifyY+1][verifyX] !== 'undefined' && board[verifyY+1][verifyX] === 'X'){
              legal = false;
            }else if(typeof board[verifyY+1][verifyX+1] !== 'undefined' && board[verifyY+1][verifyX+1] === 'X'){
              legal = false;
            }else if(typeof board[verifyY+1][verifyX-1] !== 'undefined' && board[verifyY+1][verifyX-1] === 'X'){
              legal = false;
            }else if(typeof board[verifyY-1][verifyX] !== 'undefined' && board[verifyY-1][verifyX] === 'X'){
              legal = false;
            }else if(typeof board[verifyY-1][verifyX-1] !== 'undefined' && board[verifyY-1][verifyX-1] === 'X'){
              legal = false;
            }else if(typeof board[verifyY-1][verifyX+1] !== 'undefined' && board[verifyY-1][verifyX+1] === 'X'){
              legal = false;
            }

          }catch(error) {
            //console.error(error);
            console.log("checkLegalError", verifyX, verifyY, checkLength, checkOrient);

          }


        }

        return legal;

      }


    }

})(jQuery);
