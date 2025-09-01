<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Passager;
use App\Models\Vol;
use App\Models\Siege;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\ConfirmationReservation;

class ReservationController extends Controller
{
    // Créer une réservation
    public function creerReservation(Request $request)
    {
        $request->validate([
            'vol_id' => 'required|exists:vols,id',
            'vol_retour_id' => 'nullable|exists:vols,id',
            'passagers' => 'required|array',
            'passagers.*.nom' => 'required|string',
            'passagers.*.prenom' => 'required|string',
            'passagers.*.date_naissance' => 'required|date',
            'passagers.*.type_passager' => 'required|in:adulte,enfant,bebe',
            'sieges' => 'required|array',
            'options.bagages' => 'nullable|boolean',
            'options.repas' => 'nullable|boolean',
            'options.assurance' => 'nullable|boolean'
        ]);

        $vol = Vol::findOrFail($request->vol_id);
        
        // Vérifier la disponibilité
        if ($vol->nombre_places_disponibles < count($request->passagers)) {
            return response()->json(['error' => 'Places insuffisantes'], 400);
        }

        $reservation = Reservation::create([
            'user_id' => Auth::id(),
            'vol_id' => $request->vol_id,
            'nombre_passagers' => count($request->passagers),
            'statut' => 'en_attente_paiement',
            'options' => json_encode($request->options ?? [])
        ]);

        // Créer les passagers
        foreach ($request->passagers as $passagerData) {
            Passager::create([
                'reservation_id' => $reservation->id,
                'nom' => $passagerData['nom'],
                'prenom' => $passagerData['prenom'],
                'date_naissance' => $passagerData['date_naissance'],
                'type_passager' => $passagerData['type_passager']
            ]);
        }

        // Réserver les sièges
        foreach ($request->sieges as $siegeData) {
            $siege = Siege::where('vol_id', $request->vol_id)
                ->where('numero_siege', $siegeData['numero_siege'])
                ->firstOrFail();
                
            $siege->statut = 'reserve';
            $siege->reservation_id = $reservation->id;
            $siege->save();
        }

        // Mettre à jour les places disponibles
        $vol->nombre_places_disponibles -= count($request->passagers);
        $vol->save();

        return response()->json([
            'reservation_id' => $reservation->id,
            'message' => 'Réservation créée avec succès'
        ]);
    }

    // Paiement
    public function proceserPaiement(Request $request, $reservationId)
    {
        $reservation = Reservation::where('user_id', Auth::id())
            ->findOrFail($reservationId);

        // Logique de paiement (intégration Stripe/autres)
        // ...

        $reservation->statut = 'confirme';
        $reservation->save();

        // Envoyer email de confirmation
        Mail::to(Auth::user()->email)->send(new ConfirmationReservation($reservation));

        return response()->json(['message' => 'Paiement traité avec succès']);
    }

    // Historique des réservations
    public function historique()
    {
        $reservations = Reservation::with(['vol', 'passagers'])
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reservations);
    }

    // Annuler une réservation
    public function annulerReservation($id)
    {
        $reservation = Reservation::with(['vol', 'sieges'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        // Libérer les sièges
        foreach ($reservation->sieges as $siege) {
            $siege->statut = 'libre';
            $siege->reservation_id = null;
            $siege->save();
        }

        // Libérer les places
        $reservation->vol->nombre_places_disponibles += $reservation->nombre_passagers;
        $reservation->vol->save();

        $reservation->statut = 'annule';
        $reservation->save();

        return response()->json(['message' => 'Réservation annulée']);
    }
}