<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddBoardsTurnToGame extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
      Schema::table('games', function($table) {
        $table->json('player1Board')->nullable()->default(NULL);
        $table->json('player2Board')->nullable()->default(NULL);
        $table->integer('playerTurn')->nullable()->default(NULL);
      });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
