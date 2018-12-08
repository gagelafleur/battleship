<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('home');
});

Auth::routes();

Route::group(['middleware' => 'auth', 'prefix' => 'admin'], function() {
    \Aschmelyun\Larametrics\Larametrics::routes();
});

Route::get('/home', 'HomeController@index')->name('home');
Route::group(['middleware' => 'web'], function () {
  Route::get('/play', [

      'uses' => 'GameController@index',
      'as' => 'game.play'

  ]);

  Route::post('/findGame', [

      'uses' => 'GameController@startGame'

  ]);

  Route::post('/forfeitGame', [

      'uses' => 'GameController@forfeitGame'

  ]);

  Route::post('/sendMessage', [

      'uses' => 'GameController@sendMessage'

  ]);

  Route::post('/getMessages', [

      'uses' => 'GameController@getMessages'

  ]);

  Route::post('/getGameStatus', [

      'uses' => 'GameController@getGameStatus'

  ]);

  Route::post('/getGameUpdates', [

      'uses' => 'GameController@getGameUpdates'

  ]);

  Route::post('/checkOpponentHit', [

      'uses' => 'GameController@checkOpponentHit'

  ]);

  /*Route::post('/randomize', [

      'uses' => 'GameController@randomizeBoardAjax'

  ]);*/



});
