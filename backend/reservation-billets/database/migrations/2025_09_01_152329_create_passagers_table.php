<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('passagers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained()->onDelete('cascade');
            $table->string('nom');
            $table->string('prenom');
            $table->date('date_naissance');
            $table->enum('type_passager', ['adulte', 'enfant', 'bebe'])->default('adulte');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('passagers');
    }
};
