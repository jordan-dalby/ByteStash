export const up = (db) => {
  console.log('Creating user_credit_settings table...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_credit_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      balance REAL DEFAULT 0,
      manual_balance REAL DEFAULT 0,
      last_updated TEXT NOT NULL,
      auto_track_usage INTEGER DEFAULT 1,
      low_balance_threshold REAL DEFAULT 5.0,
      critical_balance_threshold REAL DEFAULT 1.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id)
    )
  `);
  
  console.log('✅ user_credit_settings table created successfully');
};

export const down = (db) => {
  console.log('Dropping user_credit_settings table...');
  db.exec('DROP TABLE IF EXISTS user_credit_settings');
  console.log('✅ user_credit_settings table dropped successfully');
}; 