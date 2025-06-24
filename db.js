const TABLES = {
  events: 'events',
  users: 'users',
  tickets: 'tickets',
}

// add trigger to update updated_at column automatically
const ON_UPDATE_TIMESTAMP_FUNCTION = `
  CREATE OR REPLACE FUNCTION on_update_timestamp()
  RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
$$ language 'plpgsql';
`

const DROP_ON_UPDATE_TIMESTAMP_FUNCTION = 'DROP FUNCTION on_update_timestamp'

function addIdAndTimestamps(table) {
  table.increments('id').primary()
  table.timestamps(true, true)
}

function onUpdateTrigger(table) {
  return `
CREATE TRIGGER ${table}_updated_at
BEFORE UPDATE ON ${table}
FOR EACH ROW
EXECUTE PROCEDURE on_update_timestamp();
`
}

module.exports = {
  TABLES,
  ON_UPDATE_TIMESTAMP_FUNCTION,
  DROP_ON_UPDATE_TIMESTAMP_FUNCTION,
  addIdAndTimestamps,
  onUpdateTrigger,
}
