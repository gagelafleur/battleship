@extends('layouts.app')

@section('content')
<?php use \App\Http\Controllers\GameController; ?>

<div class="container">
  <div class="row">
    <div class="col-md-12">
      <div class="panel panel-default px-3">
        <div class="panel-heading">

          Gameplay Status: <span class="status">SETUP</span>
          <div class="turn">
            <span id="turn-indicator"></span> Turn
          </div>
          <div class='opponent'>
            Opponent: <span class="opponent-name"></span>
          </div>


        </div>

        <div class="panel-body">
          @if (session('status'))
          <div class="alert alert-success">
            {{ session('status') }}
          </div>
          @endif

          <div class="instruct">

            <ul>
              <li>Drag and drop the ships on your board into the positions you'd like to play them in.</li>
              <li>You may press shift while dragging a ship to rotate it 90 degrees.</li>
              <li>Once you are satisfied with your board's setup, click the "Start Game" button below to locate and opponent.</li>
            </ul>

          </div>

          <div class="board">
            <div class="board-indentity">
              <strong>Your Board</strong>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="400px" height="400px" fill="#2e889a">

              <!-- ship graphics from https://graphicriver.net/item/top-aerial-view-boat-and-ocean-ships-vector-set/20232052 -->
              <defs>
                <pattern id="boat_2_H" width="1" height="1">
                  <image xlink:href="img/dingy_H.svg" x="0" y="0" width="80" height="40" />
                </pattern>
                <pattern id="boat_2_V" width="1" height="1">
                  <image xlink:href="img/dingy_V.svg" x="0" y="0" width="40" height="80" />
                </pattern>
                <pattern id="boat_3_H" width="1" height="1">
                  <image xlink:href="img/speedboat_H.svg" x="0" y="0" width="120" height="40" />
                </pattern>
                <pattern id="boat_3_V" width="1" height="1">
                  <image xlink:href="img/speedboat_V.svg" x="0" y="0" width="40" height="120" />
                </pattern>
                <pattern id="boat_4_H" width="1" height="1">
                  <image xlink:href="img/yacht_H.svg" x="0" y="0" width="160" height="40" />
                </pattern>
                <pattern id="boat_4_V" width="1" height="1">
                  <image xlink:href="img/yacht_V.svg" x="0" y="0" width="40" height="160" />
                </pattern>
                <pattern id="boat_5_H" width="1" height="1">
                  <image xlink:href="img/carrier_H.svg" x="0" y="0" width="200" height="40" />
                </pattern>
                <pattern id="boat_5_V" width="1" height="1">
                  <image xlink:href="img/carrier_V.svg" x="0" y="0" width="40" height="200" />
                </pattern>
              </defs>

              {{ GameController::printOwnBoard() }}

              {{ GameController::randomizeBoard() }}


            </svg><br />

          </div>

          <div class="opponent-board" id="opponent-board">
            <div class="board-indentity">
              <strong>Opponent's Board</strong>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="400px" height="400px">

              {{ GameController::printOpponentBoard() }}

            </svg>
          </div>

          <div style="clear:both"></div>

          <div class="below-board">

            <div>
              <form id="starter" method="POST">
                <input type="hidden" name="_token" value="{{ csrf_token() }}" />
                <input type="hidden" name="board" value="" />
                <input type="submit" class="btn  btn-success" name="Start" value="Start Game" />
              </form>
            </div>

            <div class="chat-container">

              <div class="messages">

              </div>

              <div>
                <form id="chat" method="POST">
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
    </div>
  </div>
</div>
@endsection
