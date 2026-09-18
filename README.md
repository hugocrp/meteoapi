# TP1 — API Météo

API qui reçoit une adresse postale en `GET` et renvoie les prévisions météo du
lieu, en enchaînant deux services externes :

- **Géocodage** : [Nominatim](https://nominatim.openstreetmap.org) (adresse → latitude/longitude)
- **Météo** : [Open-Meteo](https://api.open-meteo.com) (latitude/longitude → prévisions horaires)

## Lancer le projet

```bash
npm install
npm run dev
```

```
GET http://localhost:3000/forecast?address=Alès
```

## Tests

```bash
npm test          # unitaires + end-to-end
npm run test:unit
npm run test:e2e
```

## Architecture

Architecture en couches, chaque couche ne dépendant que d'**abstractions**
(interfaces) fournies par la couche du dessous, jamais d'implémentations
concrètes — cf. cours J1 sur le couplage, l'IoC et la DI.

```
src/
  domain/types.ts                 Types métier + erreurs (Coordinates, Forecast, ...)
  di/tokens.ts                    Jetons d'injection tsyringe (Symbol) pour
                                   les dépendances typées par interface
  http/
    HttpClient.ts                 Interface : abstraction du transport HTTP
    FetchHttpClient.ts            Seule implémentation concrète (fetch), @injectable()
  services/
    GeocodingService.ts           Interface géocodage
    NominatimGeocodingService.ts  Implémentation Nominatim, @injectable()
                                   (dépend de HttpClient via @inject(HTTP_CLIENT))
    WeatherService.ts             Interface météo
    OpenMeteoWeatherService.ts    Implémentation Open-Meteo, @injectable()
                                   (dépend de HttpClient via @inject(HTTP_CLIENT))
    ForecastService.ts            Couche métier, @injectable() : orchestre
                                   géocodage + météo (ne dépend que des deux
                                   interfaces ci-dessus, injectées par jeton)
  controllers/forecastController.ts  Handler Express (dépend de ForecastService)
  app.ts                          Assemble les routes Express à partir d'un
                                   ForecastService déjà construit
  server.ts                       Composition root : enregistre chaque jeton
                                   auprès de son implémentation dans le
                                   conteneur tsyringe, puis résout tout le
                                   graphe en un `container.resolve(...)`
```

### IoC/DI avec tsyringe

Le conteneur IoC n'est plus câblé à la main : c'est [tsyringe](https://github.com/microsoft/tsyringe)
qui résout le graphe de dépendances. Deux mécanismes à connaître :

- **`@injectable()`** sur une classe : la rend connue du conteneur, pour
  qu'il puisse l'instancier lui-même.
- **`@inject(TOKEN)`** sur un paramètre de constructeur typé par une
  interface : une interface TypeScript n'existe plus à l'exécution (effacée
  à la compilation), donc le conteneur ne peut pas deviner tout seul quelle
  implémentation correspond à `HttpClient`. On lui donne un jeton explicite
  (`Symbol`, défini dans `di/tokens.ts`), enregistré dans `server.ts` :

```ts
container.registerSingleton(HTTP_CLIENT, FetchHttpClient);
const forecastService = container.resolve(ForecastService);
```

`reflect-metadata` doit être importé une seule fois, avant toute classe
décorée : en tête de `server.ts` pour l'exécution normale, et dans
`tests/setup.ts` (chargé par `vitest.config.ts`) pour les tests.

### Comment ça respecte couplage faible / IoC / DI

- **Aucune classe métier ne fait `new` sur une dépendance concrète.** Chaque
  classe déclare ce dont elle a besoin via une interface dans son
  constructeur (injection par constructeur) et reçoit l'implémentation de
  l'extérieur.
- **Inversion de contrôle** : `ForecastService` ne sait pas que la donnée
  vient de Nominatim/Open-Meteo, seulement qu'il reçoit un `GeocodingService`
  et un `WeatherService`. On peut changer de fournisseur météo sans toucher
  au métier.
- **Un seul composition root** (`server.ts`) connaît les implémentations
  concrètes et les enregistre auprès du conteneur — exactement le rôle du
  conteneur IoC décrit dans le cours (créer les objets, résoudre les
  dépendances en cascade), ici délégué à tsyringe plutôt qu'écrit à la main.
- **Testabilité** : en test, on injecte des faux services
  (`tests/fakes/*`) à la place des implémentations réseau. Aucun test ne
  touche le réseau réel, ni en unitaire ni en end-to-end.

### Tests

- **Unitaires** (`tests/unit`) : chaque classe est testée isolément avec ses
  dépendances remplacées par des fakes (`FakeHttpClient`,
  `FakeGeocodingService`, `FakeWeatherService`).
- **End-to-end** (`tests/e2e`) : une vraie requête HTTP traverse Express →
  contrôleur → `ForecastService`, avec seulement la frontière externe
  (Nominatim/Open-Meteo) remplacée par des fakes injectés dans `createApp`.
  Ça vérifie le câblage réel de l'application, pas seulement chaque brique
  isolément.
