<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Vol;
use Illuminate\Http\Request;

class AdminReservationController extends Controller
{
    // SUPPRIME le constructeur avec middleware()
    
    // Lister toutes les réservations
    public function index(Request $request)
    {
        $query = Reservation::with(['user', 'vol', 'passagers']);

        if ($request->has('vol_id')) {
            $query->where('vol_id', $request->vol_id);
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $reservations = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($reservations);
    }

    // Voir les détails d'une réservation
    public function show($id)
    {
        $reservation = Reservation::with(['user', 'vol', 'passagers', 'sieges'])
            ->findOrFail($id);

        return response()->json($reservation);
    }

    // Modifier une réservation
    public function update(Request $request, $id)
    {
        $reservation = Reservation::findOrFail($id);

        $request->validate([
            'statut' => 'sometimes|in:confirme,annule,en_attente,complete'
        ]);

        $reservation->update($request->all());

        return response()->json($reservation);
    }

    // Annuler une réservation (admin)
    public function annuler($id)
    {
        $reservation = Reservation::with(['vol', 'sieges'])->findOrFail($id);

        // Logique d'annulation avec remboursement si nécessaire
        // ...

        $reservation->statut = 'annule';
        $reservation->save();

        return response()->json(['message' => 'Réservation annulée']);
    }
}