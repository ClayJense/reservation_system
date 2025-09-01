<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens; // AJOUTE CETTE LIGNE

class User extends Authenticatable
{
    use HasApiTokens, HasFactory; // AJOUTE HasApiTokens ici

    protected $fillable = [
        'nom',
        'email',
        'mot_de_passe',
        'role',
    ];

    protected $hidden = [
        'mot_de_passe',
    ];

    // Relation : un utilisateur peut avoir plusieurs réservations
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // Pour l'authentification, on doit dire à Laravel quel champ utiliser comme mot de passe
    public function getAuthPassword()
    {
        return $this->mot_de_passe;
    }

    // Méthode pour vérifier si l'utilisateur est admin
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    // Méthode pour vérifier si l'utilisateur est client
    public function isClient()
    {
        return $this->role === 'client';
    }
}