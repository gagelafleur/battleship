<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Auth;
use App\Game;
use App\Message;
use App\User;
use DB;

class GameController extends Controller
{

  public function __construct()
  {
  	$this->middleware('auth');
  }


  /**
   * Show the application dashboard.
   *
   * @return \Illuminate\Http\Response
   */
  public function index()
  {
      $user = Auth::user();
      return view('play')->with('user', $user); ;
  }

  public function startGame()
  {
    $game = $this->findGame();
    $currentPlayer = Auth::User();

    if(count($game) > 0 && $game->player1Id !== $currentPlayer->id){

      $game->player2Id = $currentPlayer->id;
      $game->status = "PLAYING";
      $game->save();



    }else{

      $game = new Game();
      $game->player1Id = $currentPlayer->id;
      $game->player2Id = NULL;
      $game->save();

    }




    return response()->json([
        'success'  => true,
        'data' => $game
    ]);
    //
  }

  public function findGame(){
    $existingGame = Game::orderBy('created_at', 'asc')->whereNull('player2Id')->where("status", "=" , "WAITING")->first();
    return $existingGame;
  }

  public function forfeitGame(Request $request)
  {
    $this->validate($request, [

      'id' => 'required|numeric',

    ]);
    $currentPlayer = Auth::User();
    $game = Game::where('id', $request['id'])->first();


    if($game->status === "PLAYING"){

      if($game->player1Id === $currentPlayer->id){
        $game->winner = $game->player2Id;
      }else{
        $game->winner = $game->player1Id;
      }

      $game->status = "ABANDONED";
      $game->save();

    }

    return response()->json([
        'success'  => true,
        'data' => $game
    ]);

  }

  public function sendMessage(Request $request)
  {

    $this->validate($request, [

      'chat' => 'required|max:255',
      'gameId' => 'required|numeric',

    ]);

    $message = [];

    $game = Game::where('id', $request['gameId'])->first();
    $user = Auth::user();


    if($game->status === "PLAYING" && ($game->player1Id == $user->id || $game->player2Id == $user->id)){

      $message = new Message();
      $message->userId = $user->id;
      $message->gameID = $request['gameId'];
      $message->message = $request['chat'];
      $message->save();

    }

    return response()->json([
        'success'  => true,
        'data' => $message
    ]);

  }

  public function getMessages(Request $request)
  {

    $this->validate($request, [

      'id' => 'required|numeric',

    ]);

    $chat = [];

    $game = Game::where('id', $request['id'])->first();
    $user = Auth::user();

    if($game->status === "PLAYING" && ($game->player1Id == $user->id || $game->player2Id == $user->id)){

      $chat = Message::orderBy('created_at', 'asc')->where('gameId', $request['id'])->get();

    }
    foreach($chat as $c){
      $c->userName = User::where('id', $c->userId)->first()->name;
    }

    return response()->json([
        'success'  => true,
        'data' => $chat
    ]);

  }

  public function getGameStatus(Request $request)
  {

    $this->validate($request, [

      'id' => 'required|numeric',

    ]);

    $game = Game::where('id', $request['id'])->first();
    $user = Auth::user();

    if($game->player1Id !== NULL){

      if($game->player1Id === $user->id){
        $game->player1Name = $user->name;
      }else{
        $game->player1Name = User::where('id', $game->player1Id)->first()->name;
        $game->opponentName = $game->player1Name;
      }

    }else{

      $game->player1Name = NULL;

    }

    if($game->player2Id !== NULL){

      if($game->player2Id === $user->id){
        $game->player2Name = $user->name;
      }else{
        $game->player2Name = User::where('id', $game->player2Id)->first()->name;
        $game->opponentName = $game->player2Name;
      }

    }else{

      $game->player2Name = NULL;

    }

    return response()->json([
        'success'  => true,
        'data' => $game
    ]);

  }


  public static function printOwnBoard(){

    $height = 40;
    $width = 40;
    $fill = "white";
    $stroke = "blue";
    $strokeWidth = 1;

    $board = "";

    for($i = 0; $i<10;$i++){

      for($j = 0; $j<10;$j++){

        $horizOffset = $width*$i;
        $vertOffset = $height*$j;

        $board .= "<rect id = 'square_{$i}_{$j}' x='{$horizOffset}' y='{$vertOffset}' height='{$height}' width='{$width}' fill='{$fill}' stroke='{$stroke}' stroke-width='{$strokeWidth}'></rect>";

      }

    }

    print $board;


  }

  public static function printOpponentBoard(){

    $height = 40;
    $width = 40;
    $fill = "white";
    $stroke = "blue";
    $strokeWidth = 1;

    $board = "";

    for($i = 0; $i<10;$i++){

      for($j = 0; $j<10;$j++){

        $horizOffset = $width*$i;
        $vertOffset = $height*$j;

        $board .= "<rect id = 'opponent_square_{$i}_{$j}' x='{$horizOffset}' y='{$vertOffset}' height='{$height}' width='{$width}' fill='{$fill}' stroke='{$stroke}' stroke-width='{$strokeWidth}'></rect>";

      }

    }

    print $board;


  }

}
