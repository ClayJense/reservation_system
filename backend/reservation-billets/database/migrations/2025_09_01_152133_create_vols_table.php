<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vols', function (Blueprint $table) {
            $table->id();
            $table->string('code_vol')->unique();
            $table->string('ville_depart');
            $table->string('ville_arrivee');
            $table->date('date_depart');
            $table->time('heure_depart');
            $table->date('date_arrivee');
            $table->time('heure_arrivee');
            $table->string('type_avion');
            $table->integer('nombre_total_places');
            $table->integer('nombre_places_disponibles');
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vols');
    }
};
