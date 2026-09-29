# API Météo

API qui reçoit une adresse postale en `GET` et renvoie les prévisions météo du
lieu, en enchaînant deux services externes :

- **Géocodage** : [BAN](https://adresse.data.gouv.fr) (défaut, souverain) ou [Nominatim](https://nominatim.openstreetmap.org) (adresse → latitude/longitude)
- **Météo** : [Open-Meteo](https://api.open-meteo.com) (défaut) ou [MET Norway](https://api.met.no) (latitude/longitude → prévisions horaires)

## Lancer le projet

```bash
npm install
cp .env.example .env   # si pas déjà fait
npm run dev
```

```
GET http://localhost:3000/forecast?address=Alès
GET http://localhost:3000/forecast?address=Alès&demo=true
```

Avec `demo=true`, l'API renvoie des données simulées et n'appelle aucun
service externe. La réponse a toujours la même structure, quel que soit le
fournisseur actif ou le mode démo :

```json
{
  "address": "Alès",
  "latitude": 44.1279,
  "longitude": 4.0817,
  "hourly": [{ "time": "2025-06-10T14:00:00Z", "temperatureCelsius": 24.3 }]
}
```

## Configuration (`.env`)

Toutes les variables d'environnement sont lues à un seul endroit,
[`src/config/env.ts`](src/config/env.ts), avec leurs valeurs par défaut
(`ENV_DEFAULTS`) — c'est la référence pour savoir ce qu'on peut mettre dans
`.env`. `npm run dev`/`npm run start` le chargent via le flag natif Node
`--env-file-if-exists` (aucune dépendance `dotenv`).

| Variable             | Défaut       | Rôle                                                                 |
|----------------------|--------------|----------------------------------------------------------------------|
| `PORT`               | `3000`       | Port d'écoute HTTP                                                   |
| `HTTP_USER_AGENT`    | voir `env.ts`| En-tête `User-Agent` envoyé aux services externes (rejet 403 sans contact identifiable) |
| `GEOCODING_PROVIDER` | `ban`        | `ban` \| `nominatim` (clés de `GEOCODING_PROVIDER_REGISTRY`)          |
| `WEATHER_PROVIDER`   | `open-meteo` | `open-meteo` \| `met-norway` (clés de `WEATHER_PROVIDER_REGISTRY`)   |

Une variable d'environnement réelle (`WEATHER_PROVIDER=met-norway npm run start`)
prend toujours le dessus sur `.env`, sans qu'il faille l'éditer.

## Tests

```bash
npm test          # unitaires + end-to-end
npm run test:unit
npm run test:e2e
```

## Conformité des licences (TP4)

Toutes les dépendances, transitives comprises, sont auditées à chaque build.

```bash
npm run licenses       # scan (license-checker) + audit ; code de sortie 1 en cas de violation
```

- [`licenses/licenses.json`](licenses/licenses.json) : scan brut de tout l'arbre
  (et `licenses.production.json` pour les seules dépendances de production).
- [`licenses/licenses.md`](licenses/licenses.md) : classification de chaque paquet
  (permissive, copyleft, propriétaire, non identifiée), générée.
- [`licenses/decisions.md`](licenses/decisions.md) : politique, fiches de décision
  et preuve du garde-fou (ajout puis retrait d'un paquet GPL).
- [`licenses/policy.json`](licenses/policy.json) : liste blanche et familles.
- `.github/workflows/ci.yml` : la CI lance `lint`, `build`, `test`, puis
  l'audit des licences dans un job séparé.

Le code de l'audit est dans `tools/licenses/` (hors `src/`, donc absent de
l'artefact déployé).

## Architecture

Architecture en couches, chaque couche ne dépendant que d'**abstractions**
(interfaces) fournies par la couche du dessous, jamais d'implémentations
concrètes — cf. cours J1 sur le couplage, l'IoC et la DI.

```
src/
  domain/types.ts                 Types métier + erreurs (Coordinates, Forecast, ...)
  config/
    env.ts                        Seul endroit qui lit process.env, avec défauts
    providers.ts                  Registre fournisseur -> classe + validation
  di/tokens.ts                    Jetons d'injection tsyringe (Symbol) pour
                                   les dépendances typées par interface, et
                                   pour la config injectée (HTTP_USER_AGENT)
  http/
    HttpClient.ts                 Interface : abstraction du transport HTTP
    FetchHttpClient.ts            Seule implémentation concrète (fetch), @injectable()
  services/
    GeocodingService.ts / WeatherService.ts   Interfaces (abstractions)
    NominatimGeocodingService.ts / BanGeocodingService.ts       Implémentations géocodage
    OpenMeteoWeatherService.ts / MetNorwayWeatherService.ts     Implémentations météo
    CachingGeocodingService.ts    Décorateur de GeocodingService : cache par adresse
    DemoGeocodingService.ts / DemoWeatherService.ts   Implémentations simulées (mode démo)
    ForecastService.ts            Couche métier, @injectable() : orchestre
                                   géocodage + météo (ne dépend que des deux
                                   interfaces ci-dessus, injectées par jeton)
  cache/
    Cache.ts                      Interface : abstraction du cache (async, clé/valeur)
    InMemoryCache.ts              Implémentation en mémoire (état d'instance, pas de static)
  controllers/
    forecastController.ts         Handler Express : choisit le service réel ou de démo
    forecastResponse.ts           Présentateur : modèle du domaine -> format de sortie unifié
  app.ts                          Assemble les routes Express à partir de
                                   ForecastService déjà construits (réel et démo)
  server.ts                       Composition root : lit la config, enregistre
                                   chaque jeton auprès de son implémentation
                                   (via le registre de config/providers.ts)
                                   dans le conteneur tsyringe, puis résout tout
                                   le graphe en un `container.resolve(...)` —
                                   ne référence aucune classe d'adaptateur
                                   par son nom
```

### IoC/DI avec tsyringe

Le conteneur IoC est [tsyringe](https://github.com/microsoft/tsyringe), qui
résout le graphe de dépendances. Deux mécanismes à connaître :

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

### Changer de fournisseur

Le choix du fournisseur se fait par variable d'environnement, via un registre
(`config/providers.ts`) qui associe un nom à une classe. Ajouter un
fournisseur = un nouveau fichier adaptateur + une ligne dans le registre :
`server.ts`, `ForecastService` et le contrôleur ne changent pas.

### Coût du changement : du TP1 au TP2

Passer à un géocodeur souverain et à un second fournisseur météo n'a demandé
que des ajouts : deux nouveaux adaptateurs (`BanGeocodingService`,
`MetNorwayWeatherService`), leurs tests, deux lignes dans le registre de
`config/providers.ts` et le défaut de `GEOCODING_PROVIDER`. `server.ts`,
`ForecastService`, le contrôleur et les types du domaine n'ont pas bougé.

Les objets propres à chaque API (DTO, noms de champs, ordre `[lon, lat]` de
la BAN, `timeseries` de MET Norway) restent privés à leur adaptateur : les
tests de contrat vérifient que seuls `latitude`/`longitude` et les variables
du domaine sortent des adaptateurs.

### Mode démo, cache et format de sortie (TP3)

Trois besoins transverses, résolus avec des patrons classiques plutôt qu'en
modifiant les services existants :

- **Mode démo (Strategy)** : `DemoGeocodingService` et `DemoWeatherService`
  implémentent les mêmes interfaces que les vrais adaptateurs. Un conteneur
  enfant tsyringe surcharge les deux jetons et fournit un second
  `ForecastService` qui, par construction, ne peut appeler aucun service
  externe. Le contrôleur choisit l'un ou l'autre selon `demo=true`.
- **Cache (Decorator)** : `CachingGeocodingService` enveloppe le géocodeur
  actif (jeton `UNCACHED_GEOCODING_SERVICE`) et s'appuie sur l'abstraction
  `Cache`. L'implémentation (`InMemoryCache`) est un singleton du conteneur,
  sans `static` : la remplacer (TTL, LRU, Redis...) = une nouvelle classe
  `Cache` et une ligne dans `server.ts`. Les erreurs ne sont pas mises en
  cache, les adresses introuvables le sont.
- **Format unifié (Adapter/Presenter)** : chaque adaptateur normalise déjà ses
  données vers le modèle du domaine (horodatages en ISO 8601 UTC compris) ;
  `toForecastResponse` est ensuite le seul endroit qui décide de la forme
  publique de la réponse. Le contrat de l'API est ainsi découplé du modèle
  interne et identique pour tous les fournisseurs.

### Comment ça respecte couplage faible / IoC / DI

- **Aucune classe métier ne fait `new` sur une dépendance concrète.** Chaque
  classe déclare ce dont elle a besoin via une interface dans son
  constructeur (injection par constructeur) et reçoit l'implémentation de
  l'extérieur.
- **Inversion de contrôle** : `ForecastService` ne sait pas que la donnée
  vient de Nominatim/Open-Meteo, seulement qu'il reçoit un `GeocodingService`
  et un `WeatherService`. On peut changer de fournisseur sans toucher au
  métier.
- **Un seul composition root** (`server.ts`) enregistre les implémentations
  auprès du conteneur — exactement le rôle du conteneur IoC décrit dans le
  cours (créer les objets, résoudre les dépendances en cascade).
- **Aucune dépendance cachée** : `process.env` n'est lu qu'à un endroit
  (`config/env.ts`), et la valeur est injectée là où elle sert.
- **Testabilité** : en test, on injecte des faux services
  (`tests/fakes/*`) à la place des implémentations réseau. Aucun test ne
  touche le réseau réel, ni en unitaire ni en end-to-end.

### Tests

- **Unitaires** (`tests/unit`) : chaque classe est testée isolément avec ses
  dépendances remplacées par des fakes (`FakeHttpClient`,
  `FakeGeocodingService`, `FakeWeatherService`).
- **Contrat** (`tests/contract`) : une suite unique par abstraction
  (`GeocodingService`, `WeatherService`), exécutée contre chaque
  implémentation avec des réponses HTTP simulées : adresse valide, adresse
  introuvable, réponse vide, caractères accentués.
- **End-to-end** (`tests/e2e`) : une vraie requête HTTP traverse Express →
  contrôleur → `ForecastService`, avec seulement la frontière externe
  (Nominatim/Open-Meteo) remplacée par des fakes injectés dans `createApp`.
  Ça vérifie le câblage réel de l'application, pas seulement chaque brique
  isolément. `unifiedFormat.e2e.test.ts` vérifie, pour chaque combinaison de
  fournisseurs du registre et pour le mode démo, que la structure de la
  réponse est identique, et que deux appels sur la même adresse ne
  déclenchent qu'un seul appel de géocodage.
