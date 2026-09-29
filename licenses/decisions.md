# Décisions de licences

Audit du 2026-09-28 sur le projet du TP3 (aucune dépendance ajoutée). Le scan complet est dans [`licenses.json`](licenses.json), la classification de chaque paquet dans [`licenses.md`](licenses.md), la politique appliquée par la CI dans [`policy.json`](policy.json).

## Conclusion

**Aucun copyleft bloquant.** Sur les 151 paquets analysés (71 en production), il n'y a aucune licence GPL, AGPL ou LGPL, ni en production ni en développement. Les seuls paquets sous copyleft sont deux paquets **MPL-2.0** (fiches 1 et 2), copyleft faible :

- ils sont en **développement uniquement** (`npm ls lightningcss --omit=dev --all` ne renvoie rien, et ils sont absents de [`licenses.production.json`](licenses.production.json)) : ils ne font pas partie de ce qui est déployé ;
- le MPL-2.0 n'impose d'obligation que si l'on **distribue** le code MPL après l'avoir **modifié** : ici il n'est ni distribué ni modifié ;
- la CI garantit que cela reste vrai : le MPL-2.0 est refusé dès qu'un paquet passe en production.

Le détail du raisonnement est dans les fiches ci-dessous.

## Politique retenue

| Famille | Licences | Règle |
|---|---|---|
| Permissive | MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, 0BSD | Liste blanche, autorisée partout |
| Copyleft faible | MPL-2.0 | Autorisée uniquement dans les dépendances de développement (fiches 1 et 2) |
| Copyleft fort | GPL, AGPL, LGPL (toutes variantes) | Refusée partout |
| Propriétaire, non identifiée, déduite par l'outil (`MIT*`, `Custom: ...`, `UNKNOWN`, `UNLICENSED`) | | Refusée : tout ajout exige une revue et une fiche |

Une licence permissive absente de la liste blanche (par exemple `Unlicense`) est refusée aussi : l'ajouter à la liste est une décision explicite, pas un effet de bord.

Deux règles de lecture des expressions SPDX : `A OR B` est accepté si l'un des termes est autorisé (on choisit l'alternative permissive), `A AND B` seulement si tous le sont.

### Pourquoi l'évaluation de la liste blanche n'est pas confiée à `--onlyAllow`

`license-checker` est utilisé pour le scan, comme demandé. En revanche son option `--onlyAllow` teste la liste blanche par **recherche de sous-chaîne** (`indexOf` dans `lib/index.js`) : un paquet sous `MIT AND GPL-3.0` contient « MIT » et passerait. L'évaluation est donc faite par `tools/licenses/`, qui lit le JSON du scan, analyse l'expression SPDX et compare les identifiants exactement. Ce comportement est couvert par `tests/unit/spdx.test.ts` et `tests/unit/licenseAudit.test.ts`.

## Fiche 1 : `lightningcss@1.33.0`

| | |
|---|---|
| Licence | MPL-2.0 (copyleft faible, au niveau du fichier) |
| Position dans l'arbre | Transitive, profondeur 3 : `meteoapi` → `vitest@5.0.1` (dépendance directe de développement, profondeur 1) → `vite@8.3.0` (2) → `lightningcss@1.33.0` (3) |
| Portée | Développement uniquement. `npm ls lightningcss --omit=dev --all` ne renvoie rien, et le paquet est absent de [`licenses.production.json`](licenses.production.json) |
| Décision | **Accepté, exception limitée au développement** |
| Stratégie retenue | **Isoler** |

**Obligations MPL-2.0.** Elles ne se déclenchent que lorsqu'on distribue du code MPL : il faut alors fournir les sources des fichiers MPL modifiés. Ici le paquet n'est ni modifié ni distribué (il sert à `vite` pendant les tests), donc aucune obligation n'est déclenchée.

**Justification au regard de l'architecture.** Le domaine, les services et les adaptateurs ne l'appellent jamais : `src/` n'importe ni `vite` ni `lightningcss`, qui n'existent que comme outillage de `vitest`. Il n'y a donc pas d'interface applicative à placer devant (`GeocodingService`, `WeatherService`… n'ont rien à isoler ici). La frontière qui isole le code MPL est celle du **packaging** : `devDependencies` d'un côté, `dependencies` de l'autre. L'artefact déployé (`dist/` et les dépendances de production) ne contient pas `lightningcss`. Cette frontière est vérifiée à chaque build : la CI classe chaque paquet en production ou en développement, et l'exception MPL-2.0 est refusée dès qu'un paquet est en production (test `refuse MPL-2.0 dans les dépendances de production`).

**Options écartées.**
- Réécrire : n'a pas de sens pour un outil tiers d'infrastructure de test.
- Substituer par un équivalent permissif : passer à une autre version majeure de `vitest`/`vite` pour retirer une dépendance de développement non distribuée coûterait plus cher que le risque, qui est nul dans l'état actuel.
- Négocier une licence alternative : sans objet pour un composant de la communauté sous licence standard.

**À réexaminer si :** `lightningcss` ou `vite` devient une dépendance de production ; un artefact contenant l'outillage de test est distribué (image Docker de développement, bundle) ; des fichiers de `lightningcss` sont modifiés localement (patch).

## Fiche 2 : `lightningcss-darwin-arm64@1.33.0`

| | |
|---|---|
| Licence | MPL-2.0 (copyleft faible) |
| Position dans l'arbre | Transitive, profondeur 4 : `meteoapi` → `vitest` (1) → `vite` (2) → `lightningcss` (3) → `lightningcss-darwin-arm64` (4). C'est un binaire natif, dépendance optionnelle de `lightningcss` |
| Portée | Développement uniquement |
| Décision | **Accepté, même exception que la fiche 1** |
| Stratégie retenue | **Isoler** (même frontière de packaging) |

Le paquet installé dépend du système : `lightningcss-darwin-arm64` sur ce poste, `lightningcss-linux-x64-gnu` sur le runner de CI, etc. Toutes les variantes ont la même licence et la même position. C'est pourquoi l'exception est écrite au niveau de la **licence, en portée développement** (`allowed.developmentOnly` dans [`policy.json`](policy.json)) et non paquet par paquet : une liste de noms serait fausse sur toute autre plateforme.

## Constats sans décision

- **`meteoapi@1.0.0` : « Custom: https://adresse.data.gouv.fr »**. C'est le projet lui-même, pas une dépendance : faute de fichier `LICENSE`, l'outil a deviné une licence à partir d'un lien du `README.md`. Le projet est marqué `private: true` et exclu du scan (`--excludePrivatePackages`). Ce faux positif illustre pourquoi les licences `Custom` ou déduites sont refusées par la politique.
- **`tslib@1.14.1` : 0BSD**. Dépendance transitive de **production** (`tsyringe` → `tslib`, profondeur 2). Licence permissive quasi domaine public, ajoutée à la liste blanche.

## Vérification du garde-fou (critère de réussite)

Paquet de test : `libsignal@6.0.0`, licence `GPL-3.0`, sans script d'installation, installé avec `--ignore-scripts`.

| Étape | Commande | Résultat |
|---|---|---|
| État de départ | `npm run licenses` | 151 paquets (71 en production), 0 violation, code de sortie 0 |
| GPL en développement | `npm install --save-dev --ignore-scripts libsignal@6.0.0` puis `npm run licenses` | `LICENCE REFUSEE : libsignal@6.0.0 (GPL-3.0, development) - licence copyleft absente de la liste blanche`, code de sortie **1** |
| GPL en production | `npm install --save --ignore-scripts libsignal@6.0.0` puis `npm run licenses` | `LICENCE REFUSEE : libsignal@6.0.0 (GPL-3.0, production) - licence copyleft absente de la liste blanche`, code de sortie **1** |
| Retrait | `npm uninstall libsignal` puis `npm run licenses` | `package.json` et `package-lock.json` identiques à l'état de départ, 151 paquets, 0 violation, code de sortie 0 |

## Limites

- Le scan reflète les paquets installés sur la machine qui l'exécute : les binaires natifs optionnels changent d'un système à l'autre. La CI (Linux) est la référence ; `licenses.md` committé vient d'un poste macOS.
- L'outil lit les licences **déclarées** par les paquets. Il ne vérifie pas le contenu des fichiers `LICENSE`.
- Les licences permissives imposent de conserver les mentions de copyright si l'on redistribue les dépendances : ce n'est pas automatisé ici.

## Modèle de fiche

Pour tout futur cas copyleft, non identifié ou propriétaire : nom et version, licence et famille, position (directe ou transitive, profondeur, chaîne `npm ls`), portée (production ou développement), stratégie parmi *réécrire / substituer / isoler / négocier*, justification au regard de l'architecture, options écartées, conditions de réexamen.
