-- Beli-style category breakdown per visit (each 1.00-10.00; their sum is the
-- visit's 10.00-100.00 total). visits.score stays the app's canonical 0-10
-- figure, now derived from this breakdown and then nudged by the comparison
-- ranking flow in the app rather than picked from a fixed good/fine/bad map.
alter table visits add column category_scores jsonb not null default '{
  "coffeePrice": 5.5, "location": 5.5, "ambience": 5.5, "music": 5.5,
  "aesthetic": 5.5, "coffeeTaste": 5.5, "furniture": 5.5, "lighting": 5.5,
  "food": 5.5, "people": 5.5
}'::jsonb;
