-- Java 4 — AAB RideShare / PostgreSQL (Neon)
-- Dokumenton skemën ekzistuese; nuk nevojitet të ekzekutohet për të nisur aplikacionin.
-- Mund të ekzekutohet përsëri pa fshirë apo mbishkruar udhëtimet ekzistuese.

BEGIN;

CREATE TABLE IF NOT EXISTS udhetimet (
    id INTEGER PRIMARY KEY,
    nisja VARCHAR(100) NOT NULL,
    destinacioni VARCHAR(100) NOT NULL,
    ora TIME NOT NULL,
    cmimi NUMERIC(6,2) NOT NULL,
    vendet_e_lira INTEGER NOT NULL
        CHECK (vendet_e_lira >= 0)
);

INSERT INTO udhetimet (id, nisja, destinacioni, ora, cmimi, vendet_e_lira)
VALUES
    (1, 'Prishtinë', 'AAB', '08:00', 2.00, 2),
    (2, 'Fushë Kosovë', 'AAB', '08:15', 2.00, 1),
    (3, 'Lipjan', 'AAB', '07:45', 3.00, 0)
ON CONFLICT (id) DO NOTHING;

COMMIT;
