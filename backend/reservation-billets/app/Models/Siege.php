<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Siege extends Model
{
    use HasFactory;

    protected $fillable = [
        'vol_id',
        'numero_siege',
        'classe',
        'statut',
        'reservation_id'
    ];

    // Relation : un siège appartient à un vol
    public function vol()
    {
        return $this->belongsTo(Vol::class);
    }

    // Relation : un siège peut appartenir à une réservation
    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }
}