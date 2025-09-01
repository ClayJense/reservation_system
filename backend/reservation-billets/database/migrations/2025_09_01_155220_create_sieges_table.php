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
        Schema::create('sieges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vol_id')->constrained('vols')->onDelete('cascade');
            $table->string('numero_siege');
            $table->enum('classe', ['eco', 'affaires', 'premiere'])->default('eco');
            $table->enum('statut', ['libre', 'reserve', 'reserve_temporairement'])->default('libre');
            $table->foreignId('reservation_id')->nullable()->constrained('reservations')->onDelete('set null');
            $table->timestamps();
            
            // Assure l'unicité du numéro de siège par vol
            $table->unique(['vol_id', 'numero_siege']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sieges');
    }
};