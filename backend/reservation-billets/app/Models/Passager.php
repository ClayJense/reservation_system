<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Passager extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'nom',
        'prenom',
        'date_naissance',
        'type_passager',
    ];

    // Relation : un passager appartient à une réservation
    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }
}
