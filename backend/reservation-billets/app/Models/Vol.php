<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vol extends Model
{
    use HasFactory;

    protected $fillable = [
        'code_vol',
        'ville_depart',
        'ville_arrivee',
        'date_depart',
        'heure_depart',
        'date_arrivee',
        'heure_arrivee',
        'type_avion',
        'nombre_total_places',
        'nombre_places_disponibles',
    ];

    // Relation : un vol peut avoir plusieurs réservations
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // Relation : un vol peut avoir plusieurs sièges (AJOUTE CETTE RELATION)
    public function sieges()
    {
        return $this->hasMany(Siege::class);
    }

    
}