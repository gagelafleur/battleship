@extends('layouts.app')

@section('content')
<?php use \App\Http\Controllers\GameController; ?>

<div class="container">
    <div class="row">
        <div class="col-md-12">
            <div class="panel panel-default">
                <div class="panel-heading">

                  Gameplay Status: <span class = "status">SETUP</span>
                  <div class = 'opponent'>
                    Opponent: <span class = "opponent-name"></span>
                  </div>


                </div>

                <div class = "board">
                  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="400px" height="400px">

                    <defs>

                    </defs>

                    {{ GameController::printOwnBoard() }}

                  </svg>
                </div>

                <div class = "opponent-board">
                  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="400px" height="400px">

                    <defs>

                    </defs>

                    {{ GameController::printOpponentBoard() }}

                  </svg>
                </div>

                <div>
                  <form id = "starter" method="POST">
                    <input type="hidden" name="_token" value="{{ csrf_token() }}" />
                    <input type="submit" name="Start" value="Start Game" />
                  </form>
                </div>

                <div class="panel-body">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif
                </div>

                <div class = "messages">

                </div>

                <div>
                  <form id = "chat" method="POST">
                    <input type="text" name="chat" />
                    <input type="hidden" name="_token" value="{{ csrf_token() }}" />
                    <input type="hidden" name="gameId" value="" />
                    <input type="submit" name="Submit" value="Send" />
                  </form>
                </div>

            </div>
        </div>
    </div>
</div>
@endsection
