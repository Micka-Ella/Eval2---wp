# Architecture et Calcul des Coûts des Tickets

Ce document détaille l'architecture et la logique de gestion des coûts (Super Coûts et Coûts de Réouverture) mis en place dans l'application locale GLPI.

## 1. Structure de la Base de Données

Toutes les informations financières sont consolidées dans une seule table unifiée SQLite nommée `ticket_costs`.

**Structure de `ticket_costs` :**
- `id` : Identifiant unique de la transaction.
- `id_ticket` : Identifiant du ticket dans GLPI.
- `type_cout` : Type de coût (`super_cost` ou `reopen_cost`).
- `cout` : Montant financier calculé.
- `id_item` : Identifiant de l'équipement GLPI ciblé (ex: id du Computer).
- `id_category` : Type de l'équipement (ex: 'Computer', 'Monitor').
- `group_id` : Identifiant de regroupement (timestamp) servant à lier les coûts divisés.

## 2. Insertion et Division des Coûts (Vue Kanban)

Lorsqu'un ticket est clôturé, la logique insère le coût réparti sur chaque équipement rattaché.
1. Récupération de tous les équipements liés au ticket (via `ItemTicketService`).
2. Génération d'un `group_id` unique (`Date.now().toString()`).
3. **Division équitable** : Le montant total saisi par l'utilisateur est divisé par le nombre d'équipements ciblés par ce ticket.
4. **Insertion Multiple** : Pour chaque équipement, une ligne `super_cost` distincte est insérée en base avec son propre `id_item` et le même `group_id`.

*Exemple : Un coût de 100€ saisi pour un ticket contenant 2 ordinateurs générera 2 lignes de 50€.*

## 3. Coûts de Réouverture

Lorsqu'un ticket est réouvert (ex: glissé de "Terminé" vers "En cours"), un pourcentage de majoration est appliqué :
1. Le Backend cherche la dernière ligne `super_cost` rattachée au ticket (`ORDER BY id DESC LIMIT 1`).
2. Il applique le pourcentage sur ce dernier coût.
3. Il insère une nouvelle ligne distincte avec la valeur calculée et `type_cout = 'reopen_cost'`.

*(Note: Le Frontend se charge de boucler sur les équipements du ticket pour calculer la réouverture exacte de chaque machine).*

## 4. Annulation d'un Coût

Le bouton d'annulation permet d'effacer précisément la dernière opération financière liée à un ticket :
1. Le Backend récupère le `group_id` de la dernière ligne insérée.
2. Il exécute un `DELETE` global sur **toutes les lignes** partageant ce même `group_id`.
Cela permet de supprimer parfaitement les coûts qui avaient été répartis et divisés sur plusieurs équipements lors de la clôture.

## 5. Agrégation et Répartition Frontend (Tableau de Bord)

Le calcul global de la dette par équipement est réalisé dynamiquement par `TicketCostRepartition.jsx` :
1. Le système construit une mémoire associative de tous les équipements GLPI.
2. Il récupère la somme totale de chaque type de coûts pour chaque ticket.
3. Pour chaque liaison (Ticket ↔ Équipement), le script calcule la proportion due :
   `Part = (Somme des coûts du ticket) / (Total d'équipements sur le ticket)`
4. La part est accumulée et additionnée sur le compteur total de l'équipement ciblé, ce qui donne la facture globale pour ce `Computer` ou ce `Monitor`.
