<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Auth;
use App\User;
use App\Game;

class HomeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
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

      $user->wins = Game::where('winner','=',$user->id)->orderBy('updated_at', 'desc')->count();

      $user->losses = Game::where('status','=','FINISHED')->where('winner','!=',$user->id)->where(function($query) use ($user){
          return $query
          ->where('player1Id', '=', $user->id)
          ->orWhere('player2Id', '=', $user->id);
      })->count();

      //where('player1Id', '=', $user->id)->orWhere('player2Id', '=', $user->id)->count();

      $games = Game::where('status','=','FINISHED')->where('player1Id', '=', $user->id)->orWhere('player2Id', '=', $user->id)->orderBy('updated_at', 'desc')->get();

      foreach($games as $index => $game){

        if($game->status !== "FINISHED"){
          unset($games[$index]);
        }

        if($game->winner !== NULL && $user->id === $game->winner){
          $game->result = "WIN";
        }else if($game->winner !== NULL && $user->id !== $game->winner){
          $game->result = "LOSS";
        }

        if($game->player1Id !== NULL && $user->id === $game->player1Id){
          $game->opponent = User::where('id','=',$game->player2Id)->first()->name;
        }else if($game->player2Id !== NULL && $user->id === $game->player2Id){
          $game->opponent = User::where('id','=',$game->player1Id)->first()->name;
        }

      }

      return view('home',['user' => $user, 'games' => $games]);
    }
}
