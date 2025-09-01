<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'vol_id',
        'nombre_passagers',
        'statut',
    ];

    // Relation : une réservation appartient à un utilisateur
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relation : une réservation appartient à un vol
    public function vol()
    {
        return $this->belongsTo(Vol::class);
    }

    // Relation : une réservation peut avoir plusieurs passagers
    public function passagers()
    {
        return $this->hasMany(Passager::class);
    }
}
