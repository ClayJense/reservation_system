<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VolController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\Admin\AdminVolController;
use App\Http\Controllers\Admin\AdminReservationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SiegeController;   

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Routes d'authentification
Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'login']);

// Routes publiques (sans authentification)
Route::post('/rechercher-vols', [VolController::class, 'rechercherVols']);
Route::get('/vols/{id}', [VolController::class, 'detailsVol']);
Route::get('/vols/{volId}/sieges', [VolController::class, 'getSiegesDisponibles']);

// Routes authentifiées (utilisateurs connectés)
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/profile', [UserController::class, 'profile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);

    // Réservations
    Route::post('/reservations', [ReservationController::class, 'creerReservation']);
    Route::post('/reservations/{id}/paiement', [ReservationController::class, 'proceserPaiement']);
    Route::get('/reservations/historique', [ReservationController::class, 'historique']);
    Route::get('/reservations/{id}', [ReservationController::class, 'show']);
    Route::delete('/reservations/{id}', [ReservationController::class, 'annulerReservation']);
    
    // Sélection sièges
    Route::post('/vols/{volId}/selection-sieges', [VolController::class, 'selectionSieges']);
});

// Routes administrateur
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Gestion vols
    Route::get('/vols', [AdminVolController::class, 'index']);
    Route::post('/vols', [AdminVolController::class, 'store']);
    Route::get('/vols/{id}', [AdminVolController::class, 'show']);
    Route::put('/vols/{id}', [AdminVolController::class, 'update']);
    Route::delete('/vols/{id}', [AdminVolController::class, 'destroy']);
    Route::get('/vols/statistiques', [AdminVolController::class, 'statistiques']);
    
    // Gestion réservations
    Route::get('/reservations', [AdminReservationController::class, 'index']);
    Route::get('/reservations/{id}', [AdminReservationController::class, 'show']);
    Route::put('/reservations/{id}', [AdminReservationController::class, 'update']);
    Route::delete('/reservations/{id}/annuler', [AdminReservationController::class, 'annuler']);
});

// Route de test
Route::get('/test', function () {
    return response()->json(['message' => 'API fonctionne!']);
});



