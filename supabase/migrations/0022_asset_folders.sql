-- Asset folders (builder Assets panel → Folders tab).
-- Previously only shipped as apps/nova-builder/scripts/supabase-asset-folders.sql
-- and never applied, so GET /api/assets/folders returned 500 in every project.

CREATE TABLE IF NOT EXISTS asset_folders (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  project_id TEXT NOT NULL,
  parent_id  TEXT REFERENCES asset_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_folders_project
  ON asset_folders(project_id);

-- Accessed only through the service role (server routes), which bypasses RLS.
ALTER TABLE asset_folders ENABLE ROW LEVEL SECURITY;
