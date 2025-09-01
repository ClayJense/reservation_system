<?php

namespace App\Http\Controllers;

use App\Models\Vol;
use App\Models\Reservation;
use App\Models\Passager;
use App\Models\Siege; // AJOUTE CETTE LIGNE
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class VolController extends Controller
{
    // Recherche de vols
    public function rechercherVols(Request $request)
    {
        $request->validate([
            'ville_depart' => 'required|string',
            'ville_arrivee' => 'required|string',
            'date_depart' => 'required|date',
            'date_retour' => 'nullable|date|after_or_equal:date_depart',
            'adultes' => 'required|integer|min:1',
            'enfants' => 'integer|min:0',
            'bebes' => 'integer|min:0',
            'classe' => 'nullable|in:eco,affaires,premiere'
        ]);

        $volsAller = Vol::where('ville_depart', $request->ville_depart)
            ->where('ville_arrivee', $request->ville_arrivee)
            ->whereDate('date_depart', $request->date_depart)
            ->where('nombre_places_disponibles', '>=', $request->adultes + $request->enfants)
            ->get();

        $volsRetour = [];
        if ($request->date_retour) {
            $volsRetour = Vol::where('ville_depart', $request->ville_arrivee)
                ->where('ville_arrivee', $request->ville_depart)
                ->whereDate('date_depart', $request->date_retour)
                ->where('nombre_places_disponibles', '>=', $request->adultes + $request->enfants)
                ->get();
        }

        return response()->json([
            'vols_aller' => $volsAller,
            'vols_retour' => $volsRetour
        ]);
    }

    // Détails d'un vol
    public function detailsVol($id)
    {
        $vol = Vol::with(['sieges' => function($query) {
            $query->where('statut', 'libre');
        }])->findOrFail($id);

        return response()->json($vol);
    }

    // Sélection des sièges
    public function selectionSieges(Request $request, $volId)
    {
        $request->validate([
            'sieges' => 'required|array',
            'sieges.*.numero_siege' => 'required|string',
            'sieges.*.classe' => 'required|in:eco,affaires,premiere'
        ]);

        $vol = Vol::findOrFail($volId);

        foreach ($request->sieges as $siegeData) {
            $siege = Siege::where('vol_id', $volId)
                ->where('numero_siege', $siegeData['numero_siege'])
                ->where('classe', $siegeData['classe'])
                ->where('statut', 'libre')
                ->firstOrFail();

            $siege->statut = 'reserve_temporairement';
            $siege->save();
        }

        return response()->json(['message' => 'Sièges réservés temporairement']);
    }

    // Nouvelle méthode pour obtenir les sièges disponibles d'un vol
public function getSiegesDisponibles($volId)
{
    $sieges = Siege::where('vol_id', $volId)
                   ->where('statut', 'libre')
                   ->get();

    return response()->json($sieges);
}
}