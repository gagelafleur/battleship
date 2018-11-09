<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Game;
use Carbon\Carbon;

class TruncateOldGames extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'game:truncate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete abandoned games after an hour with no activity';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
      Game::where('updated_at', '<', Carbon::now()->subMinutes(30)->toDateTimeString())->where('status','=','ABANDONED')->each(function ($game) {
        $game->delete();
      });
    }
}
