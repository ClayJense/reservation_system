<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Vol;
use App\Models\Siege;
use Illuminate\Http\Request;

class AdminVolController extends Controller
{
    // SUPPRIME le constructeur avec middleware()
    // Les middlewares sont déjà appliqués dans les routes
    
    // Lister tous les vols
    public function index(Request $request)
    {
        $query = Vol::withCount('reservations');

        if ($request->has('date_depart')) {
            $query->whereDate('date_depart', $request->date_depart);
        }

        if ($request->has('ville_depart')) {
            $query->where('ville_depart', 'like', '%' . $request->ville_depart . '%');
        }

        $vols = $query->orderBy('date_depart', 'desc')->paginate(20);

        return response()->json($vols);
    }

    // Créer un nouveau vol
    public function store(Request $request)
{
    $request->validate([
        'code_vol' => 'required|unique:vols',
        'ville_depart' => 'required|string',
        'ville_arrivee' => 'required|string',
        'date_depart' => 'required|date',
        'heure_depart' => 'required',
        'date_arrivee' => 'required|date',
        'heure_arrivee' => 'required',
        'type_avion' => 'required|string',
        'nombre_total_places' => 'required|integer|min:1',
        'classes' => 'required|array'
    ]);

    // Crée le vol avec le nombre de places disponibles égal au nombre total
    $vol = Vol::create([
        'code_vol' => $request->code_vol,
        'ville_depart' => $request->ville_depart,
        'ville_arrivee' => $request->ville_arrivee,
        'date_depart' => $request->date_depart,
        'heure_depart' => $request->heure_depart,
        'date_arrivee' => $request->date_arrivee,
        'heure_arrivee' => $request->heure_arrivee,
        'type_avion' => $request->type_avion,
        'nombre_total_places' => $request->nombre_total_places,
        'nombre_places_disponibles' => $request->nombre_total_places // Ajoute cette ligne
    ]);

    // Créer les sièges
    $this->creerSieges($vol, $request->classes);

    return response()->json($vol, 201);
}

    private function creerSieges(Vol $vol, array $classes)
    {
        $sieges = [];
        
        foreach ($classes as $classe => $nombre) {
            for ($i = 1; $i <= $nombre; $i++) {
                $sieges[] = [
                    'vol_id' => $vol->id,
                    'numero_siege' => $classe . '-' . $i,
                    'classe' => $classe,
                    'statut' => 'libre',
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }
        }

        Siege::insert($sieges);
    }

    // Voir les détails d'un vol
    public function show($id)
    {
        $vol = Vol::with(['sieges', 'reservations'])->findOrFail($id);
        return response()->json($vol);
    }

    // Mettre à jour un vol
    public function update(Request $request, $id)
    {
        $vol = Vol::findOrFail($id);

        $request->validate([
            'ville_depart' => 'sometimes|required|string',
            'ville_arrivee' => 'sometimes|required|string',
            'date_depart' => 'sometimes|required|date',
            'heure_depart' => 'sometimes|required',
            // ... autres validations
        ]);

        $vol->update($request->all());

        return response()->json($vol);
    }

    // Supprimer un vol
    public function destroy($id)
    {
        $vol = Vol::findOrFail($id);
        
        // Vérifier s'il y a des réservations
        if ($vol->reservations()->count() > 0) {
            return response()->json(['error' => 'Impossible de supprimer un vol avec des réservations'], 400);
        }

        $vol->delete();

        return response()->json(['message' => 'Vol supprimé']);
    }

    // Statistiques
    public function statistiques()
    {
        $stats = [
            'total_vols' => Vol::count(),
            'vols_ce_mois' => Vol::whereMonth('date_depart', now()->month)->count(),
            'taux_occupation' => $this->calculerTauxOccupation(),
            'revenus_mensuels' => $this->calculerRevenusMensuels()
        ];

        return response()->json($stats);
    }

    private function calculerTauxOccupation()
    {
        $totalPlaces = Vol::sum('nombre_total_places');
        $placesOccupees = Vol::sum('nombre_total_places') - Vol::sum('nombre_places_disponibles');
        
        return $totalPlaces > 0 ? ($placesOccupees / $totalPlaces) * 100 : 0;
    }

    private function calculerRevenusMensuels()
    {
        // Logique de calcul des revenus (à adapter)
        return 0;
    }
}