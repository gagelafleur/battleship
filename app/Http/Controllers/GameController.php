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

  public $positions = array(
    array("O","O","O","O","O","O","O","O","O","O"),
    array("O","O","O","O","O","O","O","O","O","O"),
    array("O","O","O","O","O","O","O","O","O","O"),
    array("O","O","O","O","O","O","O","O","O","O"),
    array("O","O","O","O","O","O","O","O","O","O"),
    array("O","O","O","O","O","O","O","O","O","O"),
    array("O","O","O","O","O","O","O","O","O","O"),
    array("O","O","O","O","O","O","O","O","O","O"),
    array("O","O","O","O","O","O","O","O","O","O"),
    array("O","O","O","O","O","O","O","O","O","O")
  );

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

  /**
   *
   * Starts a game
   *
   * @param    request  $request containing the board array
   * @return \Illuminate\Http\Response
   *
   */
  public function startGame(Request $request)
  {

    $this->validate($request, [

      'board' => 'required|json',

    ]);

    $game = $this->findGame();
    $currentPlayer = Auth::User();

    $proposedBoard = json_decode($request['board'], true);

    if($this->countShips($proposedBoard) !== 17){

      return response()->json([
          'success'  => false,
          'message' => 'Not enough ships on the board.'
      ]);

    }

    if(count($game) > 0 && $game->player1Id !== $currentPlayer->id){

      $game->player2Id = $currentPlayer->id;
      $game->player2Board = $request['board'];
      $game->status = "PLAYING";
      $game->save();

    }else{

      $game = new Game();
      $game->player1Id = $currentPlayer->id;
      $game->player2Id = NULL;
      $game->player1Board = $request['board'];
      $game->playerTurn = $currentPlayer->id;
      $game->save();
      $board = json_decode($request['board']);
      $game->array = print_r($board, true);

    }

    return response()->json([
        'success'  => true,
        'data' => $game
    ]);

  }

  /**
   *
   * Finds a game without an opponent
   *
   * @return Game
   *
   */
  public function findGame(){
    $existingGame = Game::orderBy('created_at', 'asc')->whereNull('player2Id')->where("status", "=" , "WAITING")->first();
    return $existingGame;
  }

  /**
   *
   * Marks a game as abandoned
   *
   * @param    request  $request containing the game id
   * @return \Illuminate\Http\Response
   *
   */
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

  /**
   *
   * Sends a message to the chat box
   *
   * @param    request  $request containing the game id and message
   * @return \Illuminate\Http\Response
   *
   */
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
      $request['chat'] = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $request['chat']);
      $request['chat'] = preg_replace('#<style(.*?)>(.*?)</style>#is', '', $request['chat']);

      $message->message = $request['chat'];
      $message->save();

    }

    return response()->json([
        'success'  => true,
        'data' => $message
    ]);

  }

  /**
   *
   * Gets messages associates with current game
   *
   * @param    request  $request containing the game id
   * @return \Illuminate\Http\Response
   *
   */
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

  /**
   *
   * Gets the status of the current game
   *
   * @param    request  $request containing the game id
   * @return \Illuminate\Http\Response
   *
   */
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
        $game->player2Board = NULL;
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
        $game->player1Board = NULL;
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

  /**
   *
   * Gets board and turn updates
   *
   * @param    request  $request containing the game id
   * @return \Illuminate\Http\Response
   *
   */
  public function getGameUpdates(Request $request){
    $this->validate($request, [

      'id' => 'required|numeric',

    ]);

    $game = Game::where('id', $request['id'])->first();
    $user = Auth::user();

    if($game->player1Id === $user->id){

      $playerBoard = $game->player1Board;

    }else if($game->player2Id === $user->id){
      $playerBoard = $game->player2Board;
    }

    return response()->json([
        'success'  => true,
        'board' => $playerBoard,
        'turn' => $game->playerTurn,
    ]);

  }

  /**
   *
   * Checks the game to see if there is a winner
   *
   * @param    request  $request containing the game id
   * @return \Illuminate\Http\Response
   *
   */
  public function checkWinner(Request $request){
    $this->validate($request, [

      'id' => 'required|numeric',

    ]);

    $game = Game::where('id', $request['id'])->first();
    $user = Auth::user();

    if($game->winner === $user->id){

      return response()->json([
          'success'  => true,
          'message' => "You've won the game!",
          'winner' => true,
      ]);

    }else if($game->winner !== $user->id && $game->winner != NULL){
      return response()->json([
          'success'  => true,
          'message' => "You lost. Better luck next time.",
          'winner' => false,

      ]);
    }

    return response()->json([
        'success'  => false,
    ]);

  }


  /**
   *
   * plays a move on the opponents board
   *
   * @param    request  $request containing the game id, x coord and y coord
   * @return \Illuminate\Http\Response
   *
   */
  public function checkOpponentHit(Request $request)
  {

    $this->validate($request, [

      'id' => 'required|numeric',
      'y' => 'required|numeric',
      'x' => 'required|numeric',


    ]);

    $game = Game::where('id', $request['id'])->first();
    $user = Auth::user();

    if($game->playerTurn !== $user->id){
      return response()->json([
          'success'  => false,
          'message'  => 'Not your turn.',
      ]);
    }

    $retval = "";
    $legal = true;

    if($game->player1Id === $user->id){

      $opponentBoard = json_decode($game->player2Board, true);
      $retval = $opponentBoard[ $request['y'] ][ $request['x'] ];

      if($retval === "X"){
        $opponentBoard[ $request['y'] ][ $request['x'] ] = "1";
      }else if($retval === "0"){
        $opponentBoard[ $request['y'] ][ $request['x'] ] = "!";
      }else{
        $legal = false;
      }

      if($legal){
        $game->player2Board = json_encode($opponentBoard);
        $game->playerTurn = $game->player2Id;
        $game->save();
      }

    }else if($game->player2Id === $user->id){

      $opponentBoard = json_decode($game->player1Board, true);
      $retval = $opponentBoard[ $request['y'] ][ $request['x'] ];

      if($retval === "X"){
        $opponentBoard[ $request['y'] ][ $request['x'] ] = "1";
      }else if($retval === "0"){
        $opponentBoard[ $request['y'] ][ $request['x'] ] = "!";
      }else{
        $legal = false;
      }

      if($legal){
        $game->player1Board = json_encode($opponentBoard);
        $game->playerTurn = $game->player1Id;
        $game->save();
      }

    }

    $opponentHits = $this->countHits($opponentBoard);

    if($opponentHits == 17){
      $game->playerTurn = null;
      $game->winner = $user->id;
      $game->status = "FINISHED";
      $game->save();
    }

    return response()->json([
        'success'  => true,
        'shot' => $retval,
        'hits' => $opponentHits,
    ]);

  }

  /**
   *
   * checks win condition
   *
   * @param    checkBoard  $checkBoard array
   * @return   number of hits
   *
   */
  public function countHits($checkBoard){
    $count = 0;
    $hitMarker = "1";
    foreach($checkBoard as $row){
      foreach($row as $square){
        if($square === $hitMarker){
          $count++;
        }
      }
    }
    return $count;
  }

  /**
   *
   * checks number of Xs representing ships
   *
   * @param    checkBoard  $checkBoard array
   * @return   number of ship squares
   *
   */
  public function countShips($checkBoard){
    $count = 0;
    $hitMarker = "X";
    foreach($checkBoard as $row){
      foreach($row as $square){
        if($square === $hitMarker){
          $count++;
        }
      }
    }
    return $count;
  }

  /**
   *
   * static function to print own board html
   *
   *
   */
  public static function printOwnBoard(){

    $height = 40;
    $width = 40;
    $fill = "#39aac1";
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

  /**
   *
   * static function to print opponent board html
   *
   *
   */
  public static function printOpponentBoard(){

    $height = 40;
    $width = 40;
    $fill = "#39aac1";
    $stroke = "blue";
    $strokeWidth = 1;

    $board = "";

    for($i = 0; $i<10;$i++){

      for($j = 0; $j<10;$j++){

        $horizOffset = $width*$i;
        $vertOffset = $height*$j;

        $board .= "<rect id = 'opponent_square_{$i}_{$j}' data-xcoord='{$i}' data-ycoord='{$j}' x='{$horizOffset}' y='{$vertOffset}' height='{$height}' width='{$width}' fill='{$fill}' stroke='{$stroke}' stroke-width='{$strokeWidth}'></rect>";

      }

    }

    print $board;

  }

  /**
   *
   * static function to randomize own board
   *
   *
   */
  public static function randomizeBoard(){

    $shipLengths = array(2,3,3,4,5);
    shuffle($shipLengths);

    $shipOrientations = array();

    for($i = 0; $i<sizeOf($shipLengths);$i++){

      if(rand(0,1) == 0){
        $shipOrientations[] = "H";
      }else{
        $shipOrientations[] = "V";
      }

    }
    shuffle($shipOrientations);

    $pieces = "";

    for($i = 0; $i<sizeOf($shipLengths);$i++){

      $pieces .= GameController::getLegalPosition($i, $shipLengths[$i], $shipOrientations[$i], $positions);

    }

    print $pieces;

  }

  /**
   *
   * static place ships in random spots
   *
   *
   */
  public static function getLegalPosition($idx, $length, $orientation, &$positions){

    $height = 40;
    $width = 40;
    $fill = "grey";
    $stroke = "black";
    $strokeWidth = 0;

    if($orientation === "H"){

      $horizOffset = rand ( 0 , (9-$length) );
      $vertOffset = rand ( 0 , 9 );

      $thisPositions = array();
      for($j = 0; $j<$length;$j++){
        $thisPositions[$horizOffset+$j] = $vertOffset;
        if($idx == 0){
          $positions[$vertOffset][$horizOffset+$j] = "X";
        }
      }

      $horizOffsetWidth = $horizOffset*$width;
      $vertOffsetHeight = $vertOffset*$height;
      $shipWidth = $width*$length;

      if($idx == 0){

        return "<rect id = 'ship_{$idx}' class = 'gamepiece boat_{$length}' data-xcoord='{$horizOffset}' data-ycoord='{$vertOffset}' data-orientation='{$orientation}' data-length='{$length}' x='{$horizOffsetWidth}' y='{$vertOffsetHeight}' height='{$height}' width='{$shipWidth}' fill='url(#boat_{$length}_{$orientation})' stroke='{$stroke}' stroke-width='{$strokeWidth}'></rect>";

      }else{

        $legal = GameController::checkLegal($thisPositions, $positions, $orientation);
        if($legal){
          for($j = 0; $j<$length;$j++){
            $positions[$vertOffset][$horizOffset+$j] = "X";
          }

          return "<rect id = 'ship_{$idx}' class = 'gamepiece' data-xcoord='{$horizOffset}' data-ycoord='{$vertOffset}' data-orientation='{$orientation}' data-length='{$length}' x='{$horizOffsetWidth}' y='{$vertOffsetHeight}' height='{$height}' width='{$shipWidth}' fill='url(#boat_{$length}_{$orientation})' stroke='{$stroke}' stroke-width='{$strokeWidth}'></rect>";
        }else{
          return GameController::getLegalPosition($idx, $length, $orientation, $positions);
        }

      }

    }else if($orientation === "V"){

      $horizOffset = rand ( 0 , 9 );
      $vertOffset = rand ( 0 , (9-$length));
      for($j = 0; $j<$length;$j++){
        $thisPositions[$vertOffset+$j] = $horizOffset;
        if($idx == 0){
          $positions[$vertOffset+$j][$horizOffset] = "X";
        }

      }

      $horizOffsetWidth = $horizOffset*$width;
      $vertOffsetHeight = $vertOffset*$height;

      $shipHeight = $height*$length;
      if($idx == 0){

        return "<rect id = 'ship_{$idx}' class = 'gamepiece' data-xcoord='{$horizOffset}' data-ycoord='{$vertOffset}' data-orientation='{$orientation}' data-length='{$length}' x='{$horizOffsetWidth}' y='{$vertOffsetHeight}' height='{$shipHeight}' width='{$width}' fill='url(#boat_{$length}_{$orientation})' stroke='{$stroke}' stroke-width='{$strokeWidth}'></rect>";

      }else{

        $legal = GameController::checkLegal($thisPositions, $positions, $orientation);
        if($legal){
          for($j = 0; $j<$length;$j++){
            $positions[$vertOffset+$j][$horizOffset] = "X";
          }
          return "<rect id = 'ship_{$idx}' class = 'gamepiece' data-xcoord='{$horizOffset}' data-ycoord='{$vertOffset}' data-orientation='{$orientation}' data-length='{$length}' x='{$horizOffsetWidth}' y='{$vertOffsetHeight}' height='{$shipHeight}' width='{$width}' fill='url(#boat_{$length}_{$orientation})' stroke='{$stroke}' stroke-width='{$strokeWidth}'></rect>";
        }else{
          return GameController::getLegalPosition($idx, $length, $orientation, $positions);
        }

      }

    }

  }

  /**
   *
   * debugging function
   *
   *
   */
  public static function printPositions(&$positions){
    for($k = 0; $k < sizeOf($positions); $k++){
      foreach($positions[$k] as $key => $val){
          echo ' ' . $val;
      }
      print '<br>';
    }
  }

  /**
   *
   * static function to check if a random ship placement is legal
   *
   *
   */
  public static function checkLegal($thisPositions, &$positions, $orientation){
    $legal = true;
    foreach($thisPositions as $key => $value){
      if($orientation === "H"){
        $temp = $key;
        $key = $value;
        $value = $temp;
      }
      if(isset($positions[$key][$value]) && $positions[$key][$value] === 'X'){
        $legal = false;
      }else if(isset($positions[$key][$value+1]) && $positions[$key][$value+1] === 'X'){
        $legal = false;
      }else if(isset($positions[$key][$value-1]) && $positions[$key][$value-1] === 'X'){
        $legal = false;
      }else if(isset($positions[$key+1][$value]) && $positions[$key+1][$value] === 'X'){
        $legal = false;
      }else if(isset($positions[$key+1][$value+1]) && $positions[$key+1][$value+1] === 'X'){
        $legal = false;
      }else if(isset($positions[$key+1][$value-1]) && $positions[$key+1][$value-1] === 'X'){
        $legal = false;
      }else if(isset($positions[$key-1][$value]) && $positions[$key-1][$value] === 'X'){
        $legal = false;
      }else if(isset($positions[$key-1][$value-1]) && $positions[$key-1][$value-1] === 'X'){
        $legal = false;
      }else if(isset($positions[$key-1][$value+1]) && $positions[$key-1][$value+1] === 'X'){
        $legal = false;
      }
    }
    return $legal;
  }

}
