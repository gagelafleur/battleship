;(function($){
    'use strict';

    const baseurl = "/";
    const svgns = "http://www.w3.org/2000/svg";
    const debug = true;

    var game = undefined,
        currentStatus = "WAITING",
        chatPoller = 0,
        gamePoller = 0,
        boardPoller = 0,
        playerId = undefined,
        gameCleanedUp = false,
        board = [],
        moverId, myX, myY, origX, origY, origWidth, origHeight, origOrient, origLength;



    $(window).on('beforeunload', function(){
      abandon();
    });

    $(window).on('unload', function(){
      abandon();
    });

    function abandon(){
      if(typeof game != 'undefined' && game.status === "PLAYING"){
        $.ajax({
          type: "POST",
          async: false,
          cache: false,
          url: baseurl+"forfeitGame",
          data: game,
          dataType: "json",
          success: function(data){
            gameCleanedUp = true;
          },
          failure: function() {

          },
        });
      }
    }


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

          for(var i=0;i<length;i++){
            if(orientation === "H"){
              board[y][x+i] = "X";
            }else if(orientation === "V"){
              board[y+i][x] = "X";
            }
          }

      });

      $("#starter input[name='board']").val(JSON.stringify(board));
    }





    //chat functions

    $("#chat").on("submit",function(e){
      e.preventDefault();

      $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: baseurl+"sendMessage",
        data: $( this ).serialize(),
        dataType: "json",
        success: function(data){

          $("input:text[name='chat']").val("");
          pollChat();

        },
        failure: function() {

        },
      });

      return false;
    });


    function pollChat(){

      if(typeof game != 'undefined'){
        $.ajax({
          type: "POST",
          async: true,
          cache: false,
          url: baseurl+"getMessages",
          data: game,
          dataType: "json",
          success: function(data){

            var chat = data.data;
            $(".messages").html("");

            for (let message in chat) {
              $(".messages").html(`${$(".messages").html()}<div>${chat[message].userName} (${chat[message].created_at}): ${chat[message].message}</div>`);
            }
          },
          failure: function() {

          },
        });
      }
    }

    //play functions

    $("#starter").on("submit",function(e){
      e.preventDefault();
      $(this).fadeOut(300, function() { $(this).remove(); });
      $('.instruct').fadeOut(300, function() { $('.instruct').remove(); });

      $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: baseurl+"findGame",
        data: $( this ).serialize(),
        dataType: "json",
        success: function(data){

          game = data.data;
          $(this).hide();
          $( "input[name*='gameId']" ).val(game.id);

          if(typeof game != 'undefined'){
            $.growl.notice({ message: "Waiting for an opponent" });
            chatPoller = setInterval(pollChat, 2500);
            gamePoller = setInterval(pollGame, 5000);
          }

        },
        failure: function() {

        },
      });

      return false;
    });

    function pollGame(){
      if(typeof game != 'undefined'){
        $.ajax({
          type: "POST",
          async: true,
          cache: false,
          url: baseurl+"getGameStatus",
          data: game,
          dataType: "json",
          success: function(data){


            if(debug){
              console.log( data );
            }

            game = data.data;
            $('.status').text(game.status);
            $('.opponent-name').text(game.opponentName);
            if(game.status === "ABANDONED"){
              clearInterval(chatPoller);
              clearInterval(gamePoller);
              $('.opponent-name').text("");
              window.alert('Your opponent has forfeited the match.');
              window.location.href='/';
            }else if(currentStatus === "WAITING"  && game.status === "PLAYING"){
              //remove ability to move pieces on own board
              if(debug){
                console.log("game started. making board read only.");
              }

              document.getElementsByTagName("svg")[0].removeEventListener( "mousemove", moveChecker, "false");
              document.getElementsByTagName("svg")[0].removeEventListener( "mouseup", releaseMouse, "false");

              //set opponent board event listener
              var opponentSquares = document.getElementsByTagName("svg")[1].getElementsByTagName("rect");

              for (var i = 0; i < opponentSquares.length; i++) {
                opponentSquares[i].addEventListener( "mouseup", fire, "false");
              }

              $(".chat-container").slideToggle(300);
              if(game.playerTurn === uid){
                $("#turn-indicator").text("Your");
              }else{
                $("#turn-indicator").text("Opponent's");
              }
              $(".turn").fadeIn(300);

              boardPoller = setInterval(pollBoard, 500);


            }else if(currentStatus === "PLAYING"  && game.status === "FINISHED"){

              checkWinner();
            }
            currentStatus = game.status;
          },
          failure: function() {

          },
        });
      }
    }


    function checkWinner(){
      if(typeof game != 'undefined'){
        $.ajax({
          type: "POST",
          async: true,
          cache: false,
          url: baseurl+"checkWinner",
          data: game,
          dataType: "json",
          success: function(data){

            if(debug){
              console.log(data);
            }

            if(data.success && data.winner){
              $.growl.notice({ title:"Winner!", message: data.message });
              $(".turn").text("Game Over. You Won!");
            }else if(data.success && !data.winner){
              $.growl.notice({ title:"Sorry :(", message: data.message });
              $(".turn").text("Game Over. You Lost :(");
            }

            if(data.success){
              clearInterval(boardPoller);
              clearInterval(gamePoller);
            }

          },
          failure: function() {

          },
        });
      }
    }

    function pollBoard(){
      if(typeof game != 'undefined'){
        $.ajax({
          type: "POST",
          async: true,
          cache: false,
          url: baseurl+"getGameUpdates",
          data: game,
          dataType: "json",
          success: function(data){

            if(debug){
              console.log( JSON.stringify(data.board) );
            }

            var serverBoard = JSON.parse(data.board)

            if(debug){
              console.log(data);
            }


            if(!compareBoards(board, serverBoard)){
              board = serverBoard;
              updateBoardHits();
            }

            if(data.turn === uid){
              $("#turn-indicator").text("Your");
            }else{
              $("#turn-indicator").text("Opponent's");
            }

            if(data.success === null){
              clearInterval(boardPoller);
            }


          },
          failure: function() {

          },
        });
      }


    }

    function compareBoards(arr1, arr2) {

      if(arr1.length !== arr2.length){
        return false;
      }

      if(debug){
        console.log(arr1[0].length, arr2[0].length);
      }

      for(var i = 0; i < arr1.length; i++) {
        for(var j = 0; j < arr1[i].length; j++) {
          if(arr1[i][j] !== arr2[i][j]){
            return false;
          }
        }
      }

      return true;
    }


    //move/board hit functions

    function updateBoardHits(){

      $('.hit-square').remove();
      $('.miss-square').remove();

      for(var i = 0; i < board.length; i++) {
        for(var j = 0; j < board[i].length; j++) {
          if(board[i][j] === "1"){

            var explosion = document.createElementNS("http://www.w3.org/2000/svg", "image");
            explosion.setAttribute('class', 'hit-square');
            explosion.setAttribute('id', 'explode_'+i+'_'+j);
            explosion.setAttribute("x",parseInt(40*j));
            explosion.setAttribute("y",parseInt(40*i));
            explosion.setAttribute("width",40);
            explosion.setAttribute("height",40);

            //image from https://commons.wikimedia.org/wiki/File:Explosion-155624_icon.svg
            explosion.setAttributeNS("http://www.w3.org/1999/xlink", "href", "img/explosion.svg");
            document.getElementsByTagName("svg")[0].appendChild(explosion);

          }else if(board[i][j] === "!"){

            var splash = document.createElementNS("http://www.w3.org/2000/svg", "image");
            splash.setAttribute('class', 'miss-square');
            splash.setAttribute('width', '40');
            splash.setAttribute('height', '40');
            splash.setAttribute('fill', 'blue');
            splash.setAttribute('x', parseInt(40*j));
            splash.setAttribute('y', parseInt(40*i));

            //image from https://pixabay.com/en/water-splash-fountain-blue-311139/
            splash.setAttributeNS("http://www.w3.org/1999/xlink", "href", "img/splash.svg");
            splash.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
            document.getElementsByTagName("svg")[0].appendChild(splash);

          }
        }
      }
    }


    function fire(e){

      if(debug){
        console.log(e.target.id, game.playerTurn);
      }

      var xShot = $("#"+e.target.id).attr("data-xcoord");
      var yShot = $("#"+e.target.id).attr("data-ycoord");

      var shot = {
        "id"  : game.id,
        "y"   : yShot,
        "x"   : xShot,

      }

      if(typeof game != 'undefined' && game.status === "PLAYING"){
        $.ajax({
          type: "POST",
          async: true,
          cache: false,
          url: baseurl+"checkOpponentHit",
          data: shot,
          dataType: "json",
          success: function(data){

            if(debug){
              console.log("SHOT", data);
            }


            if(!data.success){
              $.growl.error({ message: data.message });
            }

            if(data.success && data.shot === "X"){
              //$("#"+e.target.id).attr("fill", "red");
              placePeg(e.target.id, true);
              document.getElementById(e.target.id).removeEventListener( "mouseup", fire, "false");
              $.growl.notice({ message: "Hit at: "+xShot+", "+yShot });
            }else if(data.success && data.shot === "0"){
              //$("#"+e.target.id).attr("fill", "grey");
              placePeg(e.target.id, false);
              document.getElementById(e.target.id).removeEventListener( "mouseup", fire, "false");
              $.growl.warning({ message: "Miss at: "+xShot+", "+yShot });
            }

          },
          failure: function() {

          },
        });
      }
    }

    function placePeg(target, hit){
      var fill = "white";
      var targetSquare = document.getElementById( target );
      if(hit){
        fill = "red";
      }
      var circle = document.createElementNS(svgns, 'circle');
      circle.setAttributeNS(null, 'cx', (parseInt(targetSquare.getAttribute("x"))+parseInt((targetSquare.getAttribute("width")/2))));
      circle.setAttributeNS(null, 'cy', (parseInt(targetSquare.getAttribute("y"))+parseInt((targetSquare.getAttribute("height")/2))));
      circle.setAttributeNS(null, 'r', 7);
      circle.setAttributeNS(null, 'fill', fill);
      circle.setAttributeNS(null, 'stroke', "black");
      circle.setAttributeNS(null, 'stroke-width', "2px");
      document.getElementById( "opponent-board" ).getElementsByTagName("svg")[0].appendChild(circle);
    }




    //board setup functions

    $(".gamepiece").on('mousedown', function(){

      if(debug){
        console.log($(this).attr("id"));
      }

      setMove($(this).attr("id"));

    });

    $(window).on('load', function(){

      var myBoard = document.getElementsByTagName("svg")[0];

      if(typeof myBoard !== "undefined"){
        updateBoardArray();
        myBoard.addEventListener( "mousemove", moveChecker, "false");
        myBoard.addEventListener( "mouseup", releaseMouse, "false");
      }

    });


    function rotator(event){
      if(moverId && event.shiftKey){
        let activePiece = document.getElementById(moverId);
        let myWidth = activePiece.getAttribute("width");
        let myHeight = activePiece.getAttribute("height");
        let myLength = activePiece.getAttribute("data-length");

        if(debug){
          console.log(myLength);
        }

        activePiece.setAttribute("width", myHeight);
        activePiece.setAttribute("height", myWidth);

        if($("#"+moverId).attr("data-orientation") === "H"){
          $("#"+moverId).attr("data-orientation", "V");
          $("#"+moverId).data("orientation", "V");
          $("#"+moverId).attr("fill", "url(#boat_"+myLength+"_V)");
        }else if($("#"+moverId).attr("data-orientation") === "V"){
          $("#"+moverId).attr("data-orientation", "H");
          $("#"+moverId).data("orientation", "H");
          $("#"+moverId).attr("fill", "url(#boat_"+myLength+"_H)");
        }

        updateCoords(moverId);

        if(debug){
          console.log("rotator", activePiece.getAttribute("x"), activePiece.getAttribute("y"), $("#"+moverId).attr("data-orientation"));
        }

      }
    }

    function setMove(pId){

      moverId = pId;
      myX = parseInt(document.getElementById(moverId).getAttribute("x"));
      myY = parseInt(document.getElementById(moverId).getAttribute("y"));

      if(debug){
        console.log("in setMove(): ", moverId, myX, myY);
      }

      //remove from board array
      var moverX = $("#"+moverId).data("xcoord");
      var moverY = $("#"+moverId).data("ycoord");
      var moverLength = $("#"+moverId).data("length");
      var moverOrient = $("#"+moverId).data("orientation");

      if(debug){
        console.log($("#"+moverId).data("xcoord"),$("#"+moverId).data("ycoord"),$("#"+moverId).data("orientation"),$("#"+moverId).data("length"));
      }

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
      origLength = moverLength;

      document.addEventListener("keydown", rotator, "false");

      if(debug){
        console.log(board);
      }
    }

    //getting called for every mouse movement
    //only move checker if it's been clicked on
    function moveChecker(evt){

      if(moverId){
        let checkerEle = document.getElementById(moverId);

        var b = $( ".board svg" );
        var position = b.position();
        var yOffset = $(window).scrollTop();

        if(debug){
          console.log(yOffset);
        }

        checkerEle.setAttribute("x", evt.clientX-position.left);
        checkerEle.setAttribute("y", evt.clientY-position.top+yOffset);
      }

    }

    function releaseMouse(){

      if(moverId){

        let curX = parseInt(document.getElementById(moverId).getAttribute("x"));
        let curY = parseInt(document.getElementById(moverId).getAttribute("y"));

        updateCoords(moverId);

        if(checkHit(curX, curY)){

          moverId = undefined;
          origX = undefined;
          origY = undefined;
          origWidth = undefined;
          origHeight = undefined;
          origOrient = undefined;
          origLength = undefined;

          document.removeEventListener("keydown", rotator, "false");

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
                 checkerEle.setAttribute("fill", "url(#boat_"+origLength+"_"+origOrient+")");

                 $("#"+moverId).attr("data-orientation", origOrient);
                 $("#"+moverId).data("orientation", origOrient);

                 if(debug){
                   console.log(origX,origY);
                 }

                 updateCoords(moverId);

               }

               updateBoardArray();

               if(debug){
                 console.log(board);
               }

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

      if(debug){
        console.log("#"+piece, $("#"+piece).data("xcoord"), $("#"+piece).data("ycoord"));
      }

    }

    function checkLegal(piece){

      var legal = true;
      var checkX = parseInt($("#"+piece).attr("x")/40);
      var checkY = parseInt($("#"+piece).attr("y")/40);
      var checkOrient = $("#"+piece).attr("data-orientation");
      var checkLength = $("#"+piece).data("length");

      if(debug){
        console.log("checkLegal", checkX, checkY, checkLength, checkOrient);
      }


      if(checkOrient === "H" && (checkX+checkLength) > 10){
        if(debug){
          console.log("offBoard");
        }
        return false;
      }else if(checkOrient === "V" && (checkY+checkLength) > 10){
        if(debug){
          console.log("offBoard");
        }
        return false;
      }else{


        if(debug){
          console.log("onboard check");
        }

        for(var i=0;i<checkLength;i++){
          if(checkOrient === "H"){
            var verifyX = checkX+i;
            var verifyY = checkY;
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
            }else if(typeof board[verifyY+1] !== 'undefined' && typeof board[verifyY+1][verifyX] !== 'undefined' && board[verifyY+1][verifyX] === 'X'){
              legal = false;
            }else if(typeof board[verifyY+1] !== 'undefined' && typeof board[verifyY+1][verifyX+1] !== 'undefined' && board[verifyY+1][verifyX+1] === 'X'){
              legal = false;
            }else if(typeof board[verifyY+1] !== 'undefined' && typeof board[verifyY+1][verifyX-1] !== 'undefined' && board[verifyY+1][verifyX-1] === 'X'){
              legal = false;
            }else if(typeof board[verifyY-1] !== 'undefined' && typeof board[verifyY-1][verifyX] !== 'undefined' && board[verifyY-1][verifyX] === 'X'){
              legal = false;
            }else if(typeof board[verifyY-1] !== 'undefined' && typeof board[verifyY-1][verifyX-1] !== 'undefined' && board[verifyY-1][verifyX-1] === 'X'){
              legal = false;
            }else if(typeof board[verifyY-1] !== 'undefined' && typeof board[verifyY-1][verifyX+1] !== 'undefined' && board[verifyY-1][verifyX+1] === 'X'){
              legal = false;
            }

          }catch(error) {

            console.log("checkLegalError", verifyX, verifyY, checkLength, checkOrient);

          }

        }

        return legal;

      }

    }



})(jQuery);
