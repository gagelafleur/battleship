@extends('layouts.app')

@section('content')

<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="panel panel-default">
                <div class="panel-heading">Gameplay</div>

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
