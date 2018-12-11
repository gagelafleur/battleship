@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="panel panel-default">
                <div class="panel-heading">Dashboard</div>

                <div class="panel-body">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif

                    @if (Auth::check())

                      <a href = "{{route('game.play')}}" class = "btn  btn-success">Play a Game</a><br /><br /><br />

                      <p><strong>Record</strong> - Wins: {{$user->wins}} - Losses: {{$user->losses}}</p>

                      <div class="table-responsive">
                        <table id="example" class="display dt-responsive table-responsive nowrap" cellspacing="0" width="100%">
                          <thead>
                            <tr>
                              <th>
                                Date
                              </th>
                              <th>
                                Oppenent
                              </th>
                              <th>
                                Result
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                          @foreach($games as $game)

                            <tr>
                              <td>
                                {{$game->updated_at}}
                              </td>
                              <td>
                                {{$game->opponent}}
                              </td>
                              <td>
                                {{$game->result}}
                              </td>
                            </tr>

                          @endforeach
                          </tbody>
                        </table>
                      </div>
                    @else
                      Please <a href="{{ route('login') }}">Login</a> or <a href="{{ route('register') }}">Register</a>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
