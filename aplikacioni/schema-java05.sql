-- MANUAL ONLY: review and run in your own Week 4 lab database.
-- The application does not execute this migration at startup.
BEGIN;
CREATE TABLE IF NOT EXISTS profilet (
  github_id TEXT PRIMARY KEY,
  emri TEXT NOT NULL,
  roli TEXT NOT NULL DEFAULT 'udhetar' CHECK (roli IN ('udhetar', 'shofer'))
);
ALTER TABLE udhetimet ADD COLUMN IF NOT EXISTS shofer_id TEXT REFERENCES profilet(github_id);
INSERT INTO profilet (github_id, emri, roli)
VALUES ('DEMO-SHOFER-2', 'Shoferi tjetër (demo)', 'shofer')
ON CONFLICT (github_id) DO NOTHING;
UPDATE udhetimet SET shofer_id = 'DEMO-SHOFER-2'
WHERE id = 1 AND shofer_id IS NULL;
COMMIT;
SELECT id, ora, shofer_id FROM udhetimet ORDER BY id;

-- After your first real GitHub login, run these separately in Neon,
-- replacing SHENO_ID_TENDE with the numeric GitHub ID shown in /panel:
-- UPDATE profilet SET roli = 'shofer' WHERE github_id = 'SHENO_ID_TENDE';
-- UPDATE udhetimet SET shofer_id = 'SHENO_ID_TENDE' WHERE id = 2;
